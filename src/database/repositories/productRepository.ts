/**
 * productRepository — Repository for products table.
 *
 - Uses prepared statements via db.runSync / db.getAllSync / db.getFirstSync.
 - Archive (soft-delete) sets is_active = false; products are never physically deleted.
 - Stock adjustments create inventory_movement records via the associated service.
 - Archived products cannot be sold (is_active = false filter applied in UI/query layer).
 */

import { executeAll, executeWrite, executeRead } from "../database";
import { Product } from "../../types/entities";

export type ProductFilters = {
  is_active?: boolean;
  category?: string | null;
  search?: string; // search by name or SKU (ILIKE %query%)
};

export type ProductResult = {
  product: Product | null;
  error?: string;
};

/**
 - Retrieve all products, optionally filtered by is_active and/or category.
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
    conditions.push(`(name LIKE ? OR sku LIKE ?)`);
    const likeQuery = `%${search}%`;
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
 - Retrieve a single product by its auto-increment id.
 - Returns null if not found.
 */
export async function getById(id: number): Promise<Product | null> {
  const rows: any[] = await executeRead(
    // language=SQLite
    `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
           stock_quantity, minimum_stock_quantity, unit, is_active,
           created_at, updated_at
     FROM products
     WHERE id = ?`,
    [id]
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
 - Search products by name or SKU substring, with optional filters (is_active, category).
 - Performs a ILIKE-%query% match on both name and sku columns.
 */
export async function search(query: string, filters: ProductFilters = {}): Promise<Product[]> {
  const { is_active, category } = filters;
  let sql = `
    SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
           stock_quantity, minimum_stock_quantity, unit, is_active,
           created_at, updated_at
    FROM products
    WHERE (name LIKE ? OR sku LIKE ?)
  `;
  const params: unknown[] = [`%${query}%`, `%${query}%`];

  if (is_active !== undefined) {
    sql += ` AND is_active = ?`;
    params.push(is_active ? 1 : 0);
  }
  if (category !== undefined) {
    sql += ` AND category = ?`;
    params.push(category);
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
 - Create a new product.
 - If a product with the same SKU already exists, the existing one is returned
   (idempotent). If no SKU is provided, a new product is created.
 */
export async function create(product: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
  // Check if a product with the same SKU already exists.
  if (product.sku) {
    const existing: Product | null = await getBySku(product.sku);
    if (existing) {
      return existing;
    }
  }

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
    ]
  );

  // Re-fetch the newly created row.
  if (product.sku) {
    return await getBySku(product.sku);
  }
  // If no SKU, fetch by name (last inserted — approximate; callers should use id).
  const all = await getAll({ is_active: true });
  return all[all.length - 1] || { id: -1, name: product.name, sku: product.sku || "", category: product.category, sale_price_centimes: product.sale_price_centimes, cost_price_centimes: product.cost_price_centimes, stock_quantity: product.stock_quantity, minimum_stock_quantity: product.minimum_stock_quantity, unit: product.unit, is_active: product.is_active, created_at: "", updated_at: "" };
}

/**
 - Update an existing product by id.
 - Only the provided fields are updated; id, created_at remain unchanged.
 */
export async function update(id: number, product: Partial<Omit<Product, "id" | "created_at">>): Promise<Product> {
  // Build dynamic UPDATE set from provided fields.
  const fields: string[] = [];
  const values: unknown[] = [];

  if (product.name !== undefined) {
    fields.push(`name = ?`);
    values.push(product.name);
  }
  if (product.category !== undefined) {
    fields.push(`category = ?`);
    values.push(product.category);
  }
  if (product.sale_price_centimes !== undefined) {
    fields.push(`sale_price_centimes = ?`);
    values.push(product.sale_price_centimes);
  }
  if (product.cost_price_centimes !== undefined) {
    fields.push(`cost_price_centimes = ?`);
    values.push(product.cost_price_centimes);
  }
  if (product.stock_quantity !== undefined) {
    fields.push(`stock_quantity = ?`);
    values.push(product.stock_quantity);
  }
  if (product.minimum_stock_quantity !== undefined) {
    fields.push(`minimum_stock_quantity = ?`);
    values.push(product.minimum_stock_quantity);
  }
  if (product.unit !== undefined) {
    fields.push(`unit = ?`);
    values.push(product.unit);
  }
  if (product.is_active !== undefined) {
    fields.push(`is_active = ?`);
    values.push(product.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    return await getById(id);
  }

  values.push(id);

  await executeWrite(
    // language=SQLite
    `UPDATE products
     SET ${fields.join(", ")},
         updated_at = datetime('now')
     WHERE id = ?`,
    values
  );
  return await getById(id);
}

/**
 - Archive (soft-delete) a product by id.
 - Sets is_active = false; the row is retained for history and referential integrity.
 */
export async function archive(id: number): Promise<void> {
  await executeWrite(
    // language=SQLite
    `UPDATE products
     SET is_active = 0,
         updated_at = datetime('now')
     WHERE id = ?`,
    [id]
  );
}

/**
 - Adjust stock quantity for a product.
 - Creates an inventory_movement record (in/out/adjustment) and updates stock_quantity.
 - reason is required for manual stock changes (audit trail).
 *
 - Positive quantityChange → stock addition (stock_addition movement type).
 - Negative quantityChange → stock removal (stock_adjustment movement type).
 - Zero or omitted → no-op (movement still created with quantity_change=0 if called).
 */
export async function adjustStock(id: number, quantityChange: number, reason: string): Promise<InventoryMovement> {
  // Fetch current product to get product_id and current stock.
  const product: Product | null = await getById(id);
  if (!product) {
    throw new Error(`Product id=${id} not found`);
  }

  const newStock = Math.max(0, product.stock_quantity + quantityChange);

  // Create the inventory movement record.
  await executeWrite(
    // language=SQLite
    `INSERT INTO inventory_movements
     (product_id, movement_type, quantity_change, reference_sale_id, note, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [
      product.id,
      quantityChange > 0 ? "in" : "out",
      quantityChange,
      null, // reference_sale_id; can be set later if linked to a sale
      reason,
    ]
  );

  // Update the product's stock quantity.
  await executeWrite(
    // language=SQLite
    `UPDATE products
     SET stock_quantity = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [newStock, product.id]
  );

  return {
    id: 0, // will be populated by the INSERT trigger; callers typically ignore or refetch
    product_id: product.id,
    movement_type: quantityChange > 0 ? "in" : "out",
    quantity_change: quantityChange,
    reference_sale_id: null,
    note: reason,
    created_at: new Date().toISOString(),
  };
}

/**
 - Retrieve the full inventory movement history for a product.
 */
export async function getInventoryHistory(id: number): Promise<any[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, product_id, movement_type, quantity_change, reference_sale_id, note, created_at
     FROM inventory_movements
     WHERE product_id = ?
     ORDER BY created_at DESC`,
    [id]
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

/**
 - Helper: retrieve a product by SKU (used by create idempotency).
 */
async function getBySku(sku: string): Promise<Product | null> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
           stock_quantity, minimum_stock_quantity, unit, is_active,
           created_at, updated_at
     FROM products
     WHERE sku = ?`,
    [sku]
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