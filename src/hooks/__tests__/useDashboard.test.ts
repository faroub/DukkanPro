import { getDatabase } from "@/database/database";
import { fetchDashboardData } from "@/hooks/useDashboard";

let db: any;

beforeAll(async () => {
  db = await getDatabase();
});

beforeEach(async () => {
  await db.execAsync(`
    DELETE FROM sale_items;
    DELETE FROM customer_payments;
    DELETE FROM inventory_movements;
    DELETE FROM sales;
    DELETE FROM products;
    DELETE FROM customers;
    DELETE FROM sqlite_sequence;
  `);
  await db.runAsync("INSERT INTO customers (name) VALUES (?)", ["Test customer"]);
  await db.runAsync(
    // language=SQLite
    `INSERT INTO products (name, sale_price_centimes, cost_price_centimes, stock_quantity, minimum_stock_quantity, unit, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    ["Product A", 5000, 3000, 10, 5, "pcs"],
  );
});

it("computes today-only revenue, real cost, and debt minus payments", async () => {
  // Completed sale TODAY: total 6000, cost 2 x 3000 = 6000
  await db.runAsync(
    // language=SQLite
    `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
         total_centimes, amount_paid_centimes, remaining_balance_centimes,
         payment_method, note, sold_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
    [1, "completed", 6000, 0, 6000, 6000, 0, "cash"],
  );
  await db.runAsync(
    // language=SQLite
    `INSERT INTO sale_items (sale_id, product_id, product_name_snapshot,
         quantity, unit_sale_price_centimes, unit_cost_price_centimes, line_total_centimes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [1, 1, "Product A", 2, 5000, 3000, 6000],
  );

  // Credit sale TODAY with an unpaid balance of 4000
  await db.runAsync(
    // language=SQLite
    `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
         total_centimes, amount_paid_centimes, remaining_balance_centimes,
         payment_method, note, sold_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
    [1, "completed", 4000, 0, 4000, 0, 4000, "credit"],
  );

  // Completed sale 30 days ago — must NOT count in today's figures
  await db.runAsync(
    // language=SQLite
    `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
         total_centimes, amount_paid_centimes, remaining_balance_centimes,
         payment_method, note, sold_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now', '-30 days'), datetime('now'), datetime('now'))`,
    [1, "completed", 9999, 0, 9999, 9999, 0, "cash"],
  );

  // Cancelled sale today — must NOT count
  await db.runAsync(
    // language=SQLite
    `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
         total_centimes, amount_paid_centimes, remaining_balance_centimes,
         payment_method, note, sold_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
    [1, "cancelled", 1111, 0, 1111, 0, 0, "cash"],
  );

  // Recorded payment of 1000 against the debt
  await db.runAsync(
    // language=SQLite
    `INSERT INTO customer_payments (customer_id, amount_centimes, payment_method, note, paid_at, created_at)
     VALUES (?, ?, ?, NULL, datetime('now'), datetime('now'))`,
    [1, 1000, "cash"],
  );

  const data = await fetchDashboardData("fr");

  // Revenue = 6000 + 4000 (old + cancelled excluded)
  expect(data.todayRevenue_centimes).toBe(10000);
  // Cost = 2 x 3000 (only today's completed sale has items)
  expect(data.todayProfit_centimes).toBe(10000 - 6000);
  // Debt = 4000 balance - 1000 payment
  expect(data.toCollect_centimes).toBe(3000);
  // Recent sales = latest valid sales across all days (cancelled/returned excluded):
  // two from today + the 30-day-old completed sale
  expect(data.recentSales).toHaveLength(3);
  expect(data.recentSales.every((s: any) => s.status !== "cancelled")).toBe(true);
  expect(data.recentSales[0].customerName).toBe("Test customer");
});
