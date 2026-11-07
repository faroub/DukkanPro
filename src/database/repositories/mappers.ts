/**
 * mappers — Shared SQLite row → entity mappers for the repositories.
 *
 * One mapper per table keeps the row-to-object conversion in a single place
 * so the repositories cannot drift apart in field handling (for example the
 * boolean coercion of is_active or the currency fallback default). Mappers
 * ignore extra columns a query may select (e.g. aggregates).
 */

import { Customer, InventoryMovement, Product, Sale, SaleItem } from "../../types/entities";

/**
 * Map a products row to a Product entity.
 */
export function mapProductRow(r: any): Product {
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
 * Map a customers row to a Customer entity.
 */
export function mapCustomerRow(r: any): Customer {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    note: r.note,
    is_active: r.is_active !== 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/**
 * Map a sale_items row to a SaleItem entity.
 */
export function mapSaleItemRow(r: any): SaleItem {
  return {
    id: r.id,
    sale_id: r.sale_id,
    product_id: r.product_id,
    product_name_snapshot: r.product_name_snapshot,
    quantity: r.quantity,
    unit_sale_price_centimes: r.unit_sale_price_centimes,
    unit_cost_price_centimes: r.unit_cost_price_centimes,
    line_total_centimes: r.line_total_centimes,
    created_at: r.created_at,
  };
}

/**
 * Map a sales row (optionally joined with customers.customer_name) to a Sale
 * entity with its items attached.
 */
export function mapSaleRow(r: any, saleItems: SaleItem[] = []): Sale {
  return {
    id: r.id,
    customer_id: r.customer_id,
    customer_name: r.customer_name ?? null,
    status: r.status as "completed" | "cancelled" | "returned",
    subtotal_centimes: r.subtotal_centimes as number,
    discount_centimes: r.discount_centimes as number,
    total_centimes: r.total_centimes as number,
    amount_paid_centimes: r.amount_paid_centimes as number,
    remaining_balance_centimes: r.remaining_balance_centimes as number,
    payment_method: r.payment_method as
      | "cash"
      | "electronic"
      | "mixed"
      | "partial"
      | "credit",
    currency: r.currency || "DZD",
    note: r.note,
    sold_at: r.sold_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    saleItems,
  };
}

/**
 * Map an inventory_movements row to an InventoryMovement entity.
 */
export function mapInventoryMovementRow(r: any): InventoryMovement {
  return {
    id: r.id,
    product_id: r.product_id,
    movement_type: r.movement_type as "in" | "out" | "adjustment",
    quantity_change: r.quantity_change,
    reference_sale_id: r.reference_sale_id,
    note: r.note,
    created_at: r.created_at,
  };
}
