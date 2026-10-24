/**
 * saleRepository — Repository for sales transactions.
 *
 * Rules:
 * - Sales are headers (sales table) with associated items (sale_items table).
 * - All writes run inside atomic SQLite transactions.
 * - Overselling is strictly prevented: items exceeding stock are rejected.
 * - Cash over-tender is clamped to the sale total, tracking change separately.
 * - Partial/credit sales require a customer to prevent anonymous, uncollectable debt.
 * - Cancelling or returning a sale restores exact stock and preserves historical settlement fields.
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
  customerId?: number;
  status?: string;
  hasCredit?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
};

function escapeLike(query: string): string {
  return query.replace(/[%_\\]/g, "\\$&");
}

/**
 * Retrieve all sales headers with items attached, optionally filtered.
 */
export async function getAll(filters: SaleFilters = {}): Promise<Sale[]> {
  let sql = `
    SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
            s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
            s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at,
            c.name as customer_name
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters.customerId) {
    conditions.push(`s.customer_id = ?`);
    params.push(filters.customerId);
  }
  if (filters.status) {
    conditions.push(`s.status = ?`);
    params.push(filters.status);
  }
  if (filters.hasCredit) {
    conditions.push(`s.remaining_balance_centimes > 0`);
  }
  if (filters.startDate) {
    conditions.push(`substr(s.sold_at, 1, 10) >= ?`);
    params.push(filters.startDate.slice(0, 10));
  }
  if (filters.endDate) {
    conditions.push(`substr(s.sold_at, 1, 10) <= ?`);
    params.push(filters.endDate.slice(0, 10));
  }
  if (filters.search) {
    conditions.push(`(c.name LIKE ? ESCAPE '\\' OR s.note LIKE ? ESCAPE '\\' OR s.id LIKE ? ESCAPE '\\')`);
    const likeQuery = `%${escapeLike(filters.search)}%`;
    params.push(likeQuery, likeQuery, likeQuery);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(" AND ");
  }

  sql += ` ORDER BY s.sold_at DESC`;

  const saleRows: any[] = await executeAll(sql, params);

  if (saleRows.length === 0) {
    return [];
  }

  const saleIds = saleRows.map((s) => s.id);
  const placeholders = saleIds.map(() => "?").join(",");

  const itemRows: any[] = await executeAll(
    // language=SQLite
    `SELECT si.id, si.sale_id, si.product_id, si.product_name_snapshot, si.quantity,
            si.unit_sale_price_centimes, si.unit_cost_price_centimes, si.line_total_centimes,
            si.created_at
       FROM sale_items si
      WHERE si.sale_id IN (${placeholders})
      ORDER BY si.id ASC`,
    saleIds,
  );

  const itemsBySaleId = new Map<number, any[]>();
  for (const item of itemRows) {
    const list = itemsBySaleId.get(item.sale_id) || [];
    list.push({
      id: item.id,
      sale_id: item.sale_id,
      product_id: item.product_id,
      product_name_snapshot: item.product_name_snapshot,
      quantity: item.quantity,
      unit_sale_price_centimes: item.unit_sale_price_centimes,
      unit_cost_price_centimes: item.unit_cost_price_centimes,
      line_total_centimes: item.line_total_centimes,
      created_at: item.created_at,
    });
    itemsBySaleId.set(item.sale_id, list);
  }

  return saleRows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    customer_name: r.customer_name ?? null,
    status: r.status as "completed" | "cancelled" | "returned",
    subtotal_centimes: r.subtotal_centimes as number,
    discount_centimes: r.discount_centimes as number,
    total_centimes: r.total_centimes as number,
    amount_paid_centimes: r.amount_paid_centimes as number,
    remaining_balance_centimes: r.remaining_balance_centimes as number,
    payment_method: r.payment_method as
      | "cash"
      | "electronic"
      | "mixed"
      | "partial"
      | "credit",
    note: r.note,
    sold_at: r.sold_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    saleItems: itemsBySaleId.get(r.id) || [],
  }));
}

/**
 * Retrieve today's completed sales.
 */
export async function getTodaySales(): Promise<Sale[]> {
  const todayStr = new Date().toISOString().slice(0, 10);
  return getAll({ startDate: todayStr, endDate: todayStr, status: "completed" });
}

/**
 * Retrieve sales by date range.
 */
export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  return getAll({ startDate, endDate });
}

/**
 * Search sales by customer name or note.
 */
export async function search(query: string): Promise<Sale[]> {
  return getAll({ search: query });
}

/**
 * Retrieve a single sale header by ID with items attached.
 */
export async function getById(id: number): Promise<Sale | null> {
  const saleRows: any[] = await executeRead(
    // language=SQLite
    `SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
            s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
            s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at,
            c.name as customer_name
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
      WHERE s.id = ?`,
    [id],
  );

  if (saleRows.length === 0) {
    return null;
  }

  const itemsRows: any[] = await executeAll(
    // language=SQLite
    `SELECT si.id, si.sale_id, si.product_id, si.product_name_snapshot, si.quantity,
            si.unit_sale_price_centimes, si.unit_cost_price_centimes, si.line_total_centimes,
            si.created_at
       FROM sale_items si
      WHERE si.sale_id = ?
      ORDER BY si.id ASC`,
    [id],
  );

  const r = saleRows[0];

  return {
    id: r.id,
    customer_id: r.customer_id,
    customer_name: r.customer_name ?? null,
    status: r.status as "completed" | "cancelled" | "returned",
    subtotal_centimes: r.subtotal_centimes as number,
    discount_centimes: r.discount_centimes as number,
    total_centimes: r.total_centimes as number,
    amount_paid_centimes: r.amount_paid_centimes as number,
    remaining_balance_centimes: r.remaining_balance_centimes as number,
    payment_method: r.payment_method as
      | "cash"
      | "electronic"
      | "mixed"
      | "partial"
      | "credit",
    note: r.note,
    sold_at: r.sold_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    saleItems: itemsRows.map((item: any) => ({
      id: item.id,
      sale_id: item.sale_id,
      product_id: item.product_id,
      product_name_snapshot: item.product_name_snapshot,
      quantity: item.quantity,
      unit_sale_price_centimes: item.unit_sale_price_centimes,
      unit_cost_price_centimes: item.unit_cost_price_centimes,
      line_total_centimes: item.line_total_centimes,
      created_at: item.created_at,
    })),
  };
}

/**
 * Create a new sale with items atomically.
 */
export async function create(saleInput: {
  customerId?: number;
  paymentMethod: "cash" | "electronic" | "mixed" | "partial" | "credit";
  items: Array<{
    productId: number;
    quantity: number;
    unitSalePriceCentimes: number;
    note?: string;
  }>;
  note?: string;
  discountCentimes?: number;
  amountPaidCentimes?: number;
}): Promise<Sale> {
  const db = await getDatabase();
  return await transaction(db, async (tx: any) => {
    // 1. Insert initial sale header placeholder
    const saleResult = await executeWrite(
      tx,
      `INSERT INTO sales
       (customer_id, status, subtotal_centimes, discount_centimes, total_centimes,
        amount_paid_centimes, remaining_balance_centimes, payment_method, note, sold_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [
        saleInput.customerId,
        "completed",
        0,
        0,
        0,
        0,
        0,
        saleInput.paymentMethod,
        saleInput.note,
      ],
    );

    const saleId = saleResult;

    // 2. Process each item: validate live stock, insert sale item, deduct stock, create inventory movement
    let subtotal = 0;

    for (const item of saleInput.items) {
      const productRows: any[] = await executeRead(
        tx,
        `SELECT id, name, sale_price_centimes, cost_price_centimes, stock_quantity, unit FROM products WHERE id = ?`,
        [item.productId],
      );

      if (productRows.length === 0) {
        throw new Error(`Product id=${item.productId} not found`);
      }

      const product = productRows[0];

      // H2 Fix: Overselling prevention — reject if requested quantity exceeds current stock
      if ((product.stock_quantity || 0) < item.quantity) {
        throw new Error(
          `Insufficient stock for '${product.name}'. Available: ${product.stock_quantity}, requested: ${item.quantity}`,
        );
      }

      const historicalCost = product.cost_price_centimes;
      const unitSalePrice = item.unitSalePriceCentimes;
      const lineTotal = unitSalePrice * item.quantity;

      subtotal += lineTotal;

      await executeWrite(
        tx,
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

      // Deduct stock and log inventory movement
      const newStock = product.stock_quantity - item.quantity;

      await executeWrite(
        tx,
        `INSERT INTO inventory_movements
         (product_id, movement_type, quantity_change, reference_sale_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [product.id, "out", -item.quantity, saleId, `Sale saleId=${saleId}`],
      );

      await executeWrite(
        tx,
        `UPDATE products
         SET stock_quantity = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [newStock, product.id],
      );
    }

    // 3. Compute final settlement totals
    const discountCentimes = Math.max(
      0,
      Math.min(saleInput.discountCentimes ?? 0, subtotal),
    );
    const totalCentimes = subtotal - discountCentimes;

    // H3 Fix: Over-tender clamping & Underpayment handling
    const rawAmountPaid =
      saleInput.amountPaidCentimes !== undefined
        ? Math.max(0, saleInput.amountPaidCentimes)
        : saleInput.paymentMethod === "credit"
          ? 0
          : totalCentimes;

    // Clamp stored amount_paid_centimes to totalCentimes
    const amountPaid = Math.min(rawAmountPaid, totalCentimes);
    const remainingBalance = Math.max(0, totalCentimes - amountPaid);

    // H3 Fix: Prevent anonymous debt — require a customer if remaining balance > 0
    if (remainingBalance > 0 && !saleInput.customerId) {
      throw new Error("A customer must be selected to record partial payment or debt.");
    }

    await executeWrite(
      tx,
      `UPDATE sales
       SET subtotal_centimes = ?,
           discount_centimes = ?,
           total_centimes = ?,
           amount_paid_centimes = ?,
           remaining_balance_centimes = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [
        subtotal,
        discountCentimes,
        totalCentimes,
        amountPaid,
        remainingBalance,
        saleId,
      ],
    );

    // 4. Return the complete sale record
    const saleRows: any[] = await executeRead(
      tx,
      `SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
              s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
              s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at
         FROM sales s
        WHERE s.id = ?`,
      [saleId],
    );

    const itemsRows: any[] = await executeAll(
      tx,
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
      payment_method: saleRows[0].payment_method as any,
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
 * Cancel a sale atomically.
 * Restores exact stock, creates reverse inventory movements, and preserves historical settlement fields.
 */
export async function cancel(id: number, reason: string): Promise<void> {
  const db = await getDatabase();
  await transaction(db, async (tx: any) => {
    const headerRows: any[] = await executeRead(
      tx,
      `SELECT s.id, s.customer_id, s.status, s.amount_paid_centimes, s.total_centimes, s.remaining_balance_centimes
         FROM sales s
        WHERE s.id = ?`,
      [id],
    );

    if (headerRows.length === 0) {
      throw new Error(`Sale id=${id} not found`);
    }

    const saleHeader = headerRows[0];

    if (saleHeader.status !== "completed") {
      throw new Error(`Sale id=${id} is already ${saleHeader.status}; cannot cancel`);
    }

    const saleRows: any[] = await executeRead(
      tx,
      `SELECT si.product_id, si.quantity
         FROM sale_items si
        WHERE si.sale_id = ?`,
      [id],
    );

    // 1. For each sale item, restore exact stock and create reverse inventory movement
    for (const item of saleRows) {
      await executeWrite(
        tx,
        `UPDATE products
            SET stock_quantity = stock_quantity + ?,
                updated_at = datetime('now')
          WHERE id = ?`,
        [item.quantity, item.product_id],
      );

      await executeWrite(
        tx,
        `INSERT INTO inventory_movements
         (product_id, movement_type, quantity_change, reference_sale_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [item.product_id, "in", item.quantity, id, `Sale cancelled: ${reason}`],
      );
    }

    // 2. Set sale status to cancelled while preserving historical settlement values
    await executeWrite(
      tx,
      `UPDATE sales
          SET status = ?,
              updated_at = datetime('now')
        WHERE id = ?`,
      ["cancelled", id],
    );
  });
}

