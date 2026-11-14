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

import { getDatabase, transaction } from "../database";
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

/**
 * Helper to perform best-effort cleanup of plaintext backup JSON files
 * and pre-migration database snapshots on hard reset.
 */
async function cleanHardResetFiles(): Promise<void> {
  try {
    if (!FileSystem.documentDirectory) return;

    // 1. Delete backups directory
    const backupsDir = `${FileSystem.documentDirectory}DukkanPro/backups`;
    try {
      const info = await FileSystem.getInfoAsync(backupsDir);
      if (info && info.exists) {
        await FileSystem.deleteAsync(backupsDir, { idempotent: true });
      }
    } catch (e) {
      console.warn("Failed to delete backups directory on hard reset:", e);
    }

    // 2. Delete pre-migration DB copies in SQLite directory
    const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
    try {
      const info = await FileSystem.getInfoAsync(sqliteDir);
      if (info && info.exists) {
        const files = await FileSystem.readDirectoryAsync(sqliteDir);
        for (const file of files) {
          if (file.includes("bak") || file.includes("migration_")) {
            await FileSystem.deleteAsync(`${sqliteDir}/${file}`, { idempotent: true });
          }
        }
      }
    } catch (e) {
      console.warn("Failed to clean pre-migration DB snapshots on hard reset:", e);
    }
  } catch (err) {
    console.warn("Best-effort file cleanup on hard reset encountered error:", err);
  }
}

/**
 * Remove everything, including the business profile and app settings.
 * Also cleans backup files and pre-migration snapshots from local storage.
 * The app will route back to onboarding afterwards.
 */
export async function resetDatabase(): Promise<void> {
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
  await cleanHardResetFiles();
}
