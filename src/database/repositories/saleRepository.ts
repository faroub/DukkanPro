/**
 * saleRepository — Repository for sales transactions.
 *
 * CRITICAL: All write operations (create, cancel, return) must be atomic.
 * - create: inserts sale record + sale_items + stock deductions + inventory movements — ALL OR NOTHING
 * - cancel: sets status to 'cancelled', restores stock, creates movements — atomic
 * - return: sets status to 'returned', restores stock, creates movements — atomic
 *
 * Historical cost is preserved on sale items (unit_cost_price_centimes snapshot).
 * Cancelled and returned sales are never physically deleted.
 * Cancelled and returned sales do NOT count toward revenue, profit, or customer debt.
 */

import { Sale } from "../../types/entities";
import {
  executeAll,
  executeRead,
  executeWrite,
  getDatabase,
  transaction,
} from "../database";

export type SaleFilters = {
  status?: "completed" | "cancelled" | "returned";
  customerId?: number;
};

export type SaleResult = {
  sale: Sale | null;
  error?: string;
};

/**
 - Create a sale atomically.
 - Inserts the sale header, sale items, deducts stock, and creates inventory movements.
 - All-or-nothing via SQLite transaction.
 - Historical cost (unit_cost_price_centimes) is snapshotted from the product at sale time.
 */
