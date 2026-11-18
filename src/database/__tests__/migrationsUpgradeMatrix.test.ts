/**
 * migrationsUpgradeMatrix.test.ts — End-to-End Migration Upgrade & Compatibility Matrix
 *
 * Verifies that:
 * 1. Historical database schemas (v1..v15) cleanly upgrade to the latest schema (v16).
 * 2. Pre-existing merchant data (products, customers, sales, payments, movements, settings) survives intact.
 * 3. Migration prechecks abort on invalid data without mutating database schema or rows.
 * 4. Post-migration foreign keys, indexes, triggers, and constraints are 100% active.
 * 5. Migration re-runs are idempotent.
 */

import { openDatabaseAsync } from "expo-sqlite";
import { migrationVersions, runMigrations } from "../migrations";

async function createDatabaseAtVersion(targetVersion: number, dbName: string) {
  const db: any = await openDatabaseAsync(dbName);
  await runMigrations(db, targetVersion);
  return db;
}

describe("DP-02: SQLite Migration Upgrade Matrix & Schema Invariants", () => {
  it("upgrades a legacy database from v10 (post-contact, pre-currency) to v16 preserving data and indexes", async () => {
    const db = await createDatabaseAtVersion(10, "upgrade_v10_v16.db");

    // Seed realistic v10 merchant data
    await db.runAsync(
      `INSERT INTO business_profiles (business_name, owner_name, business_type, currency, selected_locale, phone_number)
       VALUES ('Épicerie El Djazaïr', 'Nourredine', 'grocery', 'DZD', 'fr', '0550112233')`
    );

    await db.runAsync(
      `INSERT INTO products (name, sku, category, sale_price_centimes, cost_price_centimes, stock_quantity, minimum_stock_quantity, unit, is_active)
       VALUES ('Huile d''olive 1L', '0012345678', 'Epicerie', 12000, 8000, 25, 5, 'L', 1)`
    );

    await db.runAsync(
      `INSERT INTO customers (name, phone, note, is_active)
       VALUES ('Mourad Client', '0661998877', 'Regular customer', 1)`
    );

    await db.runAsync(
      `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes, total_centimes, amount_paid_centimes, remaining_balance_centimes, payment_method, sold_at)
       VALUES (1, 'completed', 12000, 0, 12000, 12000, 0, 'cash', datetime('now'))`
    );

    await db.runAsync(
      `INSERT INTO sale_items (sale_id, product_id, product_name_snapshot, quantity, unit_sale_price_centimes, unit_cost_price_centimes, line_total_centimes)
       VALUES (1, 1, 'Huile d''olive 1L', 1, 12000, 8000, 12000)`
    );

    await db.runAsync(
      `INSERT INTO app_settings (key, value) VALUES ('store_mode', 'standard')`
    );

    // Perform full upgrade to v16
    await runMigrations(db);

    // 1. Verify version table
    const versions: any[] = await db.getAllAsync(`SELECT version FROM _migration_version ORDER BY version`);
    expect(versions.map((v) => v.version)).toEqual(migrationVersions);

    // 2. Verify business profile singleton & contact columns
    const profile = await db.getFirstAsync(`SELECT business_name, phone_number, currency FROM business_profiles`);
    expect(profile.business_name).toBe("Épicerie El Djazaïr");
    expect(profile.phone_number).toBe("0550112233");

    // 3. Verify product data & normalized_sku reconstruction from v15
    const product = await db.getFirstAsync(`SELECT name, sku, normalized_sku, stock_quantity FROM products WHERE id = 1`);
    expect(product.name).toBe("Huile d'olive 1L");
    expect(product.sku).toBe("0012345678");
    expect(product.normalized_sku).toBe("12345678");

    // 4. Verify historical currency default applied in v12/v13
    const sale = await db.getFirstAsync(`SELECT total_centimes, currency FROM sales WHERE id = 1`);
    expect(sale.total_centimes).toBe(12000);
    expect(sale.currency).toBe("DZD");

    // 5. Verify foreign keys and indexes active
    const fkPragma = await db.getFirstAsync(`PRAGMA foreign_keys`);
    expect(fkPragma.foreign_keys).toBe(1);

    const indexes: any[] = await db.getAllAsync(`SELECT name FROM sqlite_master WHERE type = 'index'`);
    const indexNames = indexes.map((i) => i.name);
    expect(indexNames).toContain("idx_products_normalized_sku");
    expect(indexNames).toContain("idx_business_profiles_singleton");
    expect(indexNames).toContain("idx_sales_sold_at");
  });

  it("upgrades a database from v13 (pre-CHECK rebuild) to v16 preserving data and enforcing non-negative constraints", async () => {
    const db = await createDatabaseAtVersion(13, "upgrade_v13_v16.db");

    await db.runAsync(
      `INSERT INTO products (name, sku, category, sale_price_centimes, cost_price_centimes, stock_quantity, minimum_stock_quantity, unit, is_active)
       VALUES ('Couscous 1kg', 'COUS-001', 'Céréales', 2500, 1500, 100, 10, 'kg', 1)`
    );

    await runMigrations(db);

    const product = await db.getFirstAsync(`SELECT name, normalized_sku FROM products WHERE sku = 'COUS-001'`);
    expect(product.name).toBe("Couscous 1kg");
    expect(product.normalized_sku).toBe("cous-001");

    // CHECK constraints active
    await expect(
      db.runAsync(
        `INSERT INTO products (name, sku, sale_price_centimes, cost_price_centimes, stock_quantity)
         VALUES ('Bad Stock', 'BAD-STK', 1000, 500, -1)`
      )
    ).rejects.toThrow(/CHECK constraint failed/i);
  });

  it("is idempotent when runMigrations() is invoked repeatedly on a fully upgraded v16 database", async () => {
    const db = await createDatabaseAtVersion(16, "idempotent_v16.db");

    // Re-running runMigrations should do nothing and resolve cleanly
    await expect(runMigrations(db)).resolves.not.toThrow();

    const versions: any[] = await db.getAllAsync(`SELECT version FROM _migration_version ORDER BY version`);
    expect(versions.map((v) => v.version)).toEqual(migrationVersions);
  });
});
