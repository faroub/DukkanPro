/**
 * Migrations.ts — Versioned, transactional, and idempotent migration runner for DukkanPro.
 *
 * Rules:
 * - Each migration runs inside a single atomic SQLite transaction (SQL + _migration_version record).
 * - ALTER TABLE statements are defensive: column existence is checked via PRAGMA table_info first.
 * - Migrations are numbered sequentially and run via `runMigrations(db)`.
 */

import { rawTransaction } from "./query";
import { schema } from "./schema";

export type Migration = {
  version: number;
  sql: string;
};

const ALL_MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: schema.migrationVersion,
  },
  {
    version: 2,
    sql: schema.businessProfiles,
  },
  {
    version: 3,
    sql: schema.products,
  },
  {
    version: 4,
    sql: schema.customers,
  },
  {
    version: 5,
    sql: schema.sales,
  },
  {
    version: 6,
    sql: schema.saleItems,
  },
  {
    version: 7,
    sql: schema.customerPayments,
  },
  {
    version: 8,
    sql: schema.inventoryMovements,
  },
  {
    version: 9,
    sql: schema.appSettings,
  },
  {
    version: 10,
    sql: schema.businessProfilesContact,
  },
  {
    version: 11,
    sql: schema.indexes,
  },
];

/**
 * Safely executes migration SQL statements.
 * For ALTER TABLE ADD COLUMN statements, checks PRAGMA table_info first to avoid
 * "duplicate column name" crashes if a column was already added before a crash.
 */
async function execDefensiveSql(db: any, sql: string): Promise<void> {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    const alterMatch = stmt.match(
      /ALTER\s+TABLE\s+([^\s]+)\s+ADD\s+COLUMN\s+([^\s]+)\s+(.*)/i,
    );
    if (alterMatch) {
      const tableName = alterMatch[1].replace(/[`"']/g, "");
      const columnName = alterMatch[2].replace(/[`"']/g, "");
      const colTypeSpec = alterMatch[3];

      const columns: any[] = await db.getAllAsync(
        `PRAGMA table_info(${tableName})`,
      );
      const exists = columns.some(
        (c: any) => c.name.toLowerCase() === columnName.toLowerCase(),
      );

      if (!exists) {
        await db.execAsync(
          `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${colTypeSpec}`,
        );
      }
    } else {
      await db.execAsync(stmt);
    }
  }
}

export async function runMigrations(db: any): Promise<void> {
  // Ensure the version table exists first
  await db.execAsync(schema.migrationVersion);

  // Get already-applied versions
  const appliedRows: any[] = await db.getAllAsync(
    "SELECT version FROM _migration_version ORDER BY version",
  );
  const appliedVersions = new Set(appliedRows.map((r: any) => r.version));

  // Run pending migrations in order, wrapping each migration + version insert in a transaction
  for (const migration of ALL_MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      await rawTransaction(db, async (tx) => {
        await execDefensiveSql(tx, migration.sql);
        await tx.runAsync(
          "INSERT INTO _migration_version (version) VALUES (?)",
          [migration.version],
        );
      });
    }
  }
}

export const migrationVersions = ALL_MIGRATIONS.map((m) => m.version);
