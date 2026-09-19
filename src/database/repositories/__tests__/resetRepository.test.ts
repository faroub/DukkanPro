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
});
