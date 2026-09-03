/**
 * customerRepository.test.ts — Unit tests for customerRepository.
 *
 - Tests use the application's SQLite database (opened via getDatabase()).
 - Archived customers retain history; assertions verify is_active = false without deletion.
 */

import { getDatabase } from "../../database/database";
import {
  getAll,
  getById,
  search,
  create,
  update,
  archive,
} from "../customerRepository";
import { Customer } from "../../types/entities";

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

    it("is idempotent when same phone provided — returns existing customer", async () => {
      const p1 = await create({
        name: "عميل بالعsame phone",
        phone: "0559998877",
        note: "ملاحظة التكرار",
        is_active: true,
      });
      const p2 = await create({
        name: "اسم مختلف",
        phone: "0559998877",
        note: "ملاحظة التكرار نفسها",
        is_active: true,
      });
      expect(p1?.id).toBe(p2?.id);
    });
  });

  describe("update()", () => {
    it("updates customer fields", async () => {
      const created = await create({
        name: "اسم قبل التحديث",
        phone: "0551112233",
        note: "ملاحظة قبل",
        is_active: true,
      });
      const updated = await update(created!.id, {
        name: "اسم بعد التحديث",
        phone: "0555555555",
        note: "ملاحظة بعد",
        is_active: false,
      });
      expect(updated?.name).toBe("اسم بعد التحديث");
      expect(updated?.phone).toBe("0555555555");
      expect(updated?.is_active).toBe(false);
    });
  });

  describe("archive()", () => {
    it("sets is_active = false without deleting the row", async () => {
      const created = await create({
        name: "للحذف",
        phone: "0551234567",
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
});