/**
 * baselineReproduction.test.ts — Baseline Reproduction & Invariant Verification Suite
 *
 * Verifies key architectural behaviors for:
 * A. Concurrent transaction isolation
 * B. Dashboard accounting (credit sale revenue & historical COGS gross margin)
 * C. Financial subtotal overflow rejection before persistence
 * D. Inventory adjustment overflow rejection without modifying stock or history
 */

import { getDatabase, transaction, executeAll, executeWrite } from "@/database/database";
import { create as createSale } from "@/database/repositories/saleRepository";
import { create as createProduct, adjustStock, getById as getProductById } from "@/database/repositories/productRepository";
import { create as createCustomer } from "@/database/repositories/customerRepository";
import { getTodayRevenue, getTodayProfit, getTodayCost } from "@/database/repositories/dashboardRepository";

async function resetTestDb() {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM sale_items;
    DELETE FROM customer_payments;
    DELETE FROM inventory_movements;
    DELETE FROM sales;
    DELETE FROM products;
    DELETE FROM customers;
    DELETE FROM business_profiles;
    DELETE FROM sqlite_sequence;
  `);
  await db.runAsync(
    `INSERT INTO business_profiles (business_name, owner_name, business_type, currency, selected_locale)
     VALUES ('Reproduction Shop', 'Owner', 'grocery', 'DZD', 'fr')`,
  );
  return db;
}

describe("Baseline Reproduction & Invariant Verification Suite", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  describe("A. Concurrent Transaction Isolation", () => {
    it("ensures an unrelated transaction B is isolated when transaction A fails and rolls back", async () => {
      const db = await getDatabase();
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS probe_isolation (id INTEGER PRIMARY KEY, label TEXT);`
      );
      await db.execAsync(`DELETE FROM probe_isolation;`);

      let txARunningResolver!: () => void;
      const txARunningPromise = new Promise<void>((r) => {
        txARunningResolver = r;
      });

      let allowTxAFailResolver!: () => void;
      const allowTxAFailPromise = new Promise<void>((r) => {
        allowTxAFailResolver = r;
      });

      // Transaction A starts
      const txAPromise = transaction(async (tx) => {
        await executeWrite(tx, `INSERT INTO probe_isolation (id, label) VALUES (1, 'TxA')`);
        txARunningResolver();
        await allowTxAFailPromise;
        throw new Error("Transaction A simulated failure");
      });

      // Wait until Tx A callback is active
      await txARunningPromise;

      // Start unrelated Transaction B
      const txBPromise = transaction(async (tx) => {
        await executeWrite(tx, `INSERT INTO probe_isolation (id, label) VALUES (2, 'TxB')`);
      });

      // Allow Tx A to throw and fail
      allowTxAFailResolver();

      await expect(txAPromise).rejects.toThrow("Transaction A simulated failure");
      await expect(txBPromise).resolves.not.toThrow();

      const rows = await executeAll<{ id: number; label: string }>(
        `SELECT id, label FROM probe_isolation ORDER BY id ASC`
      );

      // Verify Tx A was rolled back and Tx B committed cleanly
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(2);
      expect(rows[0].label).toBe("TxB");
    });
  });

  describe("B. Dashboard Accounting", () => {
    it("includes completed credit sale with zero initial payment in revenue and calculates gross margin using historical COGS", async () => {
      const product = await createProduct({
        name: "Olive Oil 1L",
        sku: "OLIVE-100",
        category: "Pantry",
        sale_price_centimes: 10000,
        cost_price_centimes: 6000, // Margin = 4000 (40%)
        stock_quantity: 50,
        minimum_stock_quantity: 5,
        unit: "pcs",
        is_active: true,
      });

      const customer = await createCustomer({
        name: "Nabil CreditCustomer",
        phone: "0550123999",
        note: "Test",
        is_active: true,
      });

      // 1. Create a completed credit sale with zero upfront payment (10,000 centimes total)
      const sale = await createSale({
        customerId: customer.id,
        paymentMethod: "credit",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
      });

      expect(sale.status).toBe("completed");
      expect(sale.amount_paid_centimes).toBe(0);
      expect(sale.remaining_balance_centimes).toBe(10000);

      // 2. Query dashboard metrics
      const revenue = await getTodayRevenue();
      const cost = await getTodayCost();
      const profit = await getTodayProfit();

      // Revenue must include the full sale total (10,000 centimes), not $0!
      expect(revenue).toBe(10000);

      // Historical cost = 6,000 centimes
      expect(cost).toBe(6000);

      // Gross profit = 10,000 sale - 6,000 historical cost = 4,000 centimes
      expect(profit).toBe(4000);
    });
  });

  describe("C. Financial Subtotal Overflow", () => {
    it("rejects a sale where multiple valid items combine to exceed MAX_SAFE_INTEGER subtotal before persistence", async () => {
      const p1 = await createProduct({
        name: "High Value Item A",
        sku: "HV-001",
        category: "Valuables",
        sale_price_centimes: 5000000000000000, // 5*10^15 < MAX_SAFE_INTEGER
        cost_price_centimes: 100000,
        stock_quantity: 100,
        minimum_stock_quantity: 1,
        unit: "pcs",
        is_active: true,
      });

      const p2 = await createProduct({
        name: "High Value Item B",
        sku: "HV-002",
        category: "Valuables",
        sale_price_centimes: 5000000000000000, // 5*10^15 < MAX_SAFE_INTEGER
        cost_price_centimes: 100000,
        stock_quantity: 100,
        minimum_stock_quantity: 1,
        unit: "pcs",
        is_active: true,
      });

      // Sum = 10,000,000,000,000,000 > Number.MAX_SAFE_INTEGER (9,007,199,254,740,991)
      await expect(
        createSale({
          paymentMethod: "cash",
          items: [
            { productId: p1.id, quantity: 1, unitSalePriceCentimes: 5000000000000000 },
            { productId: p2.id, quantity: 1, unitSalePriceCentimes: 5000000000000000 },
          ],
        }),
      ).rejects.toThrow(/OVERFLOW/i);

      // Verify no sales or sale_items rows were persisted
      const salesCount = await executeAll<{ c: number }>(`SELECT COUNT(*) AS c FROM sales`);
      expect(salesCount[0].c).toBe(0);
    });
  });

  describe("D. Inventory Adjustment Overflow", () => {
    it("rejects stock adjustment whose resulting quantity exceeds MAX_SAFE_INTEGER without changing stock or movement history", async () => {
      const product = await createProduct({
        name: "Near Max Item",
        sku: "NEAR-MAX-1",
        category: "Test",
        sale_price_centimes: 1000,
        cost_price_centimes: 500,
        stock_quantity: Number.MAX_SAFE_INTEGER - 5,
        minimum_stock_quantity: 1,
        unit: "pcs",
        is_active: true,
      });

      // Attempting an adjustment of +10 exceeds MAX_SAFE_INTEGER
      await expect(
        adjustStock(product.id, 10, "Restock attempt exceeding MAX_SAFE_INTEGER"),
      ).rejects.toThrow(/INSUFFICIENT_STOCK|INVALID_QUANTITY|overflow/i);

      // Stock quantity remains unchanged at MAX_SAFE_INTEGER - 5
      const prodAfter = await getProductById(product.id);
      expect(prodAfter?.stock_quantity).toBe(Number.MAX_SAFE_INTEGER - 5);

      // Only the initial 'Opening stock' movement exists (no failed adjustment movement added)
      const movements = await executeAll<{ note: string }>(
        `SELECT note FROM inventory_movements WHERE product_id = ?`,
        [product.id],
      );
      expect(movements).toHaveLength(1);
      expect(movements[0].note).toBe("Opening stock");
    });
  });
});
