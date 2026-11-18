import { executeAll, executeWrite, getDatabase, transaction } from "../database";
import { create as createSale } from "../repositories/saleRepository";

describe("Database Concurrency & Transaction Isolation (AsyncMutex)", () => {
  beforeEach(async () => {
    const db = await getDatabase();
    await db.execAsync("DELETE FROM products;");
    await db.execAsync("DELETE FROM sales;");
  });

  it("serializes overlapping transactions cleanly without BEGIN IMMEDIATE collision", async () => {
    const db = await getDatabase();

    const task1 = transaction(db, async (tx) => {
      await executeWrite(
        tx,
        `INSERT INTO products (name, sale_price_centimes, cost_price_centimes, stock_quantity) VALUES (?, ?, ?, ?)`,
        ["Concurrent Product 1", 10000, 5000, 20]
      );
      // Brief delay inside transaction
      await new Promise((resolve) => setTimeout(resolve, 50));
      return "task1_success";
    });

    const task2 = transaction(db, async (tx) => {
      await executeWrite(
        tx,
        `INSERT INTO products (name, sale_price_centimes, cost_price_centimes, stock_quantity) VALUES (?, ?, ?, ?)`,
        ["Concurrent Product 2", 20000, 10000, 10]
      );
      return "task2_success";
    });

    // Run both overlapping transactions concurrently
    const results = await Promise.all([task1, task2]);

    expect(results).toEqual(["task1_success", "task2_success"]);

    const products = await executeAll<{ name: string }>(
      `SELECT name FROM products ORDER BY name ASC`
    );
    expect(products).toHaveLength(2);
    expect(products[0].name).toBe("Concurrent Product 1");
    expect(products[1].name).toBe("Concurrent Product 2");
  });

  it("prevents silent data loss when a standalone write runs while an unrelated transaction rolls back", async () => {
    const db = await getDatabase();

    // 1. Start a transaction that will fail and rollback
    const failingTransaction = transaction(db, async (tx) => {
      await executeWrite(
        tx,
        `INSERT INTO products (name, sale_price_centimes, cost_price_centimes, stock_quantity) VALUES (?, ?, ?, ?)`,
        ["Failing Transaction Product", 10000, 5000, 10]
      );
      await new Promise((resolve) => setTimeout(resolve, 30));
      throw new Error("Simulated Checkout Failure");
    }).catch((err) => err.message);

    // 2. Concurrently execute an unrelated standalone write (e.g., merchant updating price)
    const standaloneWrite = executeWrite(
      `INSERT INTO products (name, sale_price_centimes, cost_price_centimes, stock_quantity) VALUES (?, ?, ?, ?)`,
      ["Standalone Merchant Edit", 15000, 8000, 50]
    );

    const [txError, writeResult] = await Promise.all([failingTransaction, standaloneWrite]);

    expect(txError).toBe("Simulated Checkout Failure");
    expect(writeResult).toBeGreaterThan(0);

    // 3. Verify standalone write was NOT rolled back by the failing transaction
    const products = await executeAll<{ name: string }>(
      `SELECT name FROM products`
    );
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Standalone Merchant Edit");
  });

  it("prevents overselling when multiple simultaneous checkout requests target the last stock item", async () => {
    const db = await getDatabase();

    const productResult = await executeWrite(
      `INSERT INTO products (name, sale_price_centimes, cost_price_centimes, stock_quantity) VALUES (?, ?, ?, ?)`,
      ["Last Stock Unit", 5000, 3000, 1]
    );

    const checkout1 = createSale({
      paymentMethod: "cash",
      items: [{ productId: productResult, quantity: 1, unitSalePriceCentimes: 5000 }],
    }).then(() => "ok").catch((e) => e.message);

    const checkout2 = createSale({
      paymentMethod: "cash",
      items: [{ productId: productResult, quantity: 1, unitSalePriceCentimes: 5000 }],
    }).then(() => "ok").catch((e) => e.message);

    const [r1, r2] = await Promise.all([checkout1, checkout2]);

    const succeeded = [r1, r2].filter((res) => res === "ok");
    const failed = [r1, r2].filter((res) => res !== "ok");

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatch(/Insufficient stock/i);

    const prodRows = await executeAll<{ stock_quantity: number }>(
      `SELECT stock_quantity FROM products WHERE id = ?`,
      [productResult]
    );
    expect(prodRows[0].stock_quantity).toBe(0);
  });
});
