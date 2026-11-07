/**
 * backupService — full-data backup (export) and restore (import) for DukkanPro.
 *
 * - createBackup(): snapshot every user-data table into a versioned JSON file
 *   written under the app's documents directory.
 * - restoreBackup(): validate the file, then replace all data in ONE atomic
 *   SQLite transaction — either the whole backup is applied or nothing
 *   changes. It refuses to overwrite a non-empty database unless the caller
 *   passes { confirmOverwrite: true }.
 * - Money is copied verbatim as integer centimes; nothing is converted or
 *   recomputed on import (structural validation happens in backupFormat.ts).
 * - _migration_version is never exported or imported: restore only ever
 *   replaces row DATA inside the app's current schema. A backup from a newer
 *   app is rejected (BACKUP_NEWER_VERSION); older backups restore into the
 *   current schema because migrations so far are additive.
 */

import * as FileSystem from "expo-file-system/legacy";

import { executeAll, executeRead, executeWrite, getDatabase, transaction } from "@/database/database";
import { migrationVersions } from "@/database/migrations";
import {
  BACKUP_FORMAT,
  BACKUP_TABLES,
  SUPPORTED_BACKUP_VERSION,
  TABLE_SPECS,
  TableRow,
  type BackupData,
  type BackupTable,
  validateBackup,
} from "./backupFormat";

const CURRENT_DATABASE_VERSION = migrationVersions[migrationVersions.length - 1];

// Child first, parent last — safe deletion order.
const DELETE_ORDER: BackupTable[] = [
  "sale_items",
  "customer_payments",
  "inventory_movements",
  "sales",
  "products",
  "customers",
  "business_profiles",
  "app_settings",
];

// Parent first, child last — safe insertion order.
const INSERT_ORDER: BackupTable[] = [...DELETE_ORDER].reverse();

export type RestoreSummary = {
  rowsImported: number;
  tableCounts: Record<BackupTable, number>;
};

function columnsOf(table: BackupTable): string[] {
  return TABLE_SPECS[table].map((c) => c.name);
}

/**
 * Read a consistent snapshot of every user-data table into a BackupData
 * object. All reads run inside a single transaction so a concurrent sale can
 * never produce a torn header/items pair (WAL gives a stable view per
 * transaction).
 */
export async function buildBackup(): Promise<BackupData> {
  const db = await getDatabase();
  return await transaction(db, async (tx) => {
    const tables = {} as Record<BackupTable, TableRow[]>;

    for (const table of BACKUP_TABLES) {
      const cols = columnsOf(table).join(", ");
      tables[table] = await executeAll<TableRow>(tx, `SELECT ${cols} FROM ${table}`);
    }

    const versionRows = await executeRead<{ v: number }>(
      tx,
      `SELECT MAX(version) AS v FROM _migration_version`,
    );
    const profileRows = await executeRead<{ business_name: string | null; currency: string | null }>(
      tx,
      `SELECT business_name, currency FROM business_profiles LIMIT 1`,
    );

    return {
      format: BACKUP_FORMAT,
      backupVersion: SUPPORTED_BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      databaseVersion: versionRows[0]?.v ?? 1,
      store: {
        businessName: profileRows[0]?.business_name ?? null,
        currency: profileRows[0]?.currency ?? null,
      },
      tables,
    };
  });
}

/**
 * Build the backup and write it to
 * <documentsDirectory>/DukkanPro/backups/dukkanpro-backup-YYYY-MM-DD.json.
 * Returns the file URI (for the OS share sheet) and the data itself.
 */
