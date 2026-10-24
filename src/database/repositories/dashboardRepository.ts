/**
 * dashboardRepository — Repository for dashboard summary data.
 *
 * - All methods use atomic reads from the SQLite database.
 * - Revenue/profit are computed from completed sales only.
 * - Customer debt excludes cancelled and returned sales.
 * - Stock counts exclude inactive/archived products.
 */

import { executeAll, executeRead } from "../database";
import { Sale } from "../../types/entities";

export type DashboardResult = {
  todayRevenue: number;    // centimes
  todayCost: number;       // centimes
  todayProfit: number;     // centimes
  outstandingDebt: number; // centimes
  lowStockCount: number;
  recentSales: Sale[];
  lowStockProducts: any[]; // Product[]
  sevenDaySales: { date: string; total: number }[];
};

/**
 * Timestamp bounds of the merchant's local calendar day, as a half-open
 * interval [start, end) in the "YYYY-MM-DD HH:MM:SS" format used by sold_at.
 * Uses Date-part calendar arithmetic to remain accurate on DST transition days.
 */
function localDayBounds(): [string, string] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
  return [fmt(start), fmt(end)];
}

/**
 * Get today's revenue from completed sales (centimes).
 * "Today" means the merchant's local calendar day.
 */
export async function getTodayRevenue(): Promise<number> {
  const [start, end] = localDayBounds();
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT COALESCE(SUM(s.total_centimes), 0) as total
       FROM sales s
      WHERE s.status = 'completed'
        AND s.sold_at >= ?
        AND s.sold_at < ?`,
    [start, end],
  );
  return rows[0]?.total as number;
}

/**
 * Get today's cost of goods sold (centimes).
 * Computed as historical cost of items sold in completed sales today.
 */
export async function getTodayCost(): Promise<number> {
  const [start, end] = localDayBounds();
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT COALESCE(SUM(si.unit_cost_price_centimes * si.quantity), 0) as total
       FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
     WHERE s.status = 'completed'
       AND s.sold_at >= ?
       AND s.sold_at < ?`,
    [start, end],
  );
  return rows[0]?.total as number;
}

/**
 * Get today's estimated profit (centimes).
 * Profit = Revenue - Cost of Goods Sold
 */
export async function getTodayProfit(): Promise<number> {
  const revenue = await getTodayRevenue();
  const cost = await getTodayCost();
  return revenue - cost;
}

/**
 * Get outstanding customer debt (centimes).
 * Customer debt = valid unpaid sale balances - recorded payments.
 * Cancelled and returned sales are excluded from debt calculation.
 */
export async function getOutstandingDebt(): Promise<number> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT COALESCE(SUM(s.remaining_balance_centimes), 0) as total
       FROM sales s
      WHERE s.status = 'completed'
        AND s.remaining_balance_centimes > 0`,
  );
  return rows[0]?.total as number;
}

/**
 * Get count of products at or below minimum stock quantity.
 */
export async function getLowStockCount(): Promise<number> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT COUNT(*) as count
       FROM products
      WHERE stock_quantity <= minimum_stock_quantity
        AND is_active = 1`,
  );
  return (rows[0]?.count as number) || 0;
}

/**
 * Get recent sales (completed), limited by count.
 */
export async function getRecentSales(limit: number): Promise<Sale[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
             s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
             s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at
        FROM sales s
       WHERE s.status = 'completed'
    ORDER BY s.sold_at DESC
       LIMIT ?`,
    [limit],
  );

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
 * Get products at or below minimum stock quantity, limited by count.
 */
export async function getLowStockProducts(limit: number): Promise<any[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, name, sku, sale_price_centimes, cost_price_centimes,
           stock_quantity, minimum_stock_quantity, unit, is_active
       FROM products
      WHERE stock_quantity <= minimum_stock_quantity
        AND is_active = 1
     ORDER BY stock_quantity ASC
       LIMIT ?`,
    [limit],
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
    sale_price_centimes: r.sale_price_centimes,
    cost_price_centimes: r.cost_price_centimes,
    stock_quantity: r.stock_quantity,
    minimum_stock_quantity: r.minimum_stock_quantity,
    unit: r.unit,
    is_active: r.is_active !== 0,
  }));
}

/**
 * Local calendar day key ("YYYY-MM-DD") for a Date, using the device timezone.
 */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Get seven-day sales trend: daily total revenue for the last 7 local days.
 * Uses Date-part calendar arithmetic to remain accurate on DST transition days.
 */
export async function getSevenDaySales(): Promise<{ date: string; total: number }[]> {
  const now = new Date();
  const fetchSince = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT s.sold_at, s.total_centimes
       FROM sales s
      WHERE s.status = 'completed'
        AND s.sold_at >= ?
     ORDER BY s.sold_at DESC`,
    [fmt(fetchSince)],
  );

  // Seed one bucket per day, oldest first, so the chart is chronological.
  const totals = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    totals.set(localDateKey(dayDate), 0);
  }

  for (const row of rows) {
    // sold_at has no timezone marker; "Z" makes JS read it as the UTC instant it is.
    const key = localDateKey(new Date(`${row.sold_at}Z`));
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) as number) + (row.total_centimes || 0));
    }
  }

  return [...totals.entries()].map(([date, total]) => ({ date, total }));
}
