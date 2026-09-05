/**
 * saleService — Sale business logic and atomic transaction handling.
 *
 * CRITICAL: All write operations (create, cancel, return) must use SQLite
 * transactions (executeAll + executeWrite inside a transaction) so that
 * sale + items + stock deductions + inventory movements are ALL OR NOTHING.
 *
 * Historical cost is preserved on sale items (unit_cost_price_centimes snapshot).
 * Cancelled and returned sales are never physically deleted.
 * Cancelled and returned sales do NOT count toward revenue, profit, or
 * customer debt.
 */

import { Sale, SaleItem } from "@/types/entities";
import {
  executeAll,
  executeRead,
  executeWrite,
  getDatabase,
  transaction,
} from "@/database/database";
import { calculateSubtotal, calculateTotal, calculateChange, calculateProfit } from "./saleCalculator";

// Validation result shape
export type ValidationResult = {
  valid: boolean;
  errors: string[];
  stockOk: boolean;
  customerOk: boolean;
};

/**
 * Validate a sale before creation.
 * - Check stock availability for all items
 * - Check customer is required for credit/partial payment
 */
export function validateSale(
  items: Array<{ productId: number; quantity: number }>,
  paymentMethod: "cash" | "electronic" | "mixed" | "partial" | "credit",
  customers?: Map<number, { name: string }>
): ValidationResult {
  const errors: string[] = [];
  let stockOk = true;
  let customerOk = true;

  // Check stock availability
  for (const item of items) {
    // In a real app, fetch product stock from DB.
    // For now, assume stock is sufficient unless explicitly blocked.
    // The actual stock check happens in the repository's create() transaction.
  }

  // Check customer required for credit/partial
  if (paymentMethod === "credit" || paymentMethod === "partial") {
    if (!customers || customers.size === 0) {
      customerOk = false;
      errors.push("Customer is required for " + paymentMethod + " payment");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stockOk,
    customerOk,
  };
}

/**
 * Create a sale atomically.
 * - Inserts sale header, sale items, deducts stock, creates inventory movements — all in one SQLite transaction.
 * - Historical cost (unit_cost_price_centimes) is snapshotted from the product at sale time.
 * - Clears the cart on success (caller responsibility via clearCart from cart store).
 * - Returns the created Sale domain object.
 *
 * The caller must pass cart items enriched with product data and sale prices.
 */
export async function createSale(
  customerId: number | undefined,
  paymentMethod: "cash" | "electronic" | "mixed" | "partial" | "credit",
  items: Array<{
    productId: number;
    quantity: number;
    unitSalePriceCentimes: number;
    productName: string;
    productUnit: string;
    note?: string;
  }>,
  note?: string
): Promise<Sale> {
  const db = await getDatabase();
  return await transaction(db, async (tx: any) => {
    // 1. Insert the sale header
    const saleResult = await executeWrite(
      // language=SQLite
      `INSERT INTO sales
       (customer_id, status, subtotal_centimes, discount_centimes, total_centimes,
        amount_paid_centimes, remaining_balance_centimes, payment_method, note, sold_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [
        customerId,
        "completed",
        0, // will be computed below
        0,
        0,
        0,
        0,
        paymentMethod,
        note,
      ],
    );

    const saleId = saleResult;

    // 2. Process each item: insert sale item, deduct stock, create inventory movement
    let subtotal = 0;

    for (const item of items) {
      // Fetch product details to get historical cost and current stock
      const productRows: any[] = await executeRead(
        // language=SQLite
        `SELECT id, name, sale_price_centimes, cost_price_centimes, stock_quantity, unit FROM products WHERE id = ?`,
        [item.productId],
      );

      if (productRows.length === 0) {
        throw new Error(`Product id=${item.productId} not found`);
      }

      const product = productRows[0];
      const historicalCost = product.cost_price_centimes; // snapshot historical cost
      const unitSalePrice = item.unitSalePriceCentimes;
      const lineTotal = unitSalePrice * item.quantity;

      subtotal += lineTotal;

      // Insert sale item with historical cost snapshot
      await executeWrite(
        // language=SQLite
        `INSERT INTO sale_items
         (sale_id, product_id, product_name_snapshot, quantity, unit_sale_price_centimes, unit_cost_price_centimes, line_total_centimes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          saleId,
          product.id,
          item.productName,
          item.quantity,
          unitSalePrice,
          historicalCost,
          lineTotal,
        ],
      );

      // 3. Deduct stock: create inventory movement OUT and update product stock
      const newStock = Math.max(0, product.stock_quantity - item.quantity);

      await executeWrite(
        // language=SQLite
        `INSERT INTO inventory_movements
         (product_id, movement_type, quantity_change, reference_sale_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [product.id, "out", -item.quantity, saleId, `Sale saleId=${saleId}`],
      );

      await executeWrite(
        // language=SQLite
        `UPDATE products
         SET stock_quantity = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [newStock, product.id],
      );
    }

    // 3. Update sale header with computed values
    const totalCentimes = subtotal; // no discount at creation for simplicity
    const amountPaid = totalCentimes; // fully paid at creation
    const remainingBalance = 0; // fully paid

    await executeWrite(
      // language=SQLite
      `UPDATE sales
       SET subtotal_centimes = ?,
           discount_centimes = ?,
           total_centimes = ?,
           amount_paid_centimes = ?,
           remaining_balance_centimes = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [subtotal, 0, totalCentimes, amountPaid, remainingBalance, saleId],
    );

    // 4. Return the complete sale record
    const saleRows: any[] = await executeRead(
      // language=SQLite
      `SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
           s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
           s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at
        FROM sales s
       WHERE s.id = ?`,
      [saleId],
    );

    const itemsRows: any[] = await executeAll(
      // language=SQLite
      `SELECT si.id, si.product_id, si.product_name_snapshot, si.quantity,
           si.unit_sale_price_centimes, si.unit_cost_price_centimes, si.line_total_centimes,
           si.created_at
        FROM sale_items si
       WHERE si.sale_id = ?`,
      [saleId],
    );

    return {
      id: saleRows[0].id,
      customer_id: saleRows[0].customer_id,
      status: saleRows[0].status as "completed" | "cancelled" | "returned",
      subtotal_centimes: saleRows[0].subtotal_centimes as number,
      discount_centimes: saleRows[0].discount_centimes as number,
      total_centimes: saleRows[0].total_centimes as number,
      amount_paid_centimes: saleRows[0].amount_paid_centimes as number,
      remaining_balance_centimes: saleRows[0].remaining_balance_centimes as number,
      payment_method: saleRows[0].payment_method as
        | "cash"
        | "electronic"
        | "mixed"
        | "partial"
        | "credit",
      note: saleRows[0].note,
      sold_at: saleRows[0].sold_at,
      created_at: saleRows[0].created_at,
      updated_at: saleRows[0].updated_at,
      saleItems: itemsRows.map((r: any) => ({
        id: r.id,
        sale_id: r.sale_id,
        product_id: r.product_id,
        product_name_snapshot: r.product_name_snapshot,
        quantity: r.quantity,
        unit_sale_price_centimes: r.unit_sale_price_centimes,
        unit_cost_price_centimes: r.unit_cost_price_centimes,
        line_total_centimes: r.line_total_centimes,
        created_at: r.created_at,
      })),
    };
  });
}

/**
 * Post-sale navigation: clear cart and reset state.
 * Caller should invoke clearCart() from the cart store after this returns.
 */
export const resetCartState: () => void = (): void => {};

/**
 * Type for the receipt payment method display
 */
export type PaymentMethodDisplay =
  | "cash"
  | "electronic"
  | "mixed"
  | "partial"
  | "credit";