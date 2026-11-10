/**
 * Migrations.ts — Versioned, transactional, and idempotent migration runner for DukkanPro.
 *
 * Rules:
 * - Each migration runs inside a single atomic SQLite transaction (SQL + _migration_version record).
 * - Table-rebuild migrations (runsOutsideTransaction) also run inside one atomic
 *   BEGIN IMMEDIATE ... COMMIT — SQLite DDL is transactional, so a crash or error
 *   between the copy, DROP and RENAME leaves the old schema untouched and the
 *   migration re-runnable. Rebuilding requires PRAGMA foreign_keys=OFF, and
 *   SQLite ignores PRAGMAs inside a transaction, so the pragma is set before
 *   BEGIN and restored after COMMIT. PRAGMA foreign_key_check runs before
 *   COMMIT and aborts the rebuild when references would be left dangling, and
 *   the database file is snapshotted beforehand as a best-effort recovery copy.
 * - Their optional precheck guard aborts before any data is touched when
 *   existing rows would violate a new constraint — the migration never
 *   silently rewrites data.
 * - ALTER TABLE statements are defensive: column existence is checked via PRAGMA table_info first.
 * - Migrations are numbered sequentially and run via `runMigrations(db)`.
 */

import * as FileSystem from "expo-file-system/legacy";

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
 * Statements are split on semicolons (';'), which means a semicolon inside a
 * string literal, quoted identifier, or comment would silently tear a statement
 * apart. assertNoQuotedSemicolon rejects such SQL up front instead of
 * executing the fragments.
 */
function assertNoQuotedSemicolon(sql: string): void {
  let state: "normal" | "single" | "double" | "line" | "block" = "normal";
  let line = 1;

  const where = (s: string) =>
    s === "single"
      ? "a single-quoted string"
      : s === "double"
        ? "a double-quoted identifier"
        : s === "line"
          ? "a line comment"
          : "a block comment";

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];
    if (ch === "\n") line++;

    switch (state) {
      case "normal":
        if (ch === "'") state = "single";
        else if (ch === '"') state = "double";
        else if (ch === "-" && next === "-") {
          state = "line";
          i++;
        } else if (ch === "/" && next === "*") {
          state = "block";
          i++;
        }
        break;
      case "single":
        if (ch === "'" && next === "'") i++; // escaped quote
        else if (ch === "'") state = "normal";
        else if (ch === ";")
          throw new Error(
            `Migration SQL contains a semicolon inside ${where("single")} (line ${line}). execDefensiveSql splits on ';' and would execute torn fragments — remove the semicolon or split the statement.`,
          );
        break;
      case "double":
        if (ch === '"' && next === '"') i++; // escaped quote
        else if (ch === '"') state = "normal";
        else if (ch === ";")
          throw new Error(
            `Migration SQL contains a semicolon inside ${where("double")} (line ${line}). execDefensiveSql splits on ';' and would execute torn fragments — remove the semicolon or split the statement.`,
          );
        break;
      case "line":
        if (ch === "\n") state = "normal";
        else if (ch === ";")
          throw new Error(
            `Migration SQL contains a semicolon inside ${where("line")} (line ${line}). execDefensiveSql splits on ';' and would execute torn fragments — remove the semicolon or split the statement.`,
          );
        break;
      case "block":
        if (ch === "*" && next === "/") {
          state = "normal";
          i++;
        } else if (ch === ";")
          throw new Error(
            `Migration SQL contains a semicolon inside ${where("block")} (line ${line}). execDefensiveSql splits on ';' and would execute torn fragments — remove the semicolon or split the statement.`,
          );
        break;
    }
  }
}