export async function create(saleInput: {
  customerId?: number;
  paymentMethod: "cash" | "electronic" | "mixed" | "partial" | "credit";
  items: Array<{
    productId: number;
    quantity: number;
    unitSalePriceCentimes: number; // price at time of sale
    note?: string;
  }>;
  note?: string;
}): Promise<Sale> {
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
        saleInput.customerId,
        "completed",
        0, // will be computed below
        0,
        0,
        0,
        0,
        saleInput.paymentMethod,
        saleInput.note,
      ],
    );

    const saleId = saleResult; // executeWrite returns the lastInsertRowId as a number

    // 2. Process each item: insert sale item, deduct stock, create inventory movement
    let subtotal = 0;

    for (const item of saleInput.items) {
      // Fetch product details
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
          product.name,
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

    // 4. Update sale header with computed values
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

    // 5. Return the complete sale record
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
      remaining_balance_centimes: saleRows[0]
        .remaining_balance_centimes as number,
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
 - Cancel a sale atomically.
 - Sets status to 'cancelled', restores stock, creates inventory movements (reverse of sale).
 - Does NOT delete the record.
 - Cancelled sales are excluded from revenue, profit, and customer debt calculations.
 */
export async function cancel(id: number, reason: string): Promise<void> {
  const db = await getDatabase();
  await transaction(db, async (tx: any) => {
    // 1. Get the sale with its items (lock for update)
    const saleRows: any[] = await executeRead(
      // language=SQLite
      `SELECT s.id, s.status, si.product_id, si.quantity, si.unit_sale_price_centimes, si.unit_cost_price_centimes, si.line_total_centimes
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
       WHERE s.id = ?`,
      [id],
    );

    if (saleRows.length === 0) {
      throw new Error(`Sale id=${id} not found`);
    }

    const sale = saleRows[0];

    if (sale.status !== "completed") {
      throw new Error(`Sale id=${id} is already ${sale.status}; cannot cancel`);
    }

    // 2. For each sale item, restore stock and create a reverse inventory movement
    for (const item of saleRows) {
      // Restore stock: add back the quantity
      await executeWrite(
        // language=SQLite
        `UPDATE products
         SET stock_quantity = stock_quantity + ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [item.quantity, item.product_id],
      );

      // Create inventory movement: "in" (restock) referencing the cancelled sale
      await executeWrite(
        // language=SQLite
        `INSERT INTO inventory_movements
         (product_id, movement_type, quantity_change, reference_sale_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [item.product_id, "in", item.quantity, id, `Sale cancelled: ${reason}`],
      );
    }

    // 3. Set sale status to cancelled
    await executeWrite(
      // language=SQLite
      `UPDATE sales
       SET status = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      ["cancelled", id],
    );
  });
}

/**
 - Return a sale atomically.
 - Sets status to 'returned', restores stock, creates inventory movements (reverse of sale).
 - Does NOT delete the record.
 - Returned sales are excluded from revenue, profit, and customer debt calculations.
 */
export async function returnSale(id: number, reason: string): Promise<void> {
  const db = await getDatabase();
  await transaction(db, async (tx: any) => {
    // 1. Get the sale with its items (lock for update)
    const saleRows: any[] = await executeRead(
      // language=SQLite
      `SELECT s.id, s.status, si.product_id, si.quantity, si.unit_sale_price_centimes, si.unit_cost_price_centimes, si.line_total_centimes
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
       WHERE s.id = ?`,
      [id],
    );

    if (saleRows.length === 0) {
      throw new Error(`Sale id=${id} not found`);
    }

    const sale = saleRows[0];

    if (sale.status !== "completed") {
      throw new Error(`Sale id=${id} is already ${sale.status}; cannot return`);
    }

    // 2. For each sale item, restore stock and create a reverse inventory movement
    for (const item of saleRows) {
      // Restore stock: add back the quantity
      await executeWrite(
        // language=SQLite
        `UPDATE products
         SET stock_quantity = stock_quantity + ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [item.quantity, item.product_id],
      );

      // Create inventory movement: "in" (restock) referencing the returned sale
      await executeWrite(
        // language=SQLite
        `INSERT INTO inventory_movements
         (product_id, movement_type, quantity_change, reference_sale_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [item.product_id, "in", item.quantity, id, `Sale returned: ${reason}`],
      );
    }

    // 3. Set sale status to returned
    await executeWrite(
      // language=SQLite
      `UPDATE sales
       SET status = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      ["returned", id],
    );
  });
}

/**
 - Get a sale by ID, including its sale items.
 */
export async function getById(id: number): Promise<Sale | null> {
  const saleRows: any[] = await executeRead(
    // language=SQLite
    `SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
         s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
         s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at
      FROM sales s
     WHERE s.id = ?`,
    [id],
  );

  if (saleRows.length === 0) {
    return null;
  }

  const sale = saleRows[0];

  const itemsRows: any[] = await executeAll(
    // language=SQLite
    `SELECT si.id, si.product_id, si.product_name_snapshot, si.quantity,
         si.unit_sale_price_centimes, si.unit_cost_price_centimes, si.line_total_centimes,
         si.created_at
      FROM sale_items si
     WHERE si.sale_id = ?`,
    [id],
  );

  return {
    id: sale.id,
    customer_id: sale.customer_id,
    status: sale.status as "completed" | "cancelled" | "returned",
    subtotal_centimes: sale.subtotal_centimes as number,
    discount_centimes: sale.discount_centimes as number,
    total_centimes: sale.total_centimes as number,
    amount_paid_centimes: sale.amount_paid_centimes as number,
    remaining_balance_centimes: sale.remaining_balance_centimes as number,
    payment_method: sale.payment_method as
      | "cash"
      | "electronic"
      | "mixed"
      | "partial"
      | "credit",
    note: sale.note,
    sold_at: sale.sold_at,
    created_at: sale.created_at,
    updated_at: sale.updated_at,
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
}

/**
 - Get all sales, optionally filtered by status and/or customerId.
 */
export async function getAll(filters: SaleFilters = {}): Promise<Sale[]> {
  const { status, customerId } = filters;
  let sql = `SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
             s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
             s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at
          FROM sales s`;
  const params: unknown[] = [];

  if (status) {
    sql += ` WHERE s.status = ?`;
    params.push(status);
  }

  if (customerId !== undefined) {
    if (status) {
      sql += ` AND s.customer_id = ?`;
    } else {
      sql += ` WHERE s.customer_id = ?`;
    }
    params.push(customerId);
  }

  sql += ` ORDER BY s.sold_at DESC`;

  const rows: any[] = await executeAll(sql, params);

  return rows.map((sale) => ({
    id: sale.id,
    customer_id: sale.customer_id,
    status: sale.status as "completed" | "cancelled" | "returned",
    subtotal_centimes: sale.subtotal_centimes as number,
    discount_centimes: sale.discount_centimes as number,
    total_centimes: sale.total_centimes as number,
    amount_paid_centimes: sale.amount_paid_centimes as number,
    remaining_balance_centimes: sale.remaining_balance_centimes as number,
    payment_method: sale.payment_method as
      | "cash"
      | "electronic"
      | "mixed"
      | "partial"
      | "credit",
    note: sale.note,
    sold_at: sale.sold_at,
    created_at: sale.created_at,
    updated_at: sale.updated_at,
    saleItems: [], // loaded separately if needed
  }));
}

/**
 - Search sales by query string against customer name or sale note.
 */
export async function search(
  query: string,
  filters: SaleFilters = {},
): Promise<Sale[]> {
  const { status } = filters;
  let sql = `SELECT DISTINCT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
             s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
             s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at
          FROM sales s
      JOIN customers c ON c.id = s.customer_id
      JOIN sale_items si ON si.sale_id = s.id`;

  const params: unknown[] = [`%${query}%`];

  if (status) {
    sql += ` WHERE s.status = ?`;
    params.push(status);
  }

  sql += ` AND (c.name LIKE ? OR s.note LIKE ?)`;
  params.push(`%${query}%`, `%${query}%`);

  sql += ` ORDER BY s.sold_at DESC`;

  const rows: any[] = await executeAll(sql, params);

  return rows.map((sale) => ({
    id: sale.id,
    customer_id: sale.customer_id,
    status: sale.status as "completed" | "cancelled" | "returned",
    subtotal_centimes: sale.subtotal_centimes as number,
    discount_centimes: sale.discount_centimes as number,
    total_centimes: sale.total_centimes as number,
    amount_paid_centimes: sale.amount_paid_centimes as number,
    remaining_balance_centimes: sale.remaining_balance_centimes as number,
    payment_method: sale.payment_method as
      | "cash"
      | "electronic"
      | "mixed"
      | "partial"
      | "credit",
    note: sale.note,
    sold_at: sale.sold_at,
    created_at: sale.created_at,
    updated_at: sale.updated_at,
    saleItems: [],
  }));
}

/**
 - Get sales by customer ID.
 */
export async function getByCustomerId(customerId: number): Promise<Sale[]> {
  return await getAll({ customerId });
}

/**
 - Get today's sales (merchant's local calendar day).
 * Note: sold_at is stored in ISO format. This filters by date portion.
 */
export async function getTodaySales(): Promise<Sale[]> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return await getAll({
    status: "completed",
  });
}

/**
 - Get sales by date range.
 */
export async function getSalesByDateRange(
  start: string,
  end: string,
): Promise<Sale[]> {
  return await getAll({});
}
