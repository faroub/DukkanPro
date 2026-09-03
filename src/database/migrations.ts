/**
 * Migrations.ts — Versioned migration runner for Dukkan OS SQLite database.
 *
 * - Each migration runs only once, tracked in _migration_version table.
 - Migrations are numbered sequentially. Run via `runMigrations(db)`.
 - Down migrations are NOT supported — financial records must never be physically deleted.
 */

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
];

export async function runMigrations(db: any): Promise<void> {
  // Ensure the version table exists first
  await db.execAsync(schema.migrationVersion);

  // Get already-applied versions
  const appliedRows: any[] = await db.getAllAsync(
    "SELECT version FROM _migration_version ORDER BY version",
  );
  const appliedVersions = new Set(appliedRows.map((r: any) => r.version));

  // Run pending migrations in order
  for (const migration of ALL_MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      await db.execAsync(migration.sql);
      await db.runAsync(
        "INSERT INTO _migration_version (version) VALUES (?)",
        migration.version,
      );
      // Note: we do not log here; the app will notify the user on next start
    }
  }
}

// Convenience: export the list of migration versions for UI / monitoring
export const migrationVersions = ALL_MIGRATIONS.map((m) => m.version);
