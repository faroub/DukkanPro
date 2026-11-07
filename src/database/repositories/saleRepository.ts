/**
 * saleRepository — Repository for sales transactions.
 *
 * Rules:
 * - Sales are headers (sales table) with associated items (sale_items table).
 * - All writes run inside atomic SQLite transactions.
 * - Overselling is strictly prevented: items exceeding stock are rejected.
 * - Cash over-tender is clamped to the sale total, tracking change separately.
 * - Partial/credit sales require a customer to prevent anonymous, uncollectable debt.
 * - Each item's submitted unit price must match the live catalogue price (PRICE_CHANGED guard).
 * - Cancelling or returning a sale restores exact stock and preserves historical settlement fields.
 */

import { Sale } from "../../types/entities";
import { get as getBusinessProfile } from "./businessProfileRepository";
import { mapSaleItemRow, mapSaleRow } from "./mappers";
import {
  executeAll,
  executeRead,
  executeWrite,
  escapeLike,
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
  limit?: number;
  offset?: number;
};

/**
 * Converts local calendar date strings ("YYYY-MM-DD") for [startDate, endDate]
 * into a half-open UTC timestamp interval [utcStart, utcEnd) in "YYYY-MM-DD HH:MM:SS" format.
 */
function localDateRangeToUtcBounds(
  startDateStr: string,
  endDateStr: string,
): [string, string] {
  const parseLocalDate = (str: string) => {
    const parts = str.slice(0, 10).split("-").map((p) => parseInt(p, 10));
    return new Date(parts[0], parts[1] - 1, parts[2] || 1);
  };

  const startLocal = parseLocalDate(startDateStr);
  const endLocalDay = parseLocalDate(endDateStr);
  const endLocal = new Date(
    endLocalDay.getFullYear(),
    endLocalDay.getMonth(),
    endLocalDay.getDate() + 1,
  );

  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
  return [fmt(startLocal), fmt(endLocal)];
}

/**
 * Retrieve all sales headers with items attached, optionally filtered.
 */
