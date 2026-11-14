/**
 * backupService — round-trip and guard regression tests.
 *
 * Acceptance criteria (docs/BACKUP_RESTORE.md §8):
 * 1. export covers every table with the expected envelope;
 * 2. export → hard reset → import reproduces row counts, stock totals,
 *    debt totals and currency exactly;
 * 3. restore refuses to overwrite a non-empty database without explicit
 *    confirmation and leaves existing data untouched;
 * 4. structural guards reject bad files before any write;
 * 5. restore with confirmation replaces the data;
 * 6. createBackup writes a dated JSON file to the documents directory.
 */
import * as FileSystem from "expo-file-system/legacy";

import { getDatabase } from "@/database/database";
import { create as createProduct, adjustStock } from "@/database/repositories/productRepository";
import { create as createCustomer } from "@/database/repositories/customerRepository";
import { create as createSale } from "@/database/repositories/saleRepository";
import { getActiveStoreCurrency } from "@/utils/money";
import { recordPayment, getCustomerDebt } from "@/services/customers/customerBalanceService";
import { resetDatabase } from "@/database/repositories/resetRepository";
import { migrationVersions } from "@/database/migrations";
import { buildBackup, createBackup, restoreBackup } from "../backupService";
import { validateBackup, type BackupData, type BackupTable } from "../backupFormat";

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "/mock/documents/",
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  EncodingType: { UTF8: "utf8" },
}));

const CURRENT_VERSION = migrationVersions[migrationVersions.length - 1];

