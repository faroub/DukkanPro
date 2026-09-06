import { getDatabase } from "../../database";
import {
    getLowStockProducts,
    getMovements,
    getOutOfStockProducts,
} from "../inventoryRepository";

let db: any;

beforeAll(async () => {
  db = await getDatabase();
});

beforeEach(async () => {
  await db.execAsync(`
    DELETE FROM inventory_movements;
    DELETE FROM products;
    DELETE FROM sqlite_sequence;
  `);
  await db.runAsync(
    `INSERT INTO products
      (name, sale_price_centimes, cost_price_centimes, stock_quantity, minimum_stock_quantity, unit, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ["Low", 100, 50, 2, 5, "pcs", 1],
  );
  await db.runAsync(
    `INSERT INTO products
      (name, sale_price_centimes, cost_price_centimes, stock_quantity, minimum_stock_quantity, unit, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ["Healthy", 100, 50, 10, 5, "pcs", 1],
  );
  await db.runAsync(
    `INSERT INTO products
      (name, sale_price_centimes, cost_price_centimes, stock_quantity, minimum_stock_quantity, unit, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ["Archived low", 100, 50, 0, 5, "pcs", 0],
  );
  await db.runAsync(
    `INSERT INTO inventory_movements
      (product_id, movement_type, quantity_change, reference_sale_id, note)
     VALUES (?, ?, ?, ?, ?)`,
    [1, "out", -3, null, "test sale"],
  );
});

describe("inventoryRepository", () => {
  it("detects active products at or below their low-stock threshold", async () => {
    const products = await getLowStockProducts();
    expect(products.map((product) => product.name)).toEqual(["Low"]);
  });

  it("detects active products with zero stock", async () => {
    const products = await getOutOfStockProducts();
    expect(products).toEqual([]);
  });

  it("returns inventory movement history", async () => {
    const movements = await getMovements(1);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      movement_type: "out",
      quantity_change: -3,
      note: "test sale",
    });
  });
});
