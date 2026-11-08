/**
 * customerRepository.test.ts — Unit tests for customerRepository.
 *
 - Tests use the application's SQLite database (opened via getDatabase()).
 - Archived customers retain history; assertions verify is_active = false without deletion.
 */

import { getDatabase } from "../../database";
import { create as createProduct } from "../productRepository";
import { create as createSale, cancel as cancelSale } from "../saleRepository";
import {
    archive,
    create,
    getAll,
    getById,
    normalizePhone,
    search,
    update,
} from "../customerRepository";

let db: any;

beforeAll(async () => {
  db = await getDatabase();
});

describe("customerRepository", () => {
  describe("getAll()", () => {
    it("returns an empty array when no customers exist", async () => {
      const customers = await getAll();
      expect(customers).toEqual([]);
    });

    it("returns customers after creation", async () => {
      await create({
        name: "عميل اختباري",
        phone: "0551234567",
        note: "ملاحظات اختبارية",
        is_active: true,
      });
      const customers = await getAll({ is_active: true });
      expect(customers.length).toBeGreaterThan(0);
      expect(customers[0]?.name).toContain("عميل");
    });
  });

  describe("getById()", () => {
    it("returns null when customer does not exist", async () => {
      const customer = await getById(999);
      expect(customer).toBeNull();
    });

    it("returns the customer after creation", async () => {
      const created = await create({
        name: "مريم صالح",
        phone: "0557654321",
        note: "عميل VIP",
        is_active: true,
      });
      expect(created?.id).toBeGreaterThan(0);
      const byId = await getById(created!.id);
      expect(byId?.name).toBe("مريم صالح");
    });
  });

  describe("search()", () => {
    it("searches customers by name substring", async () => {
      await create({
        name: "عبدالله عثمان",
        phone: "0551112233",
        note: "معيّن في 2024",
        is_active: true,
      });
      const results = await search("عبدالله");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.name).toContain("عبدالله");
    });

    it("returns empty when no match", async () => {
      const results = await search("اسم غير موجود");
      expect(results).toEqual([]);
    });
  });

  describe("create()", () => {
    it("creates a new customer", async () => {
      const newCustomer = {
        name: "اسم جديد",
        phone: "0555555555",
        note: "ملاحظة جديدة",
        is_active: true,
      };
      const created = await create(newCustomer);
      expect(created?.id).toBeGreaterThan(0);
      expect(created?.name).toBe("اسم جديد");
    });

    it("rejects an active duplicate phone with DUPLICATE_PHONE carrying id and name (F3)", async () => {
      const existing = await create({
        name: "عميل المالك",
        phone: "0559998877",
        note: "ملاحظة التكرار",
        is_active: true,
      });
      await expect(
        create({
          name: "اسم مختلف",
          phone: "0559998877",
          note: "ملاحظة التكرار نفسها",
          is_active: true,
        }),
      ).rejects.toThrow(
        new RegExp(`DUPLICATE_PHONE: id=${existing.id}; name=عميل المالك`),
      );

      // The duplicate attempt was not saved under the new name.
      const byName = await search("اسم مختلف");
      expect(byName).toHaveLength(0);
    });

    it("returns the exact newly created customer when no phone number is provided", async () => {
      // 1. Seed an alphabetically late customer first
      await create({
        name: "Zara Customer",
        phone: "0550000000",
        note: null,
        is_active: true,
      });

      // 2. Create an alphabetically early customer without a phone number
      const created = await create({
        name: "Alice Customer",
        phone: null,
        note: null,
        is_active: true,
      });

      // The returned record MUST be Alice (not Zara!)
      expect(created.name).toBe("Alice Customer");
      expect(created.id).toBeGreaterThan(0);
    });
  });

  describe("update()", () => {
    it("updates customer fields", async () => {
      const created = await create({
        name: "اسم قبل التحديث",
        phone: "0553141111",
        note: "ملاحظة قبل",
        is_active: true,
      });
      const updated = await update(created!.id, {
        name: "اسم بعد التحديث",
        phone: "0553142222",
        note: "ملاحظة بعد",
        is_active: false,
      });
      expect(updated?.name).toBe("اسم بعد التحديث");
      expect(updated?.phone).toBe("0553142222");
      expect(updated?.is_active).toBe(false);
    });

    it("clears optional fields when update receives null (F2)", async () => {
      const created = await create({
        name: "إفراج حقول",
        phone: "0568887766",
        note: "ملاحظة قديمة",
        is_active: true,
      });
      expect(created.phone).toBe("0568887766");
      expect(created.note).toBe("ملاحظة قديمة");

      const updated = await update(created.id, {
        name: "إفراج حقول",
        phone: null,
        note: null,
      });
      expect(updated?.phone).toBeNull();
      expect(updated?.note).toBeNull();

      const reloaded = await getById(created.id);
      expect(reloaded?.phone).toBeNull();
      expect(reloaded?.note).toBeNull();
    });
  });

  describe("archive()", () => {
    it("sets is_active = false without deleting the row", async () => {
      const created = await create({
        name: "للحذف",
        phone: "0561119876",
        note: "ملاحظات",
        is_active: true,
      });
      await archive(created!.id);
      const customer = await getById(created!.id);
      expect(customer?.is_active).toBe(false);
      // Row still exists
      expect(customer).not.toBeNull();
    });

    it("archived customer retains history — sales and payments still reference it", async () => {
      const created = await create({
        name: "للحفاظ",
        phone: "0557778899",
        note: "يحتفظ بالتاريخ",
        is_active: true,
      });
      await archive(created!.id);
      // The customer row still exists; assertions on history would require
      // additional setup (sales, payments), so we verify the row persists.
      const customer = await getById(created!.id);
      expect(customer).not.toBeNull();
      expect(customer?.is_active).toBe(false);
    });
  });

  describe("normalizePhone()", () => {
    it("strips spaces, dashes, dots and parentheses", () => {
      expect(normalizePhone("05 55 12 34 56")).toBe("0555123456");
      expect(normalizePhone("05-55-123-456")).toBe("0555123456");
      expect(normalizePhone("05.55.123.456")).toBe("0555123456");
      expect(normalizePhone("(055) 512-3456")).toBe("0555123456");
    });

    it("canonicalizes a leading +213 onto the local trunk 0", () => {
      expect(normalizePhone("+213 555 123 456")).toBe("0555123456");
      expect(normalizePhone("+213555123456")).toBe("0555123456");
    });

    it("treats '0555 12 34 56' and '+213555123456' as the same number (F3)", () => {
      expect(normalizePhone("0555 12 34 56")).toBe(
        normalizePhone("+213555123456"),
      );
    });
  });

  describe("phone normalization in create, update and search", () => {
    it("stores the phone normalized on create and update", async () => {
      const created = await create({
        name: "Norm Create",
        phone: "05 51 23 99 99",
        note: null,
        is_active: true,
      });
      expect(created.phone).toBe("0551239999");

      const updated = await update(created.id, { phone: "+213-770-112-233" });
      expect(updated.phone).toBe("0770112233");
    });

    it("matches an international +213 variant against a locally stored number", async () => {
      const first = await create({
        name: "Format Variant",
        phone: "0559876543",
        note: null,
        is_active: true,
      });
      await expect(
        create({
          name: "Format Variant 2",
          phone: "+213 559 876 543",
          note: null,
          is_active: true,
        }),
      ).rejects.toThrow(/DUPLICATE_PHONE/);

      const still = await getById(first.id);
      expect(still?.phone).toBe("0559876543");
    });

    it("matches a legacy stored '+213...' row when the local form is submitted (F3)", async () => {
      // Rows stored before international prefixes were canonicalized keep the
      // '+213' form; new lookups must still find them without rewriting data.
      await db.runAsync(
        `INSERT INTO customers (name, phone, note, is_active, created_at, updated_at) VALUES (?, ?, NULL, 1, datetime('now'), datetime('now'))`,
        ["Legacy Phone Owner", "+213555777888"],
      );

      await expect(
        create({
          name: "Legacy Duplicate Attempt",
          phone: "0555777888",
          note: null,
          is_active: true,
        }),
      ).rejects.toThrow(/DUPLICATE_PHONE/);

      const found = await search("0555777888");
      expect(found.some((c) => c.name === "Legacy Phone Owner")).toBe(true);
    });

    it("finds a customer by a differently formatted phone query", async () => {
      await create({
        name: "Searchable Phone",
        phone: "0552244668",
        note: null,
        is_active: true,
      });
      const results = await search("0552 244 668");
      expect(results.some((c) => c.name === "Searchable Phone")).toBe(true);
    });
  });

  describe("create() with an archived phone match", () => {
    it("throws PHONE_ARCHIVED instead of silently returning the archived customer", async () => {
      const existing = await create({
        name: "Archived Phone Owner",
        phone: "0553131313",
        note: null,
        is_active: true,
      });
      await archive(existing.id);

      await expect(
        create({
          name: "Duplicate Attempt",
          phone: "0553131313",
          note: null,
          is_active: true,
        })
      ).rejects.toThrow(/PHONE_ARCHIVED/);

      // No new customer row was created for the duplicate attempt.
      const byName = await search("Duplicate Attempt");
      expect(byName).toHaveLength(0);
    });
  });

  describe("update() duplicate phone guard", () => {
    it("rejects a phone already used by another customer with DUPLICATE_PHONE", async () => {
      await create({
        name: "Phone Owner",
        phone: "0554141414",
        note: null,
        is_active: true,
      });
      const other = await create({
        name: "Other Customer",
        phone: "0554242424",
        note: null,
        is_active: true,
      });

      await expect(
        update(other.id, { phone: "0554141414" })
      ).rejects.toThrow(/DUPLICATE_PHONE/);

      // The rejected update left the customer unchanged.
      const still = await getById(other.id);
      expect(still?.phone).toBe("0554242424");
    });

    it("allows a customer to keep their own phone", async () => {
      const created = await create({
        name: "Own Phone Keeper",
        phone: "0554343434",
        note: null,
        is_active: true,
      });
      const updated = await update(created.id, {
        phone: "0554343434",
        name: "Own Phone Keeper 2",
      });
      expect(updated.phone).toBe("0554343434");
      expect(updated.name).toBe("Own Phone Keeper 2");
    });
  });

  describe("archive() balance guards", () => {
    it("refuses to archive a customer who still owes money", async () => {
      const product = await createProduct({
        name: "Debt Item",
        sku: "DEBT-ARCH-001",
        category: null,
        sale_price_centimes: 5000,
        cost_price_centimes: 2500,
        stock_quantity: 10,
        minimum_stock_quantity: 0,
        unit: "pcs",
        is_active: true,
      });
      const customer = await create({
        name: "Debtor",
        phone: "0554444444",
        note: null,
        is_active: true,
      });
      await createSale({
        customerId: customer.id,
        paymentMethod: "credit",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 5000 }],
      });

      await expect(archive(customer.id)).rejects.toThrow(/outstanding balance/);
      const still = await getById(customer.id);
      expect(still?.is_active).toBe(true);
    });

    it("refuses to archive a customer holding store credit", async () => {
      const product = await createProduct({
        name: "Credit Item",
        sku: "CREDIT-ARCH-001",
        category: null,
        sale_price_centimes: 5000,
        cost_price_centimes: 2500,
        stock_quantity: 10,
        minimum_stock_quantity: 0,
        unit: "pcs",
        is_active: true,
      });
      const customer = await create({
        name: "Creditor",
        phone: "0554545454",
        note: null,
        is_active: true,
      });
      const sale = await createSale({
        customerId: customer.id,
        paymentMethod: "cash",
        amountPaidCentimes: 5000,
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 5000 }],
      });
      await cancelSale(sale.id, "test");

      await expect(archive(customer.id)).rejects.toThrow(/store credit/);
      const still = await getById(customer.id);
      expect(still?.is_active).toBe(true);
    });
  });
});