export async function createBackup(): Promise<{ uri: string; data: BackupData }> {
  const data = await buildBackup();

  if (!FileSystem.documentDirectory) {
    throw new Error("BACKUP_IO_ERROR: The app documents directory is unavailable.");
  }
  const dir = `${FileSystem.documentDirectory}DukkanPro/backups`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const date = new Date().toISOString().slice(0, 10);
  const uri = `${dir}/dukkanpro-backup-${date}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return { uri, data };
}

/**
 * Validate and restore a backup file's raw JSON contents in one atomic
 * transaction. Refuses to overwrite a non-empty database unless
 * { confirmOverwrite: true } is passed. Throws with a typed prefix
 * (INVALID_BACKUP_FILE / UNSUPPORTED_BACKUP_VERSION / BACKUP_NEWER_VERSION /
 * INVALID_BACKUP_CONTENT / BROKEN_REFERENCES / OVERWRITE_REQUIRED /
 * RESTORE_INCONSISTENT) so callers can surface a specific message.
 */
export async function restoreBackup(
  fileContents: string,
  options: { confirmOverwrite?: boolean } = {},
): Promise<RestoreSummary> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileContents);
  } catch (err: any) {
    throw new Error(`INVALID_BACKUP_FILE: file is not valid JSON (${err?.message ?? "parse error"})`);
  }
  const backup = validateBackup(parsed, CURRENT_DATABASE_VERSION);

  const db = await getDatabase();
  return await transaction(db, async (tx) => {
    // Overwrite guard — runs before any DELETE, so a refusal leaves the
    // existing database byte-for-byte untouched.
    const nonEmpty: string[] = [];
    for (const table of ["business_profiles", "products", "customers", "sales"] as const) {
      const rows = await executeRead<{ n: number }>(tx, `SELECT COUNT(*) AS n FROM ${table}`);
      if (rows[0].n > 0) nonEmpty.push(`${table}: ${rows[0].n} row(s)`);
    }
    if (nonEmpty.length > 0 && options.confirmOverwrite !== true) {
      throw new Error(
        `OVERWRITE_REQUIRED: The database is not empty (${nonEmpty.join(", ")}). Restoring would replace all data — pass { confirmOverwrite: true } after explicit user confirmation.`,
      );
    }

    // 1. Wipe in child→parent order and clear autoincrement bookkeeping so
    //    imported ids restart cleanly.
    for (const table of DELETE_ORDER) {
      await executeWrite(tx, `DELETE FROM ${table}`);
    }
    await executeWrite(
      tx,
      `DELETE FROM sqlite_sequence WHERE name IN (${BACKUP_TABLES.map(() => "?").join(", ")})`,
      [...BACKUP_TABLES],
    );

    // 2. Insert parent→child with the rows' exact original ids (prepared
    //    statements; foreign keys hold throughout the order).
    let rowsImported = 0;
    for (const table of INSERT_ORDER) {
      const cols = columnsOf(table);
      const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols
        .map(() => "?")
        .join(", ")})`;
      for (const row of backup.tables[table]) {
        await executeWrite(tx, sql, cols.map((c) => row[c] ?? null));
        rowsImported++;
      }
    }

    // 3. Verify what landed before committing: row counts and the stock
    //    ledger reconciliation rule (SUM(quantity_change) per product equals
    //    stock_quantity).
    const tableCounts = {} as Record<BackupTable, number>;
    for (const table of BACKUP_TABLES) {
      const rows = await executeRead<{ n: number }>(tx, `SELECT COUNT(*) AS n FROM ${table}`);
      tableCounts[table] = rows[0].n;
    }

    const ledger = await executeAll<{ product_id: number; total: number | null }>(
      tx,
      `SELECT product_id, SUM(quantity_change) AS total FROM inventory_movements GROUP BY product_id`,
    );
    for (const entry of ledger) {
      const productRows = await executeRead<{ stock_quantity: number }>(
        tx,
        `SELECT stock_quantity FROM products WHERE id = ?`,
        [entry.product_id],
      );
      if (productRows.length === 1 && (entry.total ?? 0) !== productRows[0].stock_quantity) {
        throw new Error(
          `RESTORE_INCONSISTENT: Restored ledger does not reconcile for product id=${entry.product_id} (movements sum ${entry.total} vs stock ${productRows[0].stock_quantity}). Restore rolled back.`,
        );
      }
    }

    return { rowsImported, tableCounts };
  });
}
