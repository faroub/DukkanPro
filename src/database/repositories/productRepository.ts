/**
 * productRepository — Repository for catalog products and inventory movements.
 *
 * Rules:
 * - Products are soft-deleted (is_active = false) to retain referential integrity with sales.
 * - All writes run inside atomic SQLite transactions.
 * - Inventory movements strictly reflect the exact stock delta applied to products.
 */

import { InventoryMovement, Product } from "../../types/entities";
import { executeAll, executeRead, executeWrite, getDatabase, transaction } from "../database";

export type ProductFilters = {
  is_active?: boolean;
  category?: string;
  search?: string;
};

function escapeLike(query: string): string {
  return query.replace(/[%_\\]/g, "\\$&");
}

/**
 * Retrieve all products, optionally filtered by is_active, category, or search query.
 */
export async function getAll(filters: ProductFilters = {}): Promise<Product[]> {
  const { is_active, category, search } = filters;
  let sql = `
    SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
           stock_quantity, minimum_stock_quantity, unit, is_active,
           created_at, updated_at
    FROM products
  `;
  const params: unknown[] = [];

  const conditions: string[] = [];
  if (is_active !== undefined) {
    conditions.push(`is_active = ?`);
    params.push(is_active ? 1 : 0);
  }
  if (category !== undefined) {
    conditions.push(`category = ?`);
    params.push(category);
  }
  if (search) {
    conditions.push(`(name LIKE ? ESCAPE '\\' OR sku LIKE ? ESCAPE '\\')`);
    const likeQuery = `%${escapeLike(search)}%`;
    params.push(likeQuery, likeQuery);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += ` ORDER BY name ASC`;

  const rows: any[] = await executeAll(sql, params);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
    category: r.category,
    sale_price_centimes: r.sale_price_centimes,
    cost_price_centimes: r.cost_price_centimes,
    stock_quantity: r.stock_quantity,
    minimum_stock_quantity: r.minimum_stock_quantity,
    unit: r.unit,
    is_active: r.is_active !== 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/**
 * Search products by name or SKU substring, optionally filtered.
 */
export async function search(
  query: string,
  filters: ProductFilters = {},
): Promise<Product[]> {
  return getAll({ ...filters, search: query });
}

/**
 * Retrieve top selling products ordered by total quantity sold in completed sales.
 * Falls back to active products if no sales exist yet.
 */
export async function getTopSellingProducts(limit: number = 6): Promise<Product[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT p.id, p.name, p.sku, p.category, p.sale_price_centimes, p.cost_price_centimes,
            p.stock_quantity, p.minimum_stock_quantity, p.unit, p.is_active,
            p.created_at, p.updated_at,
            COALESCE(SUM(CASE WHEN s.status = 'completed' THEN si.quantity ELSE 0 END), 0) AS total_sold
       FROM products p
       LEFT JOIN sale_items si ON si.product_id = p.id
       LEFT JOIN sales s ON s.id = si.sale_id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY total_sold DESC, p.name ASC
      LIMIT ?`,
    [limit],
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
    category: r.category,
    sale_price_centimes: r.sale_price_centimes,
    cost_price_centimes: r.cost_price_centimes,
    stock_quantity: r.stock_quantity,
    minimum_stock_quantity: r.minimum_stock_quantity,
    unit: r.unit,
    is_active: r.is_active !== 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/**
 * Retrieve a single product by id.
 */
export async function getById(id: number): Promise<Product | null> {
  const rows: any[] = await executeRead(
    // language=SQLite
    `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
            stock_quantity, minimum_stock_quantity, unit, is_active,
            created_at, updated_at
     FROM products
     WHERE id = ?`,
    [id],
  );

  if (rows.length === 0) {
    return null;
  }

  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    sku: r.sku,
    category: r.category,
    sale_price_centimes: r.sale_price_centimes,
    cost_price_centimes: r.cost_price_centimes,
    stock_quantity: r.stock_quantity,
    minimum_stock_quantity: r.minimum_stock_quantity,
    unit: r.unit,
    is_active: r.is_active !== 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/**
 * Retrieve a single product by SKU.
 */
export async function getBySku(sku: string): Promise<Product | null> {
  const rows: any[] = await executeRead(
    // language=SQLite
    `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
            stock_quantity, minimum_stock_quantity, unit, is_active,
            created_at, updated_at
     FROM products
     WHERE sku = ?`,
    [sku],
  );

  if (rows.length === 0) {
    return null;
  }

  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    sku: r.sku,
    category: r.category,
    sale_price_centimes: r.sale_price_centimes,
    cost_price_centimes: r.cost_price_centimes,
    stock_quantity: r.stock_quantity,
    minimum_stock_quantity: r.minimum_stock_quantity,
    unit: r.unit,
    is_active: r.is_active !== 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/**
 * Create a new product.
 */
export async function create(
  product: Omit<Product, "id" | "created_at" | "updated_at">,
): Promise<Product> {
  try {
    const result = await executeWrite(
      // language=SQLite
      `INSERT INTO products
       (name, sku, category, sale_price_centimes, cost_price_centimes,
        stock_quantity, minimum_stock_quantity, unit, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        product.name,
        product.sku,
        product.category,
        product.sale_price_centimes,
        product.cost_price_centimes,
        product.stock_quantity,
        product.minimum_stock_quantity,
        product.unit,
        product.is_active ? 1 : 0,
      ],
    );

    const created = await getById(result);
    if (!created) throw new Error("Failed to create product");
    return created;
  } catch (err: any) {
    if (err?.message?.includes("UNIQUE constraint failed: products.sku")) {
      throw new Error("DUPLICATE_SKU: A product with this SKU already exists");
    }
    throw err;
  }
}

