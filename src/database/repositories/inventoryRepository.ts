/**
 * inventoryRepository — Repository for inventory movements and product stock status.
 *
 - getMovements: full history for a product
 - getLowStockProducts: products at or below minimum stock quantity
 - getOutOfStockProducts: products with zero stock
 */

import { InventoryMovement, Product } from "../../types/entities";
import { executeAll, executeRead } from "../database";

export type InventoryFilters = {
  productId?: number;
};

export type InventoryMovementResult = {
  id: number;
  product_id: number;
  movement_type: "in" | "out" | "adjustment";
  quantity_change: number;
  reference_sale_id: number | null;
  note: string | null;
  created_at: string;
};

export type ProductResult = {
  id: number;
  name: string;
  sku: string | null;
  sale_price_centimes: number;
  cost_price_centimes: number;
  stock_quantity: number;
  minimum_stock_quantity: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 - Retrieve the full inventory movement history for a product.
 */
export async function getMovements(productId: number): Promise<InventoryMovementResult[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, product_id, movement_type, quantity_change, reference_sale_id, note, created_at
       FROM inventory_movements
      WHERE product_id = ?
     ORDER BY created_at DESC`,
    [productId],
  );

  return rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    movement_type: r.movement_type as "in" | "out" | "adjustment",
    quantity_change: r.quantity_change,
    reference_sale_id: r.reference_sale_id,
    note: r.note,
    created_at: r.created_at,
  }));
}

/**
 - Get products that are at or below their minimum stock quantity (low stock).
 */
export async function getLowStockProducts(): Promise<ProductResult[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, name, sku, sale_price_centimes, cost_price_centimes,
           stock_quantity, minimum_stock_quantity, unit, is_active,
           created_at, updated_at
       FROM products
      WHERE stock_quantity <= minimum_stock_quantity
        AND is_active = 1
     ORDER BY stock_quantity ASC`,
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
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
 - Get products that have zero stock (out of stock).
 */
export async function getOutOfStockProducts(): Promise<ProductResult[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, name, sku, sale_price_centimes, cost_price_centimes,
           stock_quantity, minimum_stock_quantity, unit, is_active,
           created_at, updated_at
       FROM products
      WHERE stock_quantity = 0
        AND is_active = 1
     ORDER BY name ASC`,
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
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