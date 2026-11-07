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
import { recordPayment, getCustomerDebt } from "@/services/customers/customerBalanceService";
import { resetDatabase } from "@/database/repositories/resetRepository";
import { migrationVersions } from "@/database/migrations";
import { buildBackup, createBackup, restoreBackup } from "../backupService";
import type { BackupData, BackupTable } from "../backupFormat";

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "/mock/documents/",
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
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

    it("createBackup writes a dated JSON file under the backups directory", async () => {
      await seed("A2");

      const { uri } = await createBackup();

      expect(uri).toMatch(/^\/mock\/documents\/DukkanPro\/backups\/dukkanpro-backup-\d{4}-\d{2}-\d{2}\.json$/);
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        "/mock/documents/DukkanPro/backups",
        { intermediates: true },
      );
      const [, contents] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0];
      expect(() => JSON.parse(contents)).not.toThrow();
      expect(JSON.parse(contents).format).toBe("dukkanpro-backup");
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
  });
});
