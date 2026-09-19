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

const TRANSACTION_TABLES = [
  "sale_items",
  "customer_payments",
  "inventory_movements",
  "sales",
  "products",
  "customers",
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
 * Remove everything, including the business profile and app settings.
 * The app will route back to onboarding afterwards.
 */
export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await transaction(db, async (tx) => {
    for (const table of [...TRANSACTION_TABLES, "business_profiles", "app_settings"]) {
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
