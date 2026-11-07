/**
 * Migrations.ts — Versioned, transactional, and idempotent migration runner for DukkanPro.
 *
 * Rules:
 * - Each migration runs inside a single atomic SQLite transaction (SQL + _migration_version record).
 * - Table-rebuild migrations (runsOutsideTransaction) cannot use that transaction: rebuilding with
 *   foreign_keys=OFF requires a PRAGMA, and SQLite ignores PRAGMAs inside a transaction. Their
 *   optional precheck guard aborts before any data is touched when existing rows would violate a
 *   new constraint — the migration never silently rewrites data.
 * - ALTER TABLE statements are defensive: column existence is checked via PRAGMA table_info first.
 * - Migrations are numbered sequentially and run via `runMigrations(db)`.
 */

import { rawTransaction } from "./query";
import { schema } from "./schema";

export type Migration = {
  version: number;
  sql: string;
  /**
   * Read-only guard run before the migration. Throwing aborts the migration
   * before any statement executes (used when existing data would violate a
   * new constraint and must not be silently rewritten).
   */
  precheck?: (db: any) => Promise<void>;
  /**
   * True for migrations that rebuild tables. SQLite cannot disable foreign
   * keys inside a transaction, so these run un-transacted with
   * PRAGMA foreign_keys=OFF instead.
   */
  runsOutsideTransaction?: boolean;
};

/**
 * Migration 14 guard: refuse to add non-negative CHECK constraints while rows
 * with negative values exist — the rebuild would either fail mid-copy or force
 * a silent data change. The merchant must fix the data before upgrading.
 */
async function assertNoNegativeMoneyOrStock(db: any): Promise<void> {
  const checks = [
    ["products", "stock_quantity"],
    ["products", "sale_price_centimes"],
    ["products", "cost_price_centimes"],
    ["sales", "total_centimes"],
    ["sales", "remaining_balance_centimes"],
  ];
  const violations: string[] = [];
  for (const [table, column] of checks) {
    const rows: any[] = await db.getAllAsync(
      `SELECT COUNT(*) AS n FROM ${table} WHERE ${column} < 0`,
    );
    const count = rows[0]?.n ?? 0;
    if (count > 0) {
      violations.push(`${table}.${column} has ${count} row(s) with a negative value`);
    }
  }
  if (violations.length > 0) {
    throw new Error(
      `Migration 14 aborted: negative data would violate the new non-negative constraints (${violations.join("; ")}). Correct or remove the offending rows before upgrading.`,
    );
  }
}

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
  {
    version: 12,
    sql: schema.salesCurrency,
  },
  {
    version: 13,
    sql: schema.customerPaymentsCurrency,
  },
  {
    version: 14,
    sql: schema.integrityConstraintsV14,
    runsOutsideTransaction: true,
    precheck: assertNoNegativeMoneyOrStock,
  },
];

/**
 * Safely executes migration SQL statements.
 * For ALTER TABLE ADD COLUMN statements, checks PRAGMA table_info first to avoid
 * "duplicate column name" crashes if a column was already added before a crash.
 *
 * CAUTION: Statements are split on semicolons (';'). Future migrations MUST NOT
 * embed semicolons within string literals, DEFAULT values, or SQL comments.
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

export async function runMigrations(db: any, targetVersion?: number): Promise<void> {
  // Ensure the version table exists first
  await db.execAsync(schema.migrationVersion);

  // Get already-applied versions
  const appliedRows: any[] = await db.getAllAsync(
    "SELECT version FROM _migration_version ORDER BY version",
  );
  const appliedVersions = new Set(appliedRows.map((r: any) => r.version));

  // Run pending migrations in order, wrapping each migration + version insert in a transaction
  const target = targetVersion ?? migrationVersions[migrationVersions.length - 1];

  for (const migration of ALL_MIGRATIONS) {
    if (migration.version > target) continue;

    if (!appliedVersions.has(migration.version)) {
      if (migration.runsOutsideTransaction) {
        // Table rebuilds (CREATE / copy / DROP / RENAME) require
        // PRAGMA foreign_keys=OFF, which SQLite ignores inside a transaction,
        // so these migrations run outside one. The precheck guard throws
        // before any statement executes when data would violate the new
        // constraints.
        await db.execAsync("PRAGMA foreign_keys = OFF");
        try {
          if (migration.precheck) {
            await migration.precheck(db);
          }
          await execDefensiveSql(db, migration.sql);
          await db.runAsync(
            "INSERT INTO _migration_version (version) VALUES (?)",
            [migration.version],
          );
        } finally {
          await db.execAsync("PRAGMA foreign_keys = ON");
        }
      } else {
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
}

export const migrationVersions = ALL_MIGRATIONS.map((m) => m.version);
