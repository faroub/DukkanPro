/**
 * exportRepository — Repository for exporting all application data.
 *
 - Used for backup/export functionality.
 - Returns complete data sets for all entities.
 - Read-only: no modifications to the database.
 */

import { executeAll, executeRead } from "../database";
import { Sale, SaleItem, Product, Customer, CustomerPayment, InventoryMovement } from "../../types/entities";

/**
 - Get all products from the catalogue.
 */
export async function getAllProducts(): Promise<Product[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
           stock_quantity, minimum_stock_quantity, unit, is_active,
           created_at, updated_at
       FROM products
      ORDER BY name ASC`,
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
 - Get all customers from the database.
 */
export async function getAllCustomers(): Promise<Customer[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, name, phone, note, is_active, created_at, updated_at
       FROM customers
      ORDER BY name ASC`,
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    note: r.note,
    is_active: r.is_active !== 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/**
 - Get all sales with their sale items included.
 */
export async function getAllSales(): Promise<Sale[]> {
  // Get all sales headers
  const saleRows: any[] = await executeAll(
    // language=SQLite
    `SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
             s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
             s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at
        FROM sales s
     ORDER BY s.sold_at DESC`,
  );

  // Get all sale items
  const itemRows: any[] = await executeAll(
    // language=SQLite
    `SELECT si.id, si.sale_id, si.product_id, si.product_name_snapshot,
             si.quantity, si.unit_sale_price_centimes, si.unit_cost_price_centimes,
             si.line_total_centimes, si.created_at
        FROM sale_items si
     ORDER BY si.sale_id, si.id`,
  );

  // Group items by sale_id
  const itemsBySale = new Map<number, any[]>();
  for (const item of itemRows) {
    const existing = itemsBySale.get(item.sale_id) || [];
    existing.push(item);
    itemsBySale.set(item.sale_id, existing);
  }

  return saleRows.map((sale) => ({
    id: sale.id,
    customer_id: sale.customer_id,
    status: sale.status as "completed" | "cancelled" | "returned",
    subtotal_centimes: sale.subtotal_centimes as number,
    discount_centimes: sale.discount_centimes as number,
    total_centimes: sale.total_centimes as number,
    amount_paid_centimes: sale.amount_paid_centimes as number,
    remaining_balance_centimes: sale.remaining_balance_centimes as number,
    payment_method: sale.payment_method as
      | "cash"
      | "electronic"
      | "mixed"
      | "partial"
      | "credit",
    note: sale.note,
    sold_at: sale.sold_at,
    created_at: sale.created_at,
    updated_at: sale.updated_at,
    saleItems: itemsBySale.get(sale.id) || [],
  }));
}

/**
 - Get all sale items across all sales.
 */
export async function getAllSaleItems(): Promise<SaleItem[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT si.id, si.sale_id, si.product_id, si.product_name_snapshot,
             si.quantity, si.unit_sale_price_centimes, si.unit_cost_price_centimes,
             si.line_total_centimes, si.created_at
        FROM sale_items si
     ORDER BY si.sale_id, si.id`,
  );

  return rows.map((r) => ({
    id: r.id,
    sale_id: r.sale_id,
    product_id: r.product_id,
    product_name_snapshot: r.product_name_snapshot,
    quantity: r.quantity,
    unit_sale_price_centimes: r.unit_sale_price_centimes,
    unit_cost_price_centimes: r.unit_cost_price_centimes,
    line_total_centimes: r.line_total_centimes,
    created_at: r.created_at,
  }));
}

/**
 - Get all customer payments.
 */
export async function getAllPayments(): Promise<CustomerPayment[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT cp.id, cp.customer_id, cp.amount_centimes, cp.payment_method,
             cp.note, cp.paid_at, cp.created_at
       FROM customer_payments cp
    ORDER BY cp.paid_at DESC`,
  );

  return rows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    amount_centimes: r.amount_centimes as number,
    payment_method: r.payment_method as
      | "cash"
      | "electronic"
      | "mixed"
      | "partial"
      | "credit",
    note: r.note,
    paid_at: r.paid_at,
    created_at: r.created_at,
  }));
}

/**
 - Get all inventory movements.
 */
export async function getAllInventoryMovements(): Promise<InventoryMovement[]> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, product_id, movement_type, quantity_change, reference_sale_id, note, created_at
       FROM inventory_movements
    ORDER BY created_at DESC`,
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