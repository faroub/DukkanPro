import { executeAll, executeWrite, getDatabase, transaction } from "../database";

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
});