async function seed(tag: string) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO business_profiles (business_name, owner_name, business_type, currency, selected_locale)
     VALUES ('Backup Shop ${tag}', 'Owner', 'grocery', 'DZD', 'fr')`,
  );
  await db.runAsync(`INSERT INTO app_settings (key, value) VALUES ('selected_locale', 'fr')`);

  const product = await createProduct({
    name: `Item ${tag}`,
    sku: `BKP-${tag}`,
    sale_price_centimes: 10000,
    cost_price_centimes: 5000,
    stock_quantity: 20,
    minimum_stock_quantity: 2,
    unit: "pcs",
    is_active: true,
  } as any);
  const customer = await createCustomer({
    name: `Client ${tag}`,
    phone: `0558${tag}`,
  } as any);

  // Partial sale: 3 × 100.00 = 30000, pays 10000, repays 5000 → debt 15000.
  const sale = await createSale({
    customerId: customer.id,
    paymentMethod: "partial",
    items: [{ productId: product.id, quantity: 3, unitSalePriceCentimes: 10000 }],
    amountPaidCentimes: 10000,
  });
  await recordPayment(customer.id, 5000, "cash", "partial repayment");
  await adjustStock(product.id, 5, "restock for test");

  return { product, customer, sale };
}

async function tableCount(table: string): Promise<number> {
  const db = await getDatabase();
  const rows: { c?: number }[] = await db.getAllAsync(`SELECT COUNT(*) AS c FROM ${table}`);
  return rows[0]?.c ?? 0;
}

async function allTableCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const table of [
    "business_profiles",
    "app_settings",
    "customers",
    "products",
    "sales",
    "sale_items",
    "customer_payments",
    "inventory_movements",
  ]) {
    counts[table] = await tableCount(table);
  }
  return counts;
}

async function ledgerSum(productId: number): Promise<number | null> {
  const db = await getDatabase();
  const rows: any[] = await db.getAllAsync(
    `SELECT SUM(quantity_change) AS s FROM inventory_movements WHERE product_id = ?`,
    [productId],
  );
  return rows[0]?.s ?? null;
}

describe("backupService", () => {
  beforeEach(async () => {
    (FileSystem.makeDirectoryAsync as jest.Mock).mockClear();
    (FileSystem.writeAsStringAsync as jest.Mock).mockClear();
    await resetDatabase();
  });

  describe("export", () => {
    it("builds a backup with the expected envelope and every table", async () => {
      const seeded = await seed("A1");

      const backup = await buildBackup();

      expect(backup.format).toBe("dukkanpro-backup");
      expect(backup.backupVersion).toBe(1);
      expect(backup.databaseVersion).toBe(CURRENT_VERSION);
      expect(backup.store).toEqual({ businessName: "Backup Shop A1", currency: "DZD" });

      for (const table of Object.keys(backup.tables) as BackupTable[]) {
        expect(Array.isArray(backup.tables[table])).toBe(true);
      }
      expect(backup.tables.business_profiles).toHaveLength(1);
      expect(backup.tables.products).toHaveLength(1);
      expect(backup.tables.customers).toHaveLength(1);
      expect(backup.tables.sales).toHaveLength(1);
      expect(backup.tables.sale_items).toHaveLength(1);
      expect(backup.tables.customer_payments).toHaveLength(1);
      // Opening stock + sale + restock adjustment.
      expect(backup.tables.inventory_movements).toHaveLength(3);

      // Currency is part of the export, not inferred.
      expect(backup.tables.sales[0].currency).toBe("DZD");
      expect(backup.tables.customer_payments[0].currency).toBe("DZD");
      // Exact ids survive the round trip via the whitelist keys.
      expect(backup.tables.sales[0].id).toBe(seeded.sale.id);
    });

    it("createBackup writes a timestamped JSON file under the backups directory", async () => {
      await seed("A2");

      const { uri } = await createBackup();

      expect(uri).toMatch(/^\/mock\/documents\/DukkanPro\/backups\/dukkanpro-backup-.*\.json$/);
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        "/mock/documents/DukkanPro/backups",
        { intermediates: true },
      );
      const [, contents] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0];
      expect(() => JSON.parse(contents)).not.toThrow();
      expect(JSON.parse(contents).format).toBe("dukkanpro-backup");
    });

    it("two backups created on the same day produce two different files", async () => {
      await seed("A2a");

      const b1 = await createBackup();
      await new Promise((r) => setTimeout(r, 10));
      const b2 = await createBackup();

      expect(b1.uri).not.toEqual(b2.uri);
    });

    it("throws BACKUP_IO_ERROR if a backup file already exists", async () => {
      await seed("A2b");

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });

      await expect(createBackup()).rejects.toThrow("BACKUP_IO_ERROR");
    });
  });

  describe("restore round-trip", () => {
    it("reproduces row counts, stock totals, debt and currency after reset", async () => {
      const seeded = await seed("A3");
      const before = await allTableCounts();
      const debtBefore = await getCustomerDebt(seeded.customer.id);
      expect(debtBefore).toBe(15000);

      const backup = await buildBackup();
      await resetDatabase();
      expect(await tableCount("products")).toBe(0);

      const summary = await restoreBackup(JSON.stringify(backup));

      for (const [table, count] of Object.entries(before)) {
        expect(summary.tableCounts[table as BackupTable]).toBe(count);
        expect(await tableCount(table)).toBe(count);
      }
      expect(summary.rowsImported).toBe(
        Object.values(before).reduce((a, b) => a + b, 0),
      );

      // Exact ids preserved.
      const db = await getDatabase();
      const productRows: any[] = await db.getAllAsync(`SELECT id, name, stock_quantity FROM products`);
      expect(productRows[0].id).toBe(seeded.product.id);
      expect(productRows[0].name).toBe("Item A3");
      expect(productRows[0].stock_quantity).toBe(22); // 20 - 3 + 5

      // The stock ledger still reconciles with the restored stock.
      expect(await ledgerSum(seeded.product.id)).toBe(22);

      // Debt totals survive untouched.
      expect(await getCustomerDebt(seeded.customer.id)).toBe(debtBefore);

      // Currency rows restored verbatim.
      const saleRows: any[] = await db.getAllAsync(`SELECT currency FROM sales`);
      expect(saleRows[0].currency).toBe("DZD");
    });

    it("replaces existing data when confirmOverwrite is set", async () => {
      const seededA = await seed("A4");
      const backupA = await buildBackup();
      await resetDatabase();

      // Seed a different shop state on the same device.
      await seed("B4");
      expect(await tableCount("products")).toBe(1);

      await restoreBackup(JSON.stringify(backupA), { confirmOverwrite: true });

      const db = await getDatabase();
      const productRows: any[] = await db.getAllAsync(`SELECT name FROM products`);
      expect(productRows).toHaveLength(1);
      expect(productRows[0].name).toBe("Item A4");
      const customerRows: any[] = await db.getAllAsync(`SELECT phone FROM customers`);
      expect(customerRows).toHaveLength(1);
      expect(customerRows[0].phone).toBe("0558A4");
      expect(await ledgerSum(seededA.product.id)).toBe(22);
    });

    it("updates getActiveStoreCurrency() after restoring an EUR backup", async () => {
      const db = await getDatabase();
      // Create a shop in EUR.
      await resetDatabase();
      await db.runAsync(
        `INSERT INTO business_profiles (business_name, owner_name, business_type, currency, selected_locale)
         VALUES ('EUR Shop', 'Owner', 'grocery', 'EUR', 'fr')`,
      );
      // At this point, getActiveStoreCurrency is still "DZD" because INSERT does not call setActiveStoreCurrency.
      // Build a backup with EUR currency.
      const backup = await buildBackup();
      await resetDatabase();
      // Seed a minimal DZD profile afterwards.
      await db.runAsync(
        `INSERT INTO business_profiles (business_name, owner_name, business_type, currency, selected_locale)
         VALUES ('DZD Shop', 'Owner', 'grocery', 'DZD', 'fr')`,
      );
      expect(getActiveStoreCurrency()).toBe("DZD");
      // Restore the EUR backup.
      await restoreBackup(JSON.stringify(backup), { confirmOverwrite: true });
      // After restore, setActiveStoreCurrency should be called with the backup's currency.
      expect(getActiveStoreCurrency()).toBe("EUR");
    });
  });

  describe("restore guards", () => {
    it("refuses to overwrite a non-empty database without confirmation", async () => {
      await seed("A5");
      const backup = await buildBackup();
      const before = await allTableCounts();

      await expect(restoreBackup(JSON.stringify(backup))).rejects.toThrow("OVERWRITE_REQUIRED");

      // Nothing was deleted.
      expect(await allTableCounts()).toEqual(before);
    });

    it("rejects a file with an unknown column before touching the database", async () => {
      await seed("A6");
      const backup = await buildBackup();
      await resetDatabase();

      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      tampered.tables.products[0].evil_column = 1 as never;

      await expect(restoreBackup(JSON.stringify(tampered))).rejects.toThrow(
        'INVALID_BACKUP_CONTENT: products: unknown column "evil_column"',
      );
      expect(await tableCount("products")).toBe(0);
    });

    it("rejects non-integer money values before touching the database", async () => {
      await seed("A7");
      const backup = await buildBackup();
      await resetDatabase();

      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      (tampered.tables.sales[0] as any).total_centimes = 150.5;

      await expect(restoreBackup(JSON.stringify(tampered))).rejects.toThrow(
        'INVALID_BACKUP_CONTENT: sales: column "total_centimes" must be an integer',
      );
      expect(await tableCount("sales")).toBe(0);
    });

    it("rejects a backup whose foreign keys do not resolve inside the backup", async () => {
      await seed("A8");
      const backup = await buildBackup();
      await resetDatabase();

      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      tampered.tables.products = []; // sale_items still reference the product.

      await expect(restoreBackup(JSON.stringify(tampered))).rejects.toThrow("BROKEN_REFERENCES");
      expect(await tableCount("sale_items")).toBe(0);
    });

    it("rejects a backup made by a newer app", async () => {
      await seed("A9");
      const backup = await buildBackup();
      await resetDatabase();

      const newer = JSON.parse(JSON.stringify(backup)) as BackupData;
      newer.databaseVersion = CURRENT_VERSION + 1;

      await expect(restoreBackup(JSON.stringify(newer))).rejects.toThrow("BACKUP_NEWER_VERSION");
    });

    it("rejects structurally invalid files", async () => {
      await seed("A10");
      const backup = await buildBackup();
      await resetDatabase();

      await expect(restoreBackup("not json {")).rejects.toThrow("INVALID_BACKUP_FILE");
      await expect(restoreBackup("{}")).rejects.toThrow("INVALID_BACKUP_FILE");
      await expect(restoreBackup("[]")).rejects.toThrow("INVALID_BACKUP_FILE");

      const wrongFormat = JSON.parse(JSON.stringify(backup)) as BackupData;
      (wrongFormat as any).format = "something-else";
      await expect(restoreBackup(JSON.stringify(wrongFormat))).rejects.toThrow("INVALID_BACKUP_FILE");

      const badBackupVersion = JSON.parse(JSON.stringify(backup)) as BackupData;
      badBackupVersion.backupVersion = 2;
      await expect(restoreBackup(JSON.stringify(badBackupVersion))).rejects.toThrow(
        "UNSUPPORTED_BACKUP_VERSION",
      );

      const missingTables = JSON.parse(JSON.stringify(backup)) as BackupData;
      (missingTables as any).tables = {};
      await expect(restoreBackup(JSON.stringify(missingTables))).rejects.toThrow(
        "INVALID_BACKUP_FILE",
      );
    });

    it("validates 20,000 sale_items in under 2 seconds (O(N) validation)", async () => {
      await seed("Perf1");
      const backup = await buildBackup();
      const largeBackup = JSON.parse(JSON.stringify(backup)) as BackupData;

      // Build 20,000 sale items matching the sale
      const saleId = largeBackup.tables.sales[0].id as number;
      const productId = largeBackup.tables.products[0].id as number;
      const items: any[] = [];
      let totalSum = 0;

      for (let i = 1; i <= 20000; i++) {
        items.push({
          id: i,
          sale_id: saleId,
          product_id: productId,
          product_name_snapshot: `Item ${i}`,
          quantity: 1,
          unit_sale_price_centimes: 100,
          unit_cost_price_centimes: 50,
          line_total_centimes: 100,
          created_at: "2026-01-01 00:00:00",
        });
        totalSum += 100;
      }

      largeBackup.tables.sale_items = items;
      largeBackup.tables.sales[0].subtotal_centimes = totalSum;
      largeBackup.tables.sales[0].total_centimes = totalSum;
      largeBackup.tables.sales[0].amount_paid_centimes = 0;
      largeBackup.tables.sales[0].remaining_balance_centimes = totalSum;

      const startTime = Date.now();
      const validated = validateBackup(largeBackup, CURRENT_VERSION);
      const duration = Date.now() - startTime;

      expect(validated).toBeTruthy();
      expect(duration).toBeLessThan(2000);
    });

    it("leaves active store currency unchanged when a restore fails", async () => {
      await seed("CurrencyFail");
      const initialCurrency = getActiveStoreCurrency();

      // Create a corrupted backup that pretends to be EUR
      const backup = await buildBackup();
      const corrupted = JSON.parse(JSON.stringify(backup)) as BackupData;
      corrupted.tables.business_profiles[0].currency = "EUR";
      corrupted.tables.sales[0].amount_paid_centimes = -9999 as never; // Invalid!

      await expect(
        restoreBackup(JSON.stringify(corrupted), { confirmOverwrite: true }),
      ).rejects.toThrow();

      // Currency must still be initialCurrency (e.g. DZD), NOT EUR
      expect(getActiveStoreCurrency()).toBe(initialCurrency);
    });
  });

  describe("restore legacy ledger reconciliation", () => {
    it("accepts a legacy backup whose opening stock predates the ledger (reconciliation movement)", async () => {
      // Legacy fixture: the product was created with stock 10 before the
      // inventory_movements table existed, so it has no opening movement.
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO products (name, sku, sale_price_centimes, cost_price_centimes, stock_quantity, minimum_stock_quantity, unit, is_active)
         VALUES ('Legacy Item', 'LEG-1', 10000, 5000, 10, 2, 'pcs', 1)`,
      );
      const product: any = await db.getFirstAsync(
        `SELECT id FROM products WHERE sku = 'LEG-1'`,
      );
      await db.runAsync(
        `INSERT INTO customers (name, phone) VALUES ('Legacy Client', '0770000099')`,
      );
      const customer: any = await db.getFirstAsync(
        `SELECT id FROM customers WHERE phone = '0770000099'`,
      );

      // A later sale of 3: decrements stock to 7 and records the only
      // movement this legacy product has (-3).
      await createSale({
        customerId: customer.id,
        paymentMethod: "cash",
        items: [{ productId: product.id, quantity: 3, unitSalePriceCentimes: 10000 }],
        amountPaidCentimes: 30000,
      });
      expect(await ledgerSum(product.id)).toBe(-3);
      const stockRow: any = await db.getFirstAsync(
        `SELECT stock_quantity FROM products WHERE id = ?`,
        [product.id],
      );
      expect(stockRow.stock_quantity).toBe(7);

      const backup = await buildBackup();
      await resetDatabase();

      // Policy (b): the legacy backup is accepted. The missing opening
      // movement is repaired with a one-time reconciliation movement equal to
      // stock minus the movement sum (7 - (-3) = +10), the restore stays
      // atomic, and the summary reports the reconciliation.
      const summary = await restoreBackup(JSON.stringify(backup));
      expect(summary.rowsImported).toBeGreaterThan(0);
      expect(summary.reconciliations).toHaveLength(1);
      expect(summary.reconciliations![0]).toMatchObject({
        name: "Legacy Item",
        delta: 10,
      });

      // After the repair the ledger reconciles with the restored stock.
      expect(await ledgerSum(product.id)).toBe(7);
      const stockAfter: any = await db.getFirstAsync(
        `SELECT stock_quantity FROM products WHERE id = ?`,
        [product.id],
      );
      expect(stockAfter.stock_quantity).toBe(7);

      // The reconciliation movement itself is identifiable and signed 'in'.
      const movements: any[] = await db.getAllAsync(
        `SELECT movement_type, quantity_change, note FROM inventory_movements
         WHERE product_id = ? AND note = 'Opening stock reconciliation'`,
        [product.id],
      );
      expect(movements).toHaveLength(1);
      expect(movements[0].movement_type).toBe("in");
      expect(movements[0].quantity_change).toBe(10);
    });

    it("leaves an already-consistent ledger untouched (no reconciliation)", async () => {
      // A product created through the repository always gets an opening
      // movement, so a normal backup needs no repair on restore.
      const db = await getDatabase();
      await createProduct({
        name: "Modern Item",
        sku: "MOD-1",
        sale_price_centimes: 10000,
        cost_price_centimes: 5000,
        stock_quantity: 10,
        minimum_stock_quantity: 2,
        unit: "pcs",
        is_active: true,
      } as any);
      const product: any = await db.getFirstAsync(`SELECT id FROM products WHERE sku = 'MOD-1'`);

      const backup = await buildBackup();
      await resetDatabase();

      const summary = await restoreBackup(JSON.stringify(backup));
      expect(summary.reconciliations ?? []).toHaveLength(0);
      expect(await ledgerSum(product.id)).toBe(10);
    });
  });

  describe("invariant validation rules", () => {
    it("accepts a valid backup", async () => {
      await seed("InvA");
      const backup = await buildBackup();
      const summary = await restoreBackup(JSON.stringify(backup), { confirmOverwrite: true });
      expect(summary.rowsImported).toBeGreaterThan(0);
      expect(summary.tableCounts).toEqual(
        expect.objectContaining({ business_profiles: 1, sales: 1, sale_items: 1 })
      );
    });

    it("rejects a sale item with line_total ≠ unit_sale_price_centimes * quantity", async () => {
      await seed("InvB");
      const backup = await buildBackup();
      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      tampered.tables.sale_items[0].line_total_centimes = 9999 as never;
      await expect(restoreBackup(JSON.stringify(tampered), { confirmOverwrite: true })).rejects.toThrow(
        /INVALID_BACKUP_CONTENT: sale_items: line_total_centimes must equal unit_sale_price_centimes \* quantity/
      );
    });

    it("rejects a sale where total_centimes ≠ subtotal_centimes - discount_centimes", async () => {
      await seed("InvC");
      const backup = await buildBackup();
      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      tampered.tables.sales[0].total_centimes = 9999 as never;
      await expect(restoreBackup(JSON.stringify(tampered), { confirmOverwrite: true })).rejects.toThrow(
        /INVALID_BACKUP_CONTENT: sales: total_centimes must equal subtotal_centimes - discount_centimes/
      );
    });

    it("rejects a sale where amount_paid_centimes is negative", async () => {
      await seed("InvD");
      const backup = await buildBackup();
      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      tampered.tables.sales[0].amount_paid_centimes = -1000 as never;
      await expect(restoreBackup(JSON.stringify(tampered), { confirmOverwrite: true })).rejects.toThrow(
        /INVALID_BACKUP_CONTENT: sales: amount_paid_centimes must be non-negative/
      );
    });

    it("rejects a sale where amount_paid_centimes exceeds total_centimes", async () => {
      await seed("InvE");
      const backup = await buildBackup();
      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      tampered.tables.sales[0].amount_paid_centimes = 9999999 as never;
      await expect(restoreBackup(JSON.stringify(tampered), { confirmOverwrite: true })).rejects.toThrow(
        /INVALID_BACKUP_CONTENT: sales: amount_paid_centimes must be between 0 and total_centimes/
      );
    });

    it("rejects a sale where remaining_balance_centimes ≠ total_centimes - amount_paid_centimes", async () => {
      await seed("InvF");
      const backup = await buildBackup();
      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      tampered.tables.sales[0].remaining_balance_centimes = 9999 as never;
      await expect(restoreBackup(JSON.stringify(tampered), { confirmOverwrite: true })).rejects.toThrow(
        /INVALID_BACKUP_CONTENT: sales: remaining_balance_centimes must equal total_centimes - amount_paid_centimes/
      );
    });

    it("rejects a sale whose subtotal does not match the sum of its sale_items line totals", async () => {
      await seed("InvG");
      const backup = await buildBackup();
      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      // Tamper subtotal and other fields so that only the subtotal vs sum-of-items invariant fails.
      const saleIdx = 0;
      const newSubtotal = 9999 as number;
      // Ensure all other invariants pass: total = subtotal - discount, amountPaid = 0 so it's within total, remaining = total - amountPaid.
      const newTotal = newSubtotal - 0; // discount remains 0
      tampered.tables.sales[saleIdx].subtotal_centimes = newSubtotal;
      tampered.tables.sales[saleIdx].total_centimes = newTotal;
      tampered.tables.sales[saleIdx].amount_paid_centimes = 0 as never; // < total
      tampered.tables.sales[saleIdx].remaining_balance_centimes = newTotal - 0 as never;
      await expect(restoreBackup(JSON.stringify(tampered), { confirmOverwrite: true })).rejects.toThrow(
        /INVALID_BACKUP_CONTENT: sales: subtotal_centimes must equal sum of sale_items line_total_centimes/
      );
    });

    it("rejects a sale with negative discount_centimes", async () => {
      await seed("InvH");
      const backup = await buildBackup();
      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      tampered.tables.sales[0].discount_centimes = -100 as never;
      await expect(restoreBackup(JSON.stringify(tampered), { confirmOverwrite: true })).rejects.toThrow(
        /INVALID_BACKUP_CONTENT: sales: discount_centimes must be non-negative/
      );
    });

    it("rejects a sale with negative total_centimes", async () => {
      await seed("InvI");
      const backup = await buildBackup();
      const tampered = JSON.parse(JSON.stringify(backup)) as BackupData;
      tampered.tables.sales[0].total_centimes = -500 as never;
      await expect(restoreBackup(JSON.stringify(tampered), { confirmOverwrite: true })).rejects.toThrow(
        /INVALID_BACKUP_CONTENT: sales: total_centimes must be non-negative/
      );
    });
  });
});
