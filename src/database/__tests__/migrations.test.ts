/**
 * migrations.test.ts — Tests for the versioned migration runner.
 *
 * Builds a fresh database at migration 13, seeds real data, then applies
 * migration 14 (integrity constraints) and verifies that:
 * - the non-negative CHECK constraints land,
 * - all pre-existing rows and indexes survive the table rebuild,
 * - negative data aborts the migration with a clear error and is left untouched.
 */
import { openDatabaseAsync } from "expo-sqlite";
import { migrationVersions, runMigrations } from "../migrations";

async function makeDatabaseAtVersion(version: number) {
  const db: any = await openDatabaseAsync("migrations-test.db");
  await runMigrations(db, version);
  return db;
}

describe("migrations", () => {
  it("exposes a contiguous, ordered set of migration versions", () => {
    expect(migrationVersions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  describe("migration 14 — integrity constraints", () => {
    it("rebuilds products and sales with non-negative CHECKs, preserving rows and indexes", async () => {
      const db = await makeDatabaseAtVersion(13);

      // Seed data that must survive the rebuild.
      await db.runAsync(
        `INSERT INTO products (name, sku, category, sale_price_centimes, cost_price_centimes, stock_quantity, minimum_stock_quantity, unit, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["Lait Migration", "MILK-14", "Dairy", 5000, 3000, 40, 5, "L", 1],
      );
      await db.runAsync(
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes, total_centimes, amount_paid_centimes, remaining_balance_centimes, payment_method, currency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [null, "completed", 5000, 0, 5000, 5000, 0, "cash", "DZD"],
      );

      await runMigrations(db);

      // Version 14 is recorded.
      const appliedRows: any[] = await db.getAllAsync(
        `SELECT version FROM _migration_version ORDER BY version`,
      );
      expect(appliedRows.map((r: any) => r.version)).toContain(14);

      // Data preserved verbatim by the rebuild.
      const product = await db.getFirstAsync(
        `SELECT name, sale_price_centimes, cost_price_centimes, stock_quantity, sku FROM products WHERE sku = 'MILK-14'`,
      );
      expect(product?.name).toBe("Lait Migration");
      expect(product?.sale_price_centimes).toBe(5000);
      expect(product?.stock_quantity).toBe(40);

      const sale = await db.getFirstAsync(
        `SELECT total_centimes, remaining_balance_centimes, currency FROM sales WHERE total_centimes = 5000`,
      );
      expect(sale?.total_centimes).toBe(5000);
      expect(sale?.currency).toBe("DZD");

      // Non-negative CHECK constraints are enforced.
      await expect(
        db.runAsync(
          `INSERT INTO products (name, sku, sale_price_centimes, cost_price_centimes, stock_quantity) VALUES ('Bad Price', 'BAD-1', -1, 5, 5)`,
        ),
      ).rejects.toThrow(/CHECK constraint failed/i);
      await expect(
        db.runAsync(
          `INSERT INTO products (name, sku, sale_price_centimes, cost_price_centimes, stock_quantity) VALUES ('Bad Stock', 'BAD-2', 1, 5, -5)`,
        ),
      ).rejects.toThrow(/CHECK constraint failed/i);
      await expect(
        db.runAsync(
          `INSERT INTO products (name, sku, sale_price_centimes, cost_price_centimes, stock_quantity) VALUES ('Bad Cost', 'BAD-3', 1, -2, 5)`,
        ),
      ).rejects.toThrow(/CHECK constraint failed/i);
      await expect(
        db.runAsync(
          `INSERT INTO sales (status, total_centimes, remaining_balance_centimes) VALUES ('completed', -1, 0)`,
        ),
      ).rejects.toThrow(/CHECK constraint failed/i);
      await expect(
        db.runAsync(
          `INSERT INTO sales (status, total_centimes, remaining_balance_centimes) VALUES ('completed', 0, -1)`,
        ),
      ).rejects.toThrow(/CHECK constraint failed/i);

      // The new index exists.
      const movementIndexes: any[] = await db.getAllAsync(
        `PRAGMA index_list(inventory_movements)`,
      );
      expect(movementIndexes.map((r: any) => r.name)).toContain(
        "idx_inventory_movements_product_id",
      );

      // Indexes dropped by the table rebuilds were re-created.
      const productIndexes: any[] = await db.getAllAsync(`PRAGMA index_list(products)`);
      expect(productIndexes.map((r: any) => r.name)).toContain("idx_products_is_active");
      const salesIndexes: any[] = await db.getAllAsync(`PRAGMA index_list(sales)`);
      const salesIndexNames = salesIndexes.map((r: any) => r.name);
      expect(salesIndexNames).toContain("idx_sales_sold_at");
      expect(salesIndexNames).toContain("idx_sales_customer_id");
      expect(salesIndexNames).toContain("idx_sales_status");
      expect(salesIndexNames).toContain("idx_sales_remaining_balance");
    });

    it("aborts with a clear error when existing rows violate the new constraints", async () => {
      const db = await makeDatabaseAtVersion(13);

      // v13 has no CHECK, so the negative stock can be stored.
      await db.runAsync(
        `INSERT INTO products (name, sku, sale_price_centimes, cost_price_centimes, stock_quantity)
         VALUES (?, ?, ?, ?, ?)`,
        ["Negative Stock", "NEG-14", 100, 50, -3],
      );

      await expect(runMigrations(db)).rejects.toThrow(
        /Migration 14 aborted.*products\.stock_quantity has 1 row\(s\) with a negative value/s,
      );

      // Nothing was modified: version 14 not applied, offending row untouched.
      const appliedRows: any[] = await db.getAllAsync(
        `SELECT version FROM _migration_version`,
      );
      expect(appliedRows.map((r: any) => r.version)).not.toContain(14);
      const product = await db.getFirstAsync(
        `SELECT stock_quantity FROM products WHERE sku = 'NEG-14'`,
      );
      expect(product?.stock_quantity).toBe(-3);
    });

    it("leaves foreign keys enabled after running", async () => {
      const db = await makeDatabaseAtVersion(13);
      await runMigrations(db);
      const pragma = await db.getFirstAsync(`PRAGMA foreign_keys`);
      expect(pragma?.foreign_keys).toBe(1);
    });
  });
});
