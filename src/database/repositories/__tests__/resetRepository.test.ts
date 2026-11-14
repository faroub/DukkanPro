/**
 * resetRepository — the destructive data-clearing paths.
 *
 * Soft reset must delete catalogue/transaction rows while keeping the business
 * profile and app settings; hard reset wipes everything. Both must be safe to
 * call on an already-empty database.
 */
import { getDatabase } from "@/database/database";
import { get as getProfile } from "../businessProfileRepository";
import { clearBusinessData, resetDatabase } from "../resetRepository";
import * as FileSystem from "expo-file-system/legacy";

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "/mock/documents/",
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true })),
  readDirectoryAsync: jest.fn(() =>
    Promise.resolve([
      "DukkanPro.db",
      "DukkanPro.db-wal",
      "DukkanPro.db.pre-v13-2026-10-25T14-00-00-000Z",
      "unrelated_user_doc.pdf",
    ])
  ),
  deleteAsync: jest.fn(() => Promise.resolve()),
}));

let db: any;

beforeAll(async () => {
  db = await getDatabase();
});

async function seedRows(): Promise<void> {
  await db.runAsync(
    `INSERT INTO business_profiles (business_name, owner_name, business_type, currency, selected_locale)
     VALUES ('Test Shop', 'Owner', 'grocery', 'DZD', 'fr')`,
  );
  await db.runAsync(
    `INSERT INTO products (name, sku, sale_price_centimes, cost_price_centimes, stock_quantity)
     VALUES ('Flour', 'SKU-1', 1000, 800, 5)`,
  );
  await db.runAsync(
    `INSERT INTO customers (name, phone) VALUES ('Ali', '0550')`,
  );
  await db.runAsync(
    `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes, total_centimes,
                        amount_paid_centimes, remaining_balance_centimes, payment_method, sold_at)
     VALUES (1, 'completed', 1000, 0, 1000, 1000, 0, 'cash', datetime('now'))`,
  );
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES ('selected_locale', 'fr')`,
  );
}

async function tableCount(table: string): Promise<number> {
  const rows = await db.getAllAsync(`SELECT COUNT(*) AS c FROM ${table}`);
  return rows[0]?.c ?? 0;
}

describe("resetRepository", () => {
  afterEach(async () => {
    // Return to a clean slate between tests.
    (FileSystem.deleteAsync as jest.Mock).mockClear();
    await resetDatabase();
  });

  it("clears transaction data but keeps the profile and settings", async () => {
    await seedRows();

    await clearBusinessData();

    expect(await tableCount("products")).toBe(0);
    expect(await tableCount("customers")).toBe(0);
    expect(await tableCount("sales")).toBe(0);
    expect(await getProfile()).not.toBeNull();
    expect(await tableCount("app_settings")).toBe(1);
  });

  it("wipes everything on a full reset", async () => {
    await seedRows();

    await resetDatabase();

    expect(await tableCount("products")).toBe(0);
    expect(await tableCount("sales")).toBe(0);
    expect(await getProfile()).toBeNull();
    expect(await tableCount("app_settings")).toBe(0);
  });

  it("is safe to run on an already-empty database", async () => {
    await expect(clearBusinessData()).resolves.not.toThrow();
    await expect(resetDatabase()).resolves.not.toThrow();
  });

  it("clears sqlite_sequence entries so autoincrement IDs restart from 1 on hard reset", async () => {
    await seedRows();
    await resetDatabase();

    const seqRows = await db.getAllAsync(
      `SELECT name FROM sqlite_sequence WHERE name IN ('business_profiles', 'app_settings')`
    );
    expect(seqRows).toEqual([]);
  });

  it("deletes pre-v... snapshots and backup folder on hard reset while preserving active DB and unrelated files", async () => {
    await seedRows();
    await resetDatabase();

    // 1. Backups directory deleted
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      expect.stringContaining("DukkanPro/backups"),
      expect.objectContaining({ idempotent: true }),
    );

    // 2. Pre-v13 snapshot file deleted
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      expect.stringContaining("DukkanPro.db.pre-v13-2026-10-25T14-00-00-000Z"),
      expect.objectContaining({ idempotent: true }),
    );

    // 3. Active database DukkanPro.db and DukkanPro.db-wal NEVER deleted
    expect(FileSystem.deleteAsync).not.toHaveBeenCalledWith(
      expect.stringMatching(/DukkanPro\.db$/),
      expect.anything(),
    );
    expect(FileSystem.deleteAsync).not.toHaveBeenCalledWith(
      expect.stringMatching(/DukkanPro\.db-wal$/),
      expect.anything(),
    );

    // 4. Unrelated user document NEVER deleted
    expect(FileSystem.deleteAsync).not.toHaveBeenCalledWith(
      expect.stringContaining("unrelated_user_doc.pdf"),
      expect.anything(),
    );
  });

  it("handles file cleanup failure gracefully with a warning without reverting database wipe", async () => {
    await seedRows();

    (FileSystem.deleteAsync as jest.Mock).mockRejectedValueOnce(
      new Error("Disk permission denied"),
    );

    await expect(resetDatabase()).resolves.not.toThrow();
    expect(await tableCount("products")).toBe(0);
  });
});
