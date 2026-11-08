/**
 * productRepository.test.ts — Unit tests for productRepository.
 *
 - Tests use the application's SQLite database (opened via getDatabase()).
 - Each test isolates via database state (archive/reset patterns).
 - All assertions are on the return values of the repository methods.
 */

import { getDatabase } from "../../database";
import { create as createSale, cancel as cancelSale, returnSale } from "../saleRepository";
import {
    adjustStock,
    archive,
    create,
    getAll,
    getById,
    getInventoryHistory,
    getTopSellingProducts,
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

    it("rejects negative sale or cost prices", async () => {
      await expect(
        create({
          name: "Negative Price Item",
          sku: "NEG-001",
          category: "test",
          sale_price_centimes: -500,
          cost_price_centimes: 100,
          stock_quantity: 10,
          minimum_stock_quantity: 1,
          unit: "pcs",
          is_active: true,
        })
      ).rejects.toThrow(/Price must be a non-negative integer/i);
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

    it("throws when a product with the same SKU already exists", async () => {
      await create({
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

      // The add-product form must tell the merchant the SKU is taken instead of
      // silently returning the pre-existing row.
      await expect(
        create({
          name: "تمر Dup 2",
          sku: "DT-DUP",
          category: "فواكه مجففة",
          sale_price_centimes: 999,
          cost_price_centimes: 500,
          stock_quantity: 1,
          minimum_stock_quantity: 1,
          unit: "كغ",
          is_active: true,
        }),
      ).rejects.toThrow("DUPLICATE_SKU");
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

    it("throws DUPLICATE_SKU when updating to a SKU another product already uses", async () => {
      const keeper = await create({
        name: "حامل SKU",
        sku: "UPD-DUP-A",
        category: "اختبار",
        sale_price_centimes: 1000,
        cost_price_centimes: 500,
        stock_quantity: 1,
        minimum_stock_quantity: 0,
        unit: "قطعة",
        is_active: true,
      });
      const other = await create({
        name: "منتج آخر",
        sku: "UPD-DUP-B",
        category: "اختبار",
        sale_price_centimes: 1000,
        cost_price_centimes: 500,
        stock_quantity: 1,
        minimum_stock_quantity: 0,
        unit: "قطعة",
        is_active: true,
      });

      await expect(
        update(other!.id, { sku: keeper!.sku }),
      ).rejects.toThrow("DUPLICATE_SKU");

      // The rejected update must not have changed the stored SKU.
      const unchanged = await getById(other!.id);
      expect(unchanged?.sku).toBe("UPD-DUP-B");
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

  describe("create() without a SKU", () => {
    it("returns the product it just created, not another row", async () => {
      // Seed an existing product first.
      await create({
        name: "منتج موجود مسبقاً",
        sku: "EX-001",
        category: "اختبار",
        sale_price_centimes: 100,
        cost_price_centimes: 50,
        stock_quantity: 1,
        minimum_stock_quantity: 1,
        unit: "قطعة",
        is_active: true,
      });

      // SKU is optional in the add-product form, so this is the common path.
      const created = await create({
        name: "منتج بدون رمز",
        sku: null,
        category: "اختبار",
        sale_price_centimes: 700,
        cost_price_centimes: 300,
        stock_quantity: 4,
        minimum_stock_quantity: 2,
        unit: "قطعة",
        is_active: true,
      });

      // The returned record must describe the row that was just inserted.
      expect(created.id).toBeGreaterThan(0);
      const fetched = await getById(created.id);
      expect(fetched?.name).toBe("منتج بدون رمز");
      expect(fetched?.sale_price_centimes).toBe(700);
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

    it("rejects a reduction larger than current stock with INSUFFICIENT_STOCK instead of clamping (F4)", async () => {
      const created = await create({
        name: "Stock Over-removal Test",
        sku: "STK-OVER",
        category: "test",
        sale_price_centimes: 100,
        cost_price_centimes: 50,
        stock_quantity: 5,
        minimum_stock_quantity: 1,
        unit: "pcs",
        is_active: true,
      });

      // Attempt to remove 10 units when only 5 are in stock must be rejected.
      await expect(
        adjustStock(created.id, -10, "Excess removal"),
      ).rejects.toThrow(/INSUFFICIENT_STOCK/);

      // Stock is untouched and no movement was recorded for the rejected attempt.
      const updatedProduct = await getById(created.id);
      expect(updatedProduct?.stock_quantity).toBe(5);
      const history = await getInventoryHistory(created.id);
      expect(history).toHaveLength(1); // only the opening movement
      expect(history[0].note).toBe("Opening stock");
    });

    it("rejects a non-integer quantityChange with INVALID_QUANTITY (F4)", async () => {
      const created = await create({
        name: "Fractional Adjustment Test",
        sku: "STK-FRAC",
        category: "test",
        sale_price_centimes: 100,
        cost_price_centimes: 50,
        stock_quantity: 5,
        minimum_stock_quantity: 1,
        unit: "pcs",
        is_active: true,
      });

      await expect(
        adjustStock(created.id, 2.5, "Fractional addition"),
      ).rejects.toThrow(/INVALID_QUANTITY/);
      await expect(
        adjustStock(created.id, -1.5, "Fractional removal"),
      ).rejects.toThrow(/INVALID_QUANTITY/);

      const still = await getById(created.id);
      expect(still?.stock_quantity).toBe(5);
    });

    it("rejects a zero quantityChange so no zero movement is ever recorded (F4)", async () => {
      const created = await create({
        name: "Zero Adjustment Test",
        sku: "STK-ZERO",
        category: "test",
        sale_price_centimes: 100,
        cost_price_centimes: 50,
        stock_quantity: 5,
        minimum_stock_quantity: 1,
        unit: "pcs",
        is_active: true,
      });

      await expect(adjustStock(created.id, 0, "No-op")).rejects.toThrow(
        /ZERO_QUANTITY_CHANGE/,
      );

      const history = await getInventoryHistory(created.id);
      expect(history).toHaveLength(1); // only the opening movement
    });

    it("records movement_type 'in' for increases and 'out' for decreases", async () => {
      const created = await create({
        name: "Sign Type Test",
        sku: "STK-SIGN",
        category: "test",
        sale_price_centimes: 100,
        cost_price_centimes: 50,
        stock_quantity: 5,
        minimum_stock_quantity: 1,
        unit: "pcs",
        is_active: true,
      });

      const inward = await adjustStock(created.id, 4, "restock");
      expect(inward.movement_type).toBe("in");
      expect(inward.quantity_change).toBe(4);

      const outward = await adjustStock(created.id, -3, "sale loss");
      expect(outward.movement_type).toBe("out");
      expect(outward.quantity_change).toBe(-3);

      const product = await getById(created.id);
      expect(product?.stock_quantity).toBe(6);
    });
  });

  describe("getTopSellingProducts()", () => {
    it("ranks products by completed sales and excludes quantities from cancelled sales", async () => {
      const p1 = await create({
        name: "Top Item Alpha",
        sku: "TOP-001",
        category: "Test",
        sale_price_centimes: 1000,
        cost_price_centimes: 500,
        stock_quantity: 50,
        minimum_stock_quantity: 5,
        unit: "pcs",
        is_active: true,
      });

      const p2 = await create({
        name: "Cancelled Item Beta",
        sku: "TOP-002",
        category: "Test",
        sale_price_centimes: 1000,
        cost_price_centimes: 500,
        stock_quantity: 50,
        minimum_stock_quantity: 5,
        unit: "pcs",
        is_active: true,
      });

      // 1. Completed sale of 10 units for p1
      await createSale({
        paymentMethod: "cash",
        items: [{ productId: p1.id, quantity: 10, unitSalePriceCentimes: 1000 }],
      });

      // 2. Cancelled sale of 50 units for p2
      const saleCancelled = await createSale({
        paymentMethod: "cash",
        items: [{ productId: p2.id, quantity: 50, unitSalePriceCentimes: 1000 }],
      });
      await cancelSale(saleCancelled.id, "Cancelled test sale");

      const topProducts = await getTopSellingProducts(6);

      // p1 must rank higher than p2 because p2's 50 units were cancelled (completed count = 0)
      const p1Index = topProducts.findIndex((p) => p.id === p1.id);
      const p2Index = topProducts.findIndex((p) => p.id === p2.id);

      expect(p1Index).toBeLessThan(p2Index);
    });
  });

  describe("stock ledger reconciliation", () => {
    it("records an 'Opening stock' movement when a product is created with stock", async () => {
      const created = await create({
        name: "Ledger Opening",
        sku: "LED-OPEN",
        category: "test",
        sale_price_centimes: 1000,
        cost_price_centimes: 500,
        stock_quantity: 20,
        minimum_stock_quantity: 2,
        unit: "pcs",
        is_active: true,
      });

      const history = await getInventoryHistory(created.id);
      const opening = history.filter((m: any) => m.note === "Opening stock");
      expect(opening).toHaveLength(1);
      expect(opening[0].movement_type).toBe("in");
      expect(opening[0].quantity_change).toBe(20);
      expect(opening[0].reference_sale_id).toBeNull();
    });

    it("does not record an opening movement when a product is created with zero stock", async () => {
      const created = await create({
        name: "Ledger Zero",
        sku: "LED-ZERO",
        category: "test",
        sale_price_centimes: 1000,
        cost_price_centimes: 500,
        stock_quantity: 0,
        minimum_stock_quantity: 0,
        unit: "pcs",
        is_active: true,
      });

      const history = await getInventoryHistory(created.id);
      expect(history).toHaveLength(0);
    });

    it("keeps SUM(quantity_change) equal to stock_quantity across create, adjustStock, sale, cancel and return", async () => {
      const product = await create({
        name: "Ledger Lifecycle",
        sku: "LED-LIFE",
        category: "test",
        sale_price_centimes: 1000,
        cost_price_centimes: 500,
        stock_quantity: 20,
        minimum_stock_quantity: 2,
        unit: "pcs",
        is_active: true,
      });

      const assertLedgerReconciles = async () => {
        const current = await getById(product.id);
        const movements = await getInventoryHistory(product.id);
        const sum = movements.reduce((acc: number, m: any) => acc + m.quantity_change, 0);
        expect(sum).toBe(current?.stock_quantity);
      };

      // 1. Opening stock
      await assertLedgerReconciles(); // 20

      // 2. Manual stock adjustment
      await adjustStock(product.id, 5, "restock");
      await assertLedgerReconciles(); // 25

      // 3. Sale deducts stock
      const sale = await createSale({
        paymentMethod: "cash",
        items: [{ productId: product.id, quantity: 10, unitSalePriceCentimes: 1000 }],
      });
      await assertLedgerReconciles(); // 15

      // 4. Cancelling the sale restores stock
      await cancelSale(sale.id, "test cancel");
      await assertLedgerReconciles(); // 25

      // 5. A returned sale also restores stock
      const returnedSale = await createSale({
        paymentMethod: "cash",
        items: [{ productId: product.id, quantity: 7, unitSalePriceCentimes: 1000 }],
      });
      await returnSale(returnedSale.id, "test return");
      await assertLedgerReconciles(); // 25
    });
  });
});
