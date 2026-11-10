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

  describe("execDefensiveSql semicolon safety (F14)", () => {
    it("runs each statement of a normal multi-statement migration", async () => {
      const db: any = await openDatabaseAsync("migrations-test.db");
      await runMigrations(db, undefined, [
        {
          version: 101,
          sql: `CREATE TABLE probe_ok (id INTEGER PRIMARY KEY, label TEXT);
                 INSERT INTO probe_ok (label) VALUES ('plain label');`,
        },
      ]);

      const row = await db.getFirstAsync(`SELECT label FROM probe_ok`);
      expect(row?.label).toBe("plain label");

      const applied: any[] = await db.getAllAsync(
        `SELECT version FROM _migration_version`,
      );
      expect(applied.map((r: any) => r.version)).toContain(101);
    });

    it("tolerates escaped quotes and ordinary comments without semicolons", async () => {
      const db: any = await openDatabaseAsync("migrations-test.db");
      await runMigrations(db, undefined, [
        {
          version: 102,
          // '' is an escaped quote (no semicolon inside a string/comment).
          sql: `-- create the probe table
                 CREATE TABLE probe_esc (id INTEGER PRIMARY KEY, label TEXT);
                 INSERT INTO probe_esc (label) VALUES ('it''s ok');`,
        },
      ]);

      const row = await db.getFirstAsync(`SELECT label FROM probe_esc`);
      expect(row?.label).toBe("it's ok");
    });

    it("rejects a semicolon inside a string literal and writes nothing", async () => {
      const db: any = await openDatabaseAsync("migrations-test.db");

      await expect(
        runMigrations(db, undefined, [
          {
            version: 103,
            sql: `CREATE TABLE probe_bad (id INTEGER PRIMARY KEY, note TEXT);
                   INSERT INTO probe_bad (note) VALUES ('semi; colon');`,
          },
        ]),
      ).rejects.toThrow(/semicolon inside a single-quoted string/);

      // The guard fired before any statement executed: no table, no version row.
      const tables: any[] = await db.getAllAsync(
        `SELECT name FROM sqlite_master WHERE name = 'probe_bad'`,
      );
      expect(tables).toHaveLength(0);
      const applied: any[] = await db.getAllAsync(
        `SELECT version FROM _migration_version`,
      );
      expect(applied).toHaveLength(0);
    });

    it("rejects a semicolon inside a line comment", async () => {
      const db: any = await openDatabaseAsync("migrations-test.db");

      await expect(
        runMigrations(db, undefined, [
          {
            version: 104,
            sql: `-- a comment containing a semicolon; right here
                   CREATE TABLE probe_line (id INTEGER PRIMARY KEY);`,
          },
        ]),
      ).rejects.toThrow(/semicolon inside a line comment/);

      const tables: any[] = await db.getAllAsync(
        `SELECT name FROM sqlite_master WHERE name = 'probe_line'`,
      );
      expect(tables).toHaveLength(0);
    });

    it("rejects a semicolon inside a block comment", async () => {
      const db: any = await openDatabaseAsync("migrations-test.db");

      await expect(
        runMigrations(db, undefined, [
          {
            version: 105,
            sql: `/* block comment; with semicolon */
                   CREATE TABLE probe_block (id INTEGER PRIMARY KEY);`,
          },
        ]),
      ).rejects.toThrow(/semicolon inside a block comment/);

      const tables: any[] = await db.getAllAsync(
        `SELECT name FROM sqlite_master WHERE name = 'probe_block'`,
      );
      expect(tables).toHaveLength(0);
    });

    it("reports the line number of the offending semicolon", async () => {
      const db: any = await openDatabaseAsync("migrations-test.db");

      await expect(
        runMigrations(db, undefined, [
          {
            version: 106,
            sql: `CREATE TABLE probe_ln (id INTEGER PRIMARY KEY, note TEXT);
INSERT INTO probe_ln (note) VALUES ('first');
INSERT INTO probe_ln (note) VALUES ('offending; semicolon');`,
          },
        ]),
      ).rejects.toThrow(/line 3/);
    });
  });

  describe("rebuild atomicity (runsOutsideTransaction)", () => {
    it("rolls back the whole rebuild when a statement fails after DROP TABLE, and the rerun succeeds", async () => {
      const db: any = await openDatabaseAsync("migrations-test.db");
      await runMigrations(db, undefined, [
        {
          version: 210,
          sql: `CREATE TABLE probe_rebuild (id INTEGER PRIMARY KEY, label TEXT);
                 INSERT INTO probe_rebuild (label) VALUES ('original');`,
        },
      ]);

      // A rebuild that crashes after the DROP (here: a statement erroring
      // before the RENAME) left the old table dropped and the copy stranded
      // when statements ran in autocommit mode.
      await expect(
        runMigrations(db, undefined, [
          {
            version: 211,
            runsOutsideTransaction: true,
            sql: `CREATE TABLE probe_rebuild_v (id INTEGER PRIMARY KEY, label TEXT);
                   INSERT INTO probe_rebuild_v (id, label) SELECT id, label FROM probe_rebuild;
                   DROP TABLE probe_rebuild;
                   SELECT no_such_column FROM probe_rebuild_v;
                   ALTER TABLE probe_rebuild_v RENAME TO probe_rebuild;`,
          },
        ]),
      ).rejects.toThrow(/no such column/);

      // Nothing stranded: the target table is intact with its data, the
      // rebuild table is gone.
      const tables: any[] = await db.getAllAsync(
        `SELECT name FROM sqlite_master WHERE name IN ('probe_rebuild', 'probe_rebuild_v')`,
      );
      const names = tables.map((r: any) => r.name);
      expect(names).toContain("probe_rebuild");
      expect(names).not.toContain("probe_rebuild_v");
      const row = await db.getFirstAsync(
        `SELECT label FROM probe_rebuild`,
      );
      expect(row?.label).toBe("original");

      // The failed migration was not recorded, and foreign keys stayed on.
      const applied: any[] = await db.getAllAsync(
        `SELECT version FROM _migration_version`,
      );
      expect(applied.map((r: any) => r.version)).not.toContain(211);
      const pragma = await db.getFirstAsync(`PRAGMA foreign_keys`);
      expect(pragma?.foreign_keys).toBe(1);

      // The rerun succeeds: the schema is clean, nothing half-applied blocks it.
      await runMigrations(db, undefined, [
        {
          version: 211,
          runsOutsideTransaction: true,
          sql: `CREATE TABLE probe_rebuild_v (id INTEGER PRIMARY KEY, label TEXT);
                 INSERT INTO probe_rebuild_v (id, label) SELECT id, label FROM probe_rebuild;
                 DROP TABLE probe_rebuild;
                 ALTER TABLE probe_rebuild_v RENAME TO probe_rebuild;`,
        },
      ]);
      const afterRerun = await db.getFirstAsync(
        `SELECT label FROM probe_rebuild`,
      );
      expect(afterRerun?.label).toBe("original");
      const appliedAfter: any[] = await db.getAllAsync(
        `SELECT version FROM _migration_version`,
      );
      expect(appliedAfter.map((r: any) => r.version)).toContain(211);
    });

    it("aborts and rolls back when PRAGMA foreign_key_check finds violations before commit", async () => {
      const db: any = await openDatabaseAsync("migrations-test.db");

      // The rebuild inserts a child row pointing at a parent that does not
      // exist — legal only while foreign_keys=OFF. The pre-commit check must
      // catch it and roll the whole migration back.
      await expect(
        runMigrations(db, undefined, [
          {
            version: 212,
            runsOutsideTransaction: true,
            sql: `CREATE TABLE fk_parent (id INTEGER PRIMARY KEY);
                   CREATE TABLE fk_child (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES fk_parent(id));
                   INSERT INTO fk_child (id, parent_id) VALUES (1, 999);`,
          },
        ]),
      ).rejects.toThrow(/foreign-key violation/);

      const tables: any[] = await db.getAllAsync(
        `SELECT name FROM sqlite_master WHERE name IN ('fk_parent', 'fk_child')`,
      );
      expect(tables).toHaveLength(0);
      const applied: any[] = await db.getAllAsync(
        `SELECT version FROM _migration_version`,
      );
      expect(applied.map((r: any) => r.version)).not.toContain(212);
    });
  });

  // @ts-ignore - the mock tests use the internal function directly
  describe("snapshotDatabaseFile (internal)", () => {
    it("executes PRAGMA wal_checkpoint(TRUNCATE) and PRAGMA integrity_check before copying", async () => {
      // Mock a DB with explicit runAsync and getAllAsync to capture calls.
      const db: any = {
        runAsync: jest.fn(),
        getAllAsync: jest.fn().mockResolvedValue([{ integrity_check: "ok" }]),
      };

      // Call the internal snapshot function with minimal mocking to avoid real file I/O.
      // Since we are testing an internal function, we can just let the failure happen in the FileSystem.locationCheck.
      // This test focuses on verifying the DB calls for checkpoint and integrity.
      await require("../migrations").snapshotDatabaseFile(db, 1).catch(() => {});

      // Verify the checkpoint was called via runAsync.
      expect(db.runAsync).toHaveBeenCalledWith("PRAGMA wal_checkpoint(TRUNCATE)");

      // Verify the integrity check was called via getAllAsync.
      expect(db.getAllAsync).toHaveBeenCalledWith("PRAGMA integrity_check");
    });
  });
});
