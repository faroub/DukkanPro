/**
 * entities.ts — TypeScript interfaces for Dukkan OS SQLite entities.
 *
 * These types mirror the database schema defined in src/database/schema.ts
 * and are used for type-safe database operations, form validation, and
 * UI state management.
 */

// ---------------------------------------------------------------------------
// Core ID type
// ---------------------------------------------------------------------------
export type ID = number;

/**
 * BusinessProfile — Merchant / shop configuration stored in business_profiles.
 */
export interface BusinessProfile extends Entity {
  business_name: string;
  owner_name: string;
  business_type: string; // e.g. "grocery", "baker", "market_vendor", "service_seller"
  currency: string; // ISO 4217 or DZD
  selected_locale: "ar" | "fr" | "en";
  created_at: string; // ISO datetime string from SQLite datetime('now')
  updated_at: string; // ISO datetime string from SQLite datetime('now')
}

/**
 * Product — Catalogue inventory item.
 */
export interface Product extends Entity {
  name: string;
  sku: string | null; // nullable, UNIQUE
  category: string | null; // nullable
  sale_price_centimes: number; // integer centimes
  cost_price_centimes: number; // integer centimes
  stock_quantity: number; // integer >= 0
  minimum_stock_quantity: number; // integer >= 0
  unit: string; // e.g. "pcs", "kg", "liter"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Customer — Client / buyer in the system.
 */
export interface Customer extends Entity {
  name: string;
  phone: string | null; // nullable
  note: string | null; // nullable
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Sale — One sales transaction (header only; items are in sale_items).
 */
export interface Sale extends Entity {
  customer_id: ID | null; // nullable FK → customers(id)
  status: "completed" | "cancelled" | "refunded"; // string enum
  subtotal_centimes: number; // integer centimes
  discount_centimes: number; // integer centimes
  total_centimes: number; // integer centimes
  amount_paid_centimes: number; // integer centimes
  remaining_balance_centimes: number; // integer centimes >= 0
  payment_method: "cash" | "electronic" | "mixed" | "partial" | "credit";
  note: string | null; // nullable
  sold_at: string; // ISO datetime
  created_at: string;
  updated_at: string;
}

/**
 * SaleItem — One line item inside a Sale.
 */
export interface SaleItem extends Entity {
  sale_id: ID; // FK → sales(id) ON DELETE CASCADE
  product_id: ID | null; // nullable FK → products(id)
  product_name_snapshot: string; // denormalised at sale time
  quantity: number; // integer >= 1
  unit_sale_price_centimes: number; // integer centimes
  unit_cost_price_centimes: number; // integer centimes
  line_total_centimes: number; // integer centimes (= quantity × unit_sale_price_centimes)
  created_at: string;
}

/**
 * CustomerPayment — Recorded payment against a customer's debt.
 */
export interface CustomerPayment extends Entity {
  customer_id: ID; // FK → customers(id) ON DELETE CASCADE
  amount_centimes: number; // integer centimes > 0
  payment_method: "cash" | "electronic" | "mixed" | "partial" | "credit";
  note: string | null; // nullable
  paid_at: string; // ISO datetime
}

/**
 * InventoryMovement — Stock movement log (in / out / adjustment).
 */
export interface InventoryMovement extends Entity {
  product_id: ID; // FK → products(id) ON DELETE CASCADE
  movement_type: "in" | "out" | "adjustment"; // enum string
  quantity_change: number; // integer (can be negative for 'out')
  reference_sale_id: ID | null; // nullable FK → sales(id)
  note: string | null; // nullable
}