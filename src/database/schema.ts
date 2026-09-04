/**
 * Schema.ts — Table definitions as SQL strings for Dukkan OS SQLite database.
 *
 * Money is stored as integer centimes — no floating-point money columns.
 * Foreign keys are declared. WAL mode is enabled in database.ts on every connection.
 *
 * Naming convention: all identifiers use lowercase_with_underscores.
 * All tables have created_at and updated_at timestamps.
 */

// Export SQL strings as a plain object so they can be imported without side effects.
export const schema = {
  // ============================================================
  // Migration version table — tracks which migrations have run.
  // ============================================================
  migrationVersion: `
    CREATE TABLE IF NOT EXISTS _migration_version (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      migrated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  // ============================================================
  // business_profiles — Merchant / shop configuration
  // ============================================================
  businessProfiles: `
    CREATE TABLE IF NOT EXISTS business_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      business_type TEXT NOT NULL DEFAULT 'grocery',
      currency TEXT NOT NULL DEFAULT 'DZD',
      selected_locale TEXT NOT NULL DEFAULT 'fr',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  // ============================================================
  // products — Product catalogue inventory
  // ============================================================
  products: `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      category TEXT,
      sale_price_centimes INTEGER NOT NULL,
      cost_price_centimes INTEGER NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      minimum_stock_quantity INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'pcs',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  // ============================================================
  // customers — Customer / client database
  // ============================================================
  customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      note TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  // ============================================================
  // sales — Sales / transactions header
  // ============================================================
  sales: `
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      subtotal_centimes INTEGER NOT NULL DEFAULT 0,
      discount_centimes INTEGER NOT NULL DEFAULT 0,
      total_centimes INTEGER NOT NULL DEFAULT 0,
      amount_paid_centimes INTEGER NOT NULL DEFAULT 0,
      remaining_balance_centimes INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      note TEXT,
      sold_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  // ============================================================
  // sale_items — Line items sold in a sale
  // ============================================================
  saleItems: `
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name_snapshot TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_sale_price_centimes INTEGER NOT NULL DEFAULT 0,
      unit_cost_price_centimes INTEGER NOT NULL DEFAULT 0,
      line_total_centimes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  // ============================================================
  // customer_payments — Recorded payments against customer debt
  // ============================================================
  customerPayments: `
    CREATE TABLE IF NOT EXISTS customer_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      amount_centimes INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      note TEXT,
      paid_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  // ============================================================
  // inventory_movements — Stock movement log (in/out)
  // ============================================================
  inventoryMovements: `
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      movement_type TEXT NOT NULL, -- 'in' | 'out' | 'adjustment'
      quantity_change INTEGER NOT NULL DEFAULT 0,
      reference_sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  // ============================================================
  // app_settings — Key-value store for app configuration
  // ============================================================
  appSettings: `
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

};