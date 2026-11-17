/**
 * resetRepository — Destructive data-clearing helpers for Dukkan OS.
 *
 * `clearBusinessData` (soft reset) removes the catalogue and all transaction
 * records but keeps the business profile and app settings, so the merchant can
 * start ringing sales without re-onboarding.
 *
 * `resetDatabase` (hard reset) wipes everything, including the profile, and is
 * followed by re-onboarding.
 *
 * Both run inside a single transaction so a partial wipe can never be committed.
 * sqlite_sequence is cleared so autoincrement IDs restart from 1.
 */

import { getDatabase, transaction, DATABASE_FILE_NAME } from "../database";
import * as FileSystem from "expo-file-system/legacy";

const TRANSACTION_TABLES = [
  "sale_items",
  "customer_payments",
  "inventory_movements",
  "sales",
  "products",
  "customers",
] as const;

const ALL_TABLES = [
  ...TRANSACTION_TABLES,
  "business_profiles",
  "app_settings",
] as const;

/**
 * Remove all catalogue and transaction data, keeping the business profile and
 * app settings (locale, onboarding flag) intact.
 */
export async function clearBusinessData(): Promise<void> {
  const db = await getDatabase();
  await transaction(db, async (tx) => {
    for (const table of TRANSACTION_TABLES) {
      await tx.runAsync(`DELETE FROM ${table}`);
    }
    await tx.runAsync(
      `DELETE FROM sqlite_sequence WHERE name IN (${TRANSACTION_TABLES.map(
        () => "?",
      ).join(", ")})`,
      ...TRANSACTION_TABLES,
    );
  });
}

export interface FileCleanupResult {
  success: boolean;
  deletedFiles: string[];
  errors: string[];
}

/**
 * Perform idempotent cleanup of application-owned backup files and pre-migration database snapshots.
 * Explicitly protects the active database file (DukkanPro.db), WAL/SHM journal files, and unrelated user files.
 */
export async function cleanHardResetFiles(): Promise<FileCleanupResult> {
  const deletedFiles: string[] = [];
  const errors: string[] = [];

  try {
    if (!FileSystem.documentDirectory) {
      return { success: true, deletedFiles, errors };
    }

    // 1. Delete backups directory
    const backupsDir = `${FileSystem.documentDirectory}DukkanPro/backups`;
    try {
      const info = await FileSystem.getInfoAsync(backupsDir);
      if (info && info.exists) {
        await FileSystem.deleteAsync(backupsDir, { idempotent: true });
        deletedFiles.push(backupsDir);
      }
    } catch (e: any) {
      const msg = `Failed to delete backups directory: ${e?.message ?? String(e)}`;
      console.warn(msg);
      errors.push(msg);
    }

    // 2. Delete pre-migration DB copies in SQLite directory
    const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
    try {
      const info = await FileSystem.getInfoAsync(sqliteDir);
      if (info && info.exists) {
        const files = await FileSystem.readDirectoryAsync(sqliteDir);
        for (const file of files) {
          // Explicitly protect active database file and journal/WAL/SHM files
          if (
            file === DATABASE_FILE_NAME ||
            file === `${DATABASE_FILE_NAME}-wal` ||
            file === `${DATABASE_FILE_NAME}-shm` ||
            file === `${DATABASE_FILE_NAME}-journal`
          ) {
            continue;
          }

          // Delete pre-migration database snapshots (.pre-v..., .bak, migration_, pre_migration_)
          if (
            file.includes(".pre-v") ||
            file.includes(".bak") ||
            file.includes("migration_") ||
            file.includes("pre_migration_")
          ) {
            const filePath = `${sqliteDir}/${file}`;
            await FileSystem.deleteAsync(filePath, { idempotent: true });
            deletedFiles.push(filePath);
          }
        }
      }
    } catch (e: any) {
      const msg = `Failed to clean pre-migration DB snapshots: ${e?.message ?? String(e)}`;
      console.warn(msg);
      errors.push(msg);
    }
  } catch (err: any) {
    const msg = `File cleanup encountered error: ${err?.message ?? String(err)}`;
    console.warn(msg);
    errors.push(msg);
  }

  return {
    success: errors.length === 0,
    deletedFiles,
    errors,
  };
}

/**
 * Remove everything, including the business profile and app settings.
 * Also cleans backup files and pre-migration snapshots from local storage.
 * The app will route back to onboarding afterwards.
 */
export async function resetDatabase(): Promise<FileCleanupResult> {
  const db = await getDatabase();
  await transaction(db, async (tx) => {
    for (const table of ALL_TABLES) {
      await tx.runAsync(`DELETE FROM ${table}`);
    }
    await tx.runAsync(
      `DELETE FROM sqlite_sequence WHERE name IN (${ALL_TABLES.map(
        () => "?",
      ).join(", ")})`,
      ...ALL_TABLES,
    );
  });

  // Best-effort file cleanup after DB transaction commits
  return await cleanHardResetFiles();
}
