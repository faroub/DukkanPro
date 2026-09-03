/**
 * productRepository.test.ts — Unit tests for productRepository.
 *
 - Tests use the application's SQLite database (opened via getDatabase()).
 - Each test isolates via database state (archive/reset patterns).
 - All assertions are on the return values of the repository methods.
 */

import { getDatabase } from "../../database";
import {
    adjustStock,
    archive,
    create,
    getAll,
    getById,
    getInventoryHistory,
    search,
    update,
} from "../productRepository";

let db: any;

beforeAll(async () => {
  db = await getDatabase();
});

describe("productRepository", () => {
  describe("getAll()", () => {
    it("returns an empty array when no products exist", async () => {
      const products = await getAll();
      expect(products).toEqual([]);
    });

    it("returns products after creation", async () => {
      await create({
        name: "طحين",
        sku: "FL-001",
        category: "مخبوزات",
        sale_price_centimes: 1500,
        cost_price_centimes: 900,
        stock_quantity: 42,
        minimum_stock_quantity: 10,
        unit: "كغ",
        is_active: true,
      });
      const products = await getAll({ is_active: true });
      expect(products.length).toBeGreaterThan(0);
      expect(products[0]?.name).toBe("طحين");
    });
  });

  describe("getById()", () => {
    it("returns null when product does not exist", async () => {
      const product = await getById(999);
      expect(product).toBeNull();
    });

    it("returns the product after creation", async () => {
      await create({
        name: "زيت",
        sku: "OI-001",
        category: "مطبخ",
        sale_price_centimes: 2500,
        cost_price_centimes: 1800,
        stock_quantity: 15,
        minimum_stock_quantity: 5,
        unit: "لتر",
        is_active: true,
      });
      const product = await getById(1); // id may vary; this is illustrative
      // We'll just verify getById works with the id returned from create
      const created = await create({
        name: "سكر",
        sku: "SU-001",
        category: "مخبوزات",
        sale_price_centimes: 1200,
        cost_price_centimes: 800,
        stock_quantity: 30,
        minimum_stock_quantity: 8,
        unit: "كغ",
        is_active: true,
      });
      expect(created?.id).toBeGreaterThan(0);
      const byId = await getById(created!.id);
      expect(byId?.name).toBe("سكر");
    });
  });

  describe("search()", () => {
    it("searches by name", async () => {
      await create({
        name: "زبادي",
        sku: "YG-001",
        category: "منتجات ألبان",
        sale_price_centimes: 800,
        cost_price_centimes: 600,
        stock_quantity: 20,
        minimum_stock_quantity: 5,
        unit: "كغ",
        is_active: true,
      });
      const results = await search("زبادي");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.name).toContain("زبادي");
    });

    it("searches by SKU", async () => {
      await create({
        name: "فاتح شهية",
        sku: "FG-001",
        category: "مقبلات",
        sale_price_centimes: 500,
        cost_price_centimes: 400,
        stock_quantity: 10,
        minimum_stock_quantity: 3,
        unit: "قطعة",
        is_active: true,
      });
      const results = await search("FG-001");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.sku).toBe("FG-001");
    });

    it("filters by is_active and search", async () => {
      // Create an inactive product
      await create({
        name: "منتج معطل",
        sku: "INACTIVE-001",
        category: "اختبار",
        sale_price_centimes: 100,
        cost_price_centimes: 50,
        stock_quantity: 0,
        minimum_stock_quantity: 0,
        unit: "قطعة",
        is_active: false,
      });
      const activeResults = await search("منتج", { is_active: true });
      const inactiveResults = await search("منتج", { is_active: false });
      expect(activeResults.length).toBeLessThanOrEqual(1);
      expect(inactiveResults.length).toBeGreaterThan(0);
    });
  });

  describe("create()", () => {
    it("creates a new product", async () => {
      const newProduct = {
        name: "تمر",
        sku: "DT-001",
        category: "فواكه مجففة",
        sale_price_centimes: 2000,
        cost_price_centimes: 1500,
        stock_quantity: 50,
        minimum_stock_quantity: 10,
        unit: "كغ",
        is_active: true,
      };
      const created = await create(newProduct);
      expect(created?.id).toBeGreaterThan(0);
      expect(created?.name).toBe("تمر");
    });

    it("is idempotent when same SKU provided — returns existing product", async () => {
      const p1 = await create({
        name: "تمر Dup",
        sku: "DT-DUP",
        category: "فواكه مجففة",
        sale_price_centimes: 2000,
        cost_price_centimes: 1500,
        stock_quantity: 50,
        minimum_stock_quantity: 10,
        unit: "كغ",
        is_active: true,
      });
      const p2 = await create({
        name: "تمر Dup",
        sku: "DT-DUP",
        category: "فواكه مجففة",
        sale_price_centimes: 2000,
        cost_price_centimes: 1500,
        stock_quantity: 50,
        minimum_stock_quantity: 10,
        unit: "كغ",
        is_active: true,
      });
      expect(p1?.id).toBe(p2?.id);
    });
  });

  describe("update()", () => {
    it("updates product fields", async () => {
      const created = await create({
        name: "قماش",
        sku: "CF-001",
        category: "مواد",
        sale_price_centimes: 3000,
        cost_price_centimes: 2500,
        stock_quantity: 100,
        minimum_stock_quantity: 20,
        unit: "متر",
        is_active: true,
      });
      const updated = await update(created!.id, {
        name: "قماش محبب",
        sale_price_centimes: 3500,
        is_active: false,
      });
      expect(updated?.name).toBe("قماش محبب");
      expect(updated?.sale_price_centimes).toBe(3500);
      expect(updated?.is_active).toBe(false);
    });
  });

  describe("archive()", () => {
    it("sets is_active = false without deleting the row", async () => {
      const created = await create({
        name: "منتج للحذف",
        sku: "DEL-001",
        category: "اختبار",
        sale_price_centimes: 100,
        cost_price_centimes: 50,
        stock_quantity: 5,
        minimum_stock_quantity: 1,
        unit: "قطعة",
        is_active: true,
      });
      await archive(created!.id);
      const product = await getById(created!.id);
      expect(product?.is_active).toBe(false);
      // Row still exists
      expect(product).not.toBeNull();
    });

    it("archived product cannot be included in active listings", async () => {
      const created = await create({
        name: "للحذف",
        sku: "DEL-002",
        category: "اختبار",
        sale_price_centimes: 200,
        cost_price_centimes: 100,
        stock_quantity: 3,
        minimum_stock_quantity: 1,
        unit: "قطعة",
        is_active: true,
      });
      await archive(created!.id);
      const activeProducts = await getAll({ is_active: true });
      expect(activeProducts.some((p) => p.name === "للحذف")).toBe(false);
    });
  });

  describe("adjustStock()", () => {
    it("creates an inventory movement and updates stock", async () => {
      const created = await create({
        name: "تعديل المخزون",
        sku: "STK-001",
        category: "اختبار",
        sale_price_centimes: 100,
        cost_price_centimes: 50,
        stock_quantity: 10,
        minimum_stock_quantity: 2,
        unit: "قطعة",
        is_active: true,
      });
      // Add 5 units
      const movement1 = await adjustStock(created!.id, 5, "estock addition");
      expect(movement1?.quantity_change).toBe(5);
      // Remove 3 units
      const movement2 = await adjustStock(created!.id, -3, "estock adjustment");
      expect(movement2?.quantity_change).toBe(-3);
      // Check history
      const history = await getInventoryHistory(created!.id);
      expect(history.length).toBeGreaterThanOrEqual(2);
      // Stock should be 10 + 5 - 3 = 12
      const product = await getById(created!.id);
      expect(product?.stock_quantity).toBe(12);
    });
  });
});