async function execDefensiveSql(db: any, sql: string): Promise<void> {
  assertNoQuotedSemicolon(sql);

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

const DATABASE_FILE_NAME = "DukkanPro.db";

/**
 * Before a table-rebuild migration, snapshot the database file so the data can
 * be recovered by hand if anything catastrophic happens. The atomic
 * transaction is the primary safety net; this copy is the last-resort one.
 * Best-effort by design: when the file cannot be located or copied (in-memory
 * test databases, unavailable file system), the migration still proceeds — a
 * snapshot failure must never strand the merchant on their old schema.
 *
 * The snapshot is made consistent by checkpointing the WAL to the main file
 * and then verifying integrity with a PRAGMA integrity_check.
 */
export async function snapshotDatabaseFile(db: any, migrationVersion: number): Promise<void> {
  try {
    // Ensure all pending changes are in the main file by checkpointing the WAL.
    // TRUNCATE mode checks the WAL and then optionally Truncates it to release resources.
    await db.runAsync("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch (error) {
    console.error(
      `Pre-migration WAL checkpoint (migration ${migrationVersion}) failed; the migration will proceed:`,
      error,
    );
  }

  try {
    // Verify that the database is in a consistent state after checkpoint.
    const integrityResult: any[] = await db.getAllAsync("PRAGMA integrity_check");
    if (integrityResult.length === 0 || integrityResult[0].integrity_check !== "ok") {
      console.warn(
        `Pre-migration database integrity failed (migration ${migrationVersion}); the snapshot may be unverified:`,
        integrityResult,
      );
    }
  } catch (error) {
    console.error(
      `Pre-migration integrity check (migration ${migrationVersion}) failed; the migration will proceed:`,
      error,
    );
  }

  try {
    if (!FileSystem.documentDirectory) return;
    const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_FILE_NAME}`;
    const info = await FileSystem.getInfoAsync(dbPath);
    if (!info?.exists) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await FileSystem.copyAsync({
      from: dbPath,
      to: `${FileSystem.documentDirectory}SQLite/${DATABASE_FILE_NAME}.pre-v${migrationVersion}-${stamp}`,
    });
  } catch (error) {
    console.error(
      `Pre-migration database snapshot (migration ${migrationVersion}) failed; the migration will proceed:`,
      error,
    );
  }
}

/**
 * Run pending migrations in order. The third parameter exists so tests can
 * exercise the runner against synthetic migration fixtures; production code
 * leaves it at the default (ALL_MIGRATIONS).
 */
export async function runMigrations(
  db: any,
  targetVersion?: number,
  migrations: Migration[] = ALL_MIGRATIONS,
): Promise<void> {
  // Ensure the version table exists first
  await db.execAsync(schema.migrationVersion);

  // Get already-applied versions
  const appliedRows: any[] = await db.getAllAsync(
    "SELECT version FROM _migration_version ORDER BY version",
  );
  const appliedVersions = new Set(appliedRows.map((r: any) => r.version));

  // Run pending migrations in order, wrapping each migration + version insert in a transaction
  const target = targetVersion ?? migrations[migrations.length - 1].version;

  for (const migration of migrations) {
    if (migration.version > target) continue;

    if (!appliedVersions.has(migration.version)) {
      if (migration.runsOutsideTransaction) {
        // Best-effort file snapshot before the rebuild (see snapshotDatabaseFile).
        await snapshotDatabaseFile(db, migration.version);
        // foreign_keys=OFF must be set OUTSIDE the transaction (SQLite ignores
        // PRAGMAs inside one) and is restored after COMMIT.
        await db.execAsync("PRAGMA foreign_keys = OFF");
        try {
          if (migration.precheck) {
            await migration.precheck(db);
          }
          // The whole rebuild — create, copy, drop, rename, indexes, version
          // record — runs in one atomic transaction, so a crash or error
          // anywhere inside leaves the pre-migration schema untouched and the
          // migration still re-runnable.
          await db.execAsync("BEGIN IMMEDIATE");
          try {
            await execDefensiveSql(db, migration.sql);
            await db.runAsync(
              "INSERT INTO _migration_version (version) VALUES (?)",
              [migration.version],
            );
            // Integrity gate: never commit a rebuild that left dangling
            // references. PRAGMA foreign_key_check works with foreign_keys
            // disabled (it is a read-only diagnostic over the schema).
            const violations: any[] = await db.getAllAsync(
              "PRAGMA foreign_key_check",
            );
            if (violations.length > 0) {
              throw new Error(
                `Migration ${migration.version} aborted before commit: ${violations.length} foreign-key violation(s) (${violations
                  .slice(0, 3)
                  .map(
                    (v) =>
                      `${v.table} row ${v.rowid} references missing ${v.parent}`,
                  )
                  .join("; ")}). The transaction was rolled back.`,
              );
            }
            await db.execAsync("COMMIT");
          } catch (error) {
            try {
              await db.execAsync("ROLLBACK");
            } catch (rollbackError) {
              // ROLLBACK only fails when no transaction is open (the BEGIN
              // itself failed) or the connection is gone — neither case can
              // have modified the database.
              console.error(
                `Migration ${migration.version}: ROLLBACK failed after an error`,
                rollbackError,
              );
            }
            throw error;
          }
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