/**
 * Update an existing product by id dynamically based on supplied fields.
 */
export async function update(
  id: number,
  product: Partial<Omit<Product, "id" | "created_at" | "updated_at">>,
): Promise<Product> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (product.name !== undefined) {
    fields.push("name = ?");
    values.push(product.name);
  }
  if (product.sku !== undefined) {
    fields.push("sku = ?");
    values.push(product.sku);
  }
  if (product.category !== undefined) {
    fields.push("category = ?");
    values.push(product.category);
  }
  if (product.sale_price_centimes !== undefined) {
    fields.push("sale_price_centimes = ?");
    values.push(product.sale_price_centimes);
  }
  if (product.cost_price_centimes !== undefined) {
    fields.push("cost_price_centimes = ?");
    values.push(product.cost_price_centimes);
  }
  if (product.stock_quantity !== undefined) {
    fields.push("stock_quantity = ?");
    values.push(product.stock_quantity);
  }
  if (product.minimum_stock_quantity !== undefined) {
    fields.push("minimum_stock_quantity = ?");
    values.push(product.minimum_stock_quantity);
  }
  if (product.unit !== undefined) {
    fields.push("unit = ?");
    values.push(product.unit);
  }
  if (product.is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(product.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    const existing = await getById(id);
    if (!existing) throw new Error(`Product id=${id} not found`);
    return existing;
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);

  const sql = `UPDATE products SET ${fields.join(", ")} WHERE id = ?`;
  await executeWrite(sql, values);

  const updated = await getById(id);
  if (!updated) throw new Error(`Product id=${id} not found`);
  return updated;
}

/**
 * Archive (soft-delete) a product by id.
 */
export async function archive(id: number): Promise<void> {
  await executeWrite(
    // language=SQLite
    `UPDATE products
     SET is_active = 0,
         updated_at = datetime('now')
     WHERE id = ?`,
    [id],
  );
}

/**
 * Adjust stock quantity for a product atomically in a single transaction.
 * Creates an inventory_movement record and updates product stock_quantity.
 * The movement quantity_change strictly matches the actual stock delta applied.
 */
export async function adjustStock(
  id: number,
  quantityChange: number,
  reason: string,
): Promise<InventoryMovement> {
  const db = await getDatabase();
  return await transaction(db, async (tx: any) => {
    const productRows: any[] = await executeRead(
      tx,
      `SELECT id, name, stock_quantity FROM products WHERE id = ?`,
      [id],
    );

    if (productRows.length === 0) {
      throw new Error(`Product id=${id} not found`);
    }

    const product = productRows[0];
    const currentStock = product.stock_quantity || 0;

    // Calculate actual stock delta, clamping new stock at >= 0
    const newStock = Math.max(0, currentStock + quantityChange);
    const actualQuantityChange = newStock - currentStock;
    const movementType = actualQuantityChange >= 0 ? "in" : "out";

    // 1. Insert inventory movement record with exact stock delta
    const movementId = await executeWrite(
      tx,
      `INSERT INTO inventory_movements
       (product_id, movement_type, quantity_change, reference_sale_id, note, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [
        product.id,
        movementType,
        actualQuantityChange,
        null,
        reason,
      ],
    );

    // 2. Update product stock quantity
    await executeWrite(
      tx,
      `UPDATE products
          SET stock_quantity = ?,
              updated_at = datetime('now')
        WHERE id = ?`,
      [newStock, product.id],
    );

    return {
      id: movementId,
      product_id: product.id,
      movement_type: movementType as "in" | "out",
      quantity_change: actualQuantityChange,
      reference_sale_id: null,
      note: reason,
      created_at: new Date().toISOString(),
    };
  });
}

/**
 * Retrieve the full inventory movement history for a product.
 */
export async function getInventoryHistory(id: number): Promise<any[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, product_id, movement_type, quantity_change, reference_sale_id, note, created_at
     FROM inventory_movements
     WHERE product_id = ?
     ORDER BY created_at DESC`,
    [id],
  );
  return rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    movement_type: r.movement_type,
    quantity_change: r.quantity_change,
    reference_sale_id: r.reference_sale_id,
    note: r.note,
    created_at: r.created_at,
  }));
}