export async function getAll(filters: SaleFilters = {}): Promise<Sale[]> {
  let sql = `
    SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
            s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
            s.payment_method, s.currency, s.note, s.sold_at, s.created_at, s.updated_at,
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
  if (filters.startDate || filters.endDate) {
    const startStr = filters.startDate
      ? filters.startDate.slice(0, 10)
      : filters.endDate!.slice(0, 10);
    const endStr = filters.endDate
      ? filters.endDate.slice(0, 10)
      : startStr;
    const [utcStart, utcEnd] = localDateRangeToUtcBounds(startStr, endStr);

    conditions.push(`s.sold_at >= ? AND s.sold_at < ?`);
    params.push(utcStart, utcEnd);
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

  if (filters.limit !== undefined && filters.limit > 0) {
    sql += ` LIMIT ?`;
    params.push(filters.limit);
    if (filters.offset !== undefined && filters.offset >= 0) {
      sql += ` OFFSET ?`;
      params.push(filters.offset);
    }
  }

  const saleRows: any[] = await executeAll(sql, params);

  if (saleRows.length === 0) {
    return [];
  }

  const saleIds = saleRows.map((s) => s.id);
  const CHUNK_SIZE = 200; // Chunk IDs into batches of 200 to stay well under SQLite parameter limits
  const itemRows: any[] = [];

  for (let i = 0; i < saleIds.length; i += CHUNK_SIZE) {
    const chunk = saleIds.slice(i, i + CHUNK_SIZE);
    const placeholders = chunk.map(() => "?").join(",");
    const rows: any[] = await executeAll(
      // language=SQLite
      `SELECT si.id, si.sale_id, si.product_id, si.product_name_snapshot, si.quantity,
              si.unit_sale_price_centimes, si.unit_cost_price_centimes, si.line_total_centimes,
              si.created_at
         FROM sale_items si
        WHERE si.sale_id IN (${placeholders})
        ORDER BY si.id ASC`,
      chunk,
    );
    itemRows.push(...rows);
  }

  const itemsBySaleId = new Map<number, any[]>();
  for (const item of itemRows) {
    const list = itemsBySaleId.get(item.sale_id) || [];
    list.push(mapSaleItemRow(item));
    itemsBySaleId.set(item.sale_id, list);
  }

  return saleRows.map((r) => mapSaleRow(r, itemsBySaleId.get(r.id) || []));
}

function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Retrieve today's completed sales using the merchant's local calendar day.
 */
export async function getTodaySales(): Promise<Sale[]> {
  const todayStr = getLocalDateKey();
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
            s.payment_method, s.currency, s.note, s.sold_at, s.created_at, s.updated_at,
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

  return mapSaleRow(
    r,
    itemsRows.map((item: any) => mapSaleItemRow(item)),
  );
}

/**
 * Create a new sale with items atomically.
 */
export async function create(saleInput: {
  customerId?: number;
  paymentMethod: "cash" | "electronic" | "mixed" | "partial" | "credit";
  items: {
    productId: number;
    quantity: number;
    unitSalePriceCentimes: number;
    note?: string;
  }[];
  note?: string;
  discountCentimes?: number;
  amountPaidCentimes?: number;
}): Promise<Sale> {
  if (!saleInput.items || saleInput.items.length === 0) {
    throw new Error("Cannot create a sale with no items.");
  }

  if (saleInput.discountCentimes !== undefined) {
    if (!Number.isSafeInteger(saleInput.discountCentimes) || saleInput.discountCentimes < 0) {
      throw new Error(
        `Invalid discountCentimes ${saleInput.discountCentimes}. Discount must be a non-negative integer.`
      );
    }
  }

  if (saleInput.amountPaidCentimes !== undefined) {
    if (!Number.isSafeInteger(saleInput.amountPaidCentimes) || saleInput.amountPaidCentimes < 0) {
      throw new Error(
        `Invalid amountPaidCentimes ${saleInput.amountPaidCentimes}. Amount paid must be a non-negative integer.`
      );
    }
  }

  for (const item of saleInput.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(
        `Invalid quantity ${item.quantity} for product id=${item.productId}. Quantity must be a positive integer.`
      );
    }
    if (!Number.isSafeInteger(item.unitSalePriceCentimes) || item.unitSalePriceCentimes < 0) {
      throw new Error(
        `Invalid unitSalePriceCentimes ${item.unitSalePriceCentimes} for product id=${item.productId}. Price must be a non-negative integer.`
      );
    }
  }

  const profile = await getBusinessProfile();
  const activeCurrency = profile?.currency || "DZD";

  const db = await getDatabase();
  return await transaction(db, async (tx: any) => {
    // 1. Insert initial sale header placeholder
    const saleResult = await executeWrite(
      tx,
      `INSERT INTO sales
       (customer_id, status, subtotal_centimes, discount_centimes, total_centimes,
        amount_paid_centimes, remaining_balance_centimes, payment_method, currency, note, sold_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [
        saleInput.customerId,
        "completed",
        0,
        0,
        0,
        0,
        0,
        saleInput.paymentMethod,
        activeCurrency,
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

      // The sale must record the catalogue price live at commit time. A mismatch
      // means the cart was built against a stale price snapshot: reject so the
      // caller can refresh the cart instead of charging a wrong amount.
      if (product.sale_price_centimes !== item.unitSalePriceCentimes) {
        throw new Error(
          `PRICE_CHANGED: Price for '${product.name}' changed. Submitted ${item.unitSalePriceCentimes}, current ${product.sale_price_centimes}. Refresh the cart and try again.`,
        );
      }

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

    // H3 Fix: Prevent anonymous debt & debt for inactive customers
    if (remainingBalance > 0) {
      if (!saleInput.customerId) {
        throw new Error("A customer must be selected to record partial payment or debt.");
      }

      const custRows: any[] = await executeRead(
        tx,
        `SELECT id, name, is_active FROM customers WHERE id = ?`,
        [saleInput.customerId],
      );
      if (custRows.length === 0) {
        throw new Error(`Customer id=${saleInput.customerId} not found.`);
      }
      if (custRows[0].is_active === 0) {
        throw new Error(
          "INACTIVE_CUSTOMER: Cannot record credit or debt for an inactive/archived customer.",
        );
      }
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
              s.payment_method, s.currency, s.note, s.sold_at, s.created_at, s.updated_at
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

    return mapSaleRow(
      saleRows[0],
      itemsRows.map((r: any) => mapSaleItemRow(r)),
    );
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
      // product_id is NULL only when the product row was hard-deleted externally
      // (FK ON DELETE SET NULL): there is no stock row to restore and no valid
      // movement to log — skipping keeps the cancellation atomic instead of
      // failing the whole transaction on a NOT NULL constraint violation.
      if (item.product_id === null || item.product_id === undefined) continue;

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
      // product_id is NULL only when the product row was hard-deleted externally
      // (FK ON DELETE SET NULL): there is no stock row to restore and no valid
      // movement to log — skipping keeps the return atomic instead of failing
      // the whole transaction on a NOT NULL constraint violation.
      if (item.product_id === null || item.product_id === undefined) continue;

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
