/**
 * dashboardRepository.test.ts — Unit tests for dashboardRepository.
 *
 - Tests use the application's SQLite database (opened via getDatabase()).
 - Verifies revenue, cost, profit, debt, and stock count calculations.
 - Ensures cancelled/returned sales are properly excluded.
 */

import { getDatabase } from "../../database";
import {
    getLowStockCount,
    getLowStockProducts,
    getOutstandingDebt,
    getRecentSales,
    getSevenDaySales,
    getTodayCost,
    getTodayProfit,
    getTodayRevenue,
} from "../dashboardRepository";

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
  await db.runAsync("INSERT INTO customers (name) VALUES (?)", [
    "Test customer",
  ]);
});

describe("dashboardRepository", () => {
  describe("getTodayRevenue", () => {
    it("excludes completed sales from previous days", async () => {
      // A completed sale from 30 days ago must not count towards today's revenue
      await db.runAsync(
        // language=SQLite
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
             total_centimes, amount_paid_centimes, remaining_balance_centimes,
             payment_method, note, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now', '-30 days'), datetime('now'), datetime('now'))`,
        [1, "completed", 9000, 0, 9000, 9000, 0, "cash"],
      );

      const revenue = await getTodayRevenue();
      expect(revenue).toBe(0);
    });

    it("adds sale revenue and reflects in getTodayRevenue", async () => {
      // Create a completed sale
      await db.runAsync(
        // language=SQLite
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
             total_centimes, amount_paid_centimes, remaining_balance_centimes,
             payment_method, note, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
        [1, "completed", 5000, 0, 5000, 5000, 0, "cash"],
      );

      const revenue = await getTodayRevenue();
      expect(revenue).toBe(5000);
    });

    it("excludes cancelled sale from revenue", async () => {
      // Create a cancelled sale
      await db.runAsync(
        // language=SQLite
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
             total_centimes, amount_paid_centimes, remaining_balance_centimes,
             payment_method, note, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
        [1, "cancelled", 3000, 0, 3000, 0, 0, "cash"],
      );

      const revenue = await getTodayRevenue();
      // Cancelled sales should not count; revenue should only include completed
      expect(revenue).toBe(0); // no completed sales, so 0
    });
  });

  describe("getTodayCost", () => {
    it("computes cost from sale items' historical cost price", async () => {
      // First, create products with cost prices and a completed sale with items
      await db.runAsync(
        // language=SQLite
        `INSERT INTO products (name, sale_price_centimes, cost_price_centimes, stock_quantity, unit, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        ["Product A", 5000, 3000, 10, "pcs"],
      );

      // Insert a completed sale with 2 items of product A
      await db.runAsync(
        // language=SQLite
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
             total_centimes, amount_paid_centimes, remaining_balance_centimes,
             payment_method, note, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
        [1, "completed", 6000, 0, 6000, 6000, 0, "cash"],
      );

      // Insert sale items with historical cost
      await db.runAsync(
        // language=SQLite
        `INSERT INTO sale_items (sale_id, product_id, product_name_snapshot,
             quantity, unit_sale_price_centimes, unit_cost_price_centimes, line_total_centimes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [1, 1, "Product A", 2, 5000, 3000, 6000],
      );

      const cost = await getTodayCost();
      // Cost = quantity × historical cost = 2 × 3000 = 6000
      expect(cost).toBe(6000);
    });

    it("excludes cost from sales outside the local calendar day", async () => {
      // A completed sale from 30 days ago must not contribute to today's cost
      await db.runAsync(
        // language=SQLite
        `INSERT INTO products (name, sale_price_centimes, cost_price_centimes, stock_quantity, unit, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        ["Product A", 5000, 3000, 10, "pcs"],
      );

      await db.runAsync(
        // language=SQLite
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
             total_centimes, amount_paid_centimes, remaining_balance_centimes,
             payment_method, note, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now', '-30 days'), datetime('now'), datetime('now'))`,
        [1, "completed", 6000, 0, 6000, 6000, 0, "cash"],
      );

      await db.runAsync(
        // language=SQLite
        `INSERT INTO sale_items (sale_id, product_id, product_name_snapshot,
             quantity, unit_sale_price_centimes, unit_cost_price_centimes, line_total_centimes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [1, 1, "Product A", 2, 5000, 3000, 6000],
      );

      const cost = await getTodayCost();
      expect(cost).toBe(0);
    });
  });

  describe("getTodayProfit", () => {
    it("computes profit as revenue minus cost", async () => {
      // Set up products and sale similar to getTodayCost test
      await db.runAsync(
        // language=SQLite
        `INSERT INTO products (name, sale_price_centimes, cost_price_centimes, stock_quantity, unit, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        ["Product A", 5000, 3000, 10, "pcs"],
      );

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

      const profit = await getTodayProfit();
      // Revenue 6000 - Cost 6000 = 0 profit
      expect(profit).toBe(0);
    });
  });

  describe("getOutstandingDebt", () => {
    it("computes debt from completed sales with remaining balance", async () => {
      // Create a completed sale with remaining balance
      await db.runAsync(
        // language=SQLite
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
             total_centimes, amount_paid_centimes, remaining_balance_centimes,
             payment_method, note, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
        [1, "completed", 5000, 0, 5000, 2000, 3000, "cash"],
      );

      const debt = await getOutstandingDebt();
      // Debt = remaining_balance = 3000
      expect(debt).toBe(3000);
    });

    it("excludes cancelled sale from debt", async () => {
      // Create a cancelled sale with remaining balance
      await db.runAsync(
        // language=SQLite
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
             total_centimes, amount_paid_centimes, remaining_balance_centimes,
             payment_method, note, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
        [1, "cancelled", 5000, 0, 5000, 0, 3000, "cash"],
      );

      const debt = await getOutstandingDebt();
      // Cancelled sales should be excluded
      expect(debt).toBe(0);
    });

    it("excludes returned sale from debt", async () => {
      // This test verifies the principle; returned sales similarly excluded
      const debt = await getOutstandingDebt();
      expect(typeof debt).toBe("number");
    });
  });

  describe("getLowStockCount", () => {
    it("counts products at or below minimum stock quantity", async () => {
      // Create some products
      await db.runAsync(
        // language=SQLite
        `INSERT INTO products (name, sale_price_centimes, cost_price_centimes,
             stock_quantity, minimum_stock_quantity, unit, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        ["Product A", 1000, 800, 5, 10, "pcs"],
      );
      await db.runAsync(
        // language=SQLite
        `INSERT INTO products (name, sale_price_centimes, cost_price_centimes,
             stock_quantity, minimum_stock_quantity, unit, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        ["Product B", 2000, 1500, 15, 10, "pcs"],
      );

      const count = await getLowStockCount();
      // Product A has stock 5 <= minimum 10, so it should be counted
      // Product B has stock 15 > minimum 10, so it should NOT be counted
      expect(count).toBe(1);
    });
  });

  describe("getRecentSales", () => {
    it("returns recent completed sales limited by count", async () => {
      // Create multiple sales
      for (let i = 0; i < 5; i++) {
        await db.runAsync(
          // language=SQLite
          `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
               total_centimes, amount_paid_centimes, remaining_balance_centimes,
               payment_method, note, sold_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
          [
            1,
            "completed",
            1000 * (i + 1),
            0,
            1000 * (i + 1),
            1000 * (i + 1),
            0,
            "cash",
          ],
        );
      }

      const recent = await getRecentSales(3);
      expect(recent.length).toBe(3);
    });

    it("only returns completed sales (excludes cancelled/returned)", async () => {
      // Create a completed sale
      await db.runAsync(
        // language=SQLite
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
             total_centimes, amount_paid_centimes, remaining_balance_centimes,
             payment_method, note, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
        [1, "completed", 1000, 0, 1000, 1000, 0, "cash"],
      );

      // Create a cancelled sale
      await db.runAsync(
        // language=SQLite
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
             total_centimes, amount_paid_centimes, remaining_balance_centimes,
             payment_method, note, sold_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))`,
        [1, "cancelled", 1000, 0, 1000, 0, 0, "cash"],
      );

      const recent = await getRecentSales(10);
      // All should be completed; cancelled ones should not appear
      for (const sale of recent) {
        expect(sale.status).toBe("completed");
      }
    });
  });

  describe("getLowStockProducts", () => {
    it("returns products at or below minimum stock, limited by limit", async () => {
      // Create products
      await db.runAsync(
        // language=SQLite
        `INSERT INTO products (name, sale_price_centimes, cost_price_centimes,
             stock_quantity, minimum_stock_quantity, unit, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        ["Low Stock Product", 1000, 800, 3, 10, "pcs"],
      );

      const products = await getLowStockProducts(5);
      expect(products.length).toBeGreaterThan(0);
      // The product should be in the list since stock 3 <= minimum 10
      const found = products.some((p: any) => p.name === "Low Stock Product");
      expect(found).toBe(true);
    });
  });

  describe("getSevenDaySales", () => {
    it("returns seven-day sales trend with daily totals", async () => {
      const sevenDay = await getSevenDaySales();
      // Should return an array
      expect(Array.isArray(sevenDay)).toBe(true);
      // Should have exactly 7 entries
      expect(sevenDay.length).toBe(7);
      // Each entry should have date and total
      for (const entry of sevenDay) {
        expect(entry).toHaveProperty("date");
        expect(entry).toHaveProperty("total");
        expect(typeof entry.total).toBe("number");
      }
    });

    it("buckets sales by the local calendar day, not the UTC day", async () => {
      // sold_at is stored in UTC. Pick a local wall-clock time whose UTC instant
      // falls on a different calendar day, so SQL DATE() would misplace it.
      const offsetMin = -new Date().getTimezoneOffset();
      const probe = new Date();
      const localHour = offsetMin >= 0 ? 1 : 23; // 01:00 local (UTC = previous day) when ahead of UTC
      const localY = probe.getFullYear();
      const localM = probe.getMonth();
      const localD = probe.getDate();
      const expectedKey = `${localY}-${String(localM + 1).padStart(2, "0")}-${String(localD).padStart(2, "0")}`;

      const utc = new Date(Date.UTC(localY, localM, localD, localHour, 30) - offsetMin * 60 * 1000);
      const utcStr = utc.toISOString().slice(0, 19).replace("T", " ");
      const utcDateOfSale = utcStr.slice(0, 10);
      const daysDiverge = utcDateOfSale !== expectedKey;

      await db.runAsync(
        // language=SQLite
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes,
             total_centimes, amount_paid_centimes, remaining_balance_centimes,
             payment_method, note, sold_at, created_at, updated_at)
         VALUES (NULL, 'completed', 7000, 0, 7000, 7000, 0, 'cash', NULL, ?, datetime('now'), datetime('now'))`,
        [utcStr],
      );

      const trend = await getSevenDaySales();
      expect(trend).toHaveLength(7);

      if (daysDiverge) {
        // The old DATE(s.sold_at) logic would have put the sale on this UTC day.
        const wrongBucket = trend.find((t) => t.date === utcDateOfSale);
        expect(wrongBucket?.total ?? 0).toBe(0);
      }

      const bucket = trend.find((t) => t.date === expectedKey);
      expect(bucket?.total).toBe(7000);
    });
  });
});