/**
 * Return a sale atomically.
 * Restores exact stock, creates reverse inventory movements, and preserves historical settlement fields.
 */
export async function returnSale(id: number, reason: string): Promise<void> {
  const db = await getDatabase();
  await transaction(db, async (tx: any) => {
    const headerRows: any[] = await executeRead(
      tx,
      `SELECT s.id, s.customer_id, s.status, s.amount_paid_centimes, s.total_centimes, s.remaining_balance_centimes
         FROM sales s
        WHERE s.id = ?`,
      [id],
    );

    if (headerRows.length === 0) {
      throw new Error(`Sale id=${id} not found`);
    }

    const saleHeader = headerRows[0];

    if (saleHeader.status !== "completed") {
      throw new Error(`Sale id=${id} is already ${saleHeader.status}; cannot return`);
    }

    const saleRows: any[] = await executeRead(
      tx,
      `SELECT si.product_id, si.quantity
         FROM sale_items si
        WHERE si.sale_id = ?`,
      [id],
    );

    // 1. For each sale item, restore exact stock and create reverse inventory movement
    for (const item of saleRows) {
      await executeWrite(
        tx,
        `UPDATE products
            SET stock_quantity = stock_quantity + ?,
                updated_at = datetime('now')
          WHERE id = ?`,
        [item.quantity, item.product_id],
      );

      await executeWrite(
        tx,
        `INSERT INTO inventory_movements
         (product_id, movement_type, quantity_change, reference_sale_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [item.product_id, "in", item.quantity, id, `Sale returned: ${reason}`],
      );
    }

    // 2. Set sale status to returned while preserving historical settlement values
    await executeWrite(
      tx,
      `UPDATE sales
          SET status = ?,
              updated_at = datetime('now')
        WHERE id = ?`,
      ["returned", id],
    );
  });
}

/**
 * Retrieve all sales associated with a specific customer ID.
 */
export async function getByCustomerId(customerId: number): Promise<Sale[]> {
  return getAll({ customerId });
}

export { getAll as getAllSales, getById as getSaleById };
