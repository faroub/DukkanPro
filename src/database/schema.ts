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
  // business_profiles v2 — adds contact columns (migration 10)
  // ============================================================
  businessProfilesContact: `
    ALTER TABLE business_profiles ADD COLUMN phone_number TEXT;
    ALTER TABLE business_profiles ADD COLUMN address TEXT;
    ALTER TABLE business_profiles ADD COLUMN rc_number TEXT;
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
      currency TEXT NOT NULL DEFAULT 'DZD',
      note TEXT,
      sold_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  // ============================================================
  // sales v2 — adds write-once currency column (migration 12)
  // ============================================================
  salesCurrency: `
    ALTER TABLE sales ADD COLUMN currency TEXT NOT NULL DEFAULT 'DZD';
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
      currency TEXT NOT NULL DEFAULT 'DZD',
      note TEXT,
      paid_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  // ============================================================
  // customer_payments v2 — adds write-once currency column (migration 13)
  // ============================================================
  customerPaymentsCurrency: `
    ALTER TABLE customer_payments ADD COLUMN currency TEXT NOT NULL DEFAULT 'DZD';
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

  // ============================================================
  // indexes — Performance indexes for query scalability (migration 11)
  // ============================================================
  indexes: `
    CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
    CREATE INDEX IF NOT EXISTS idx_sales_remaining_balance ON sales(remaining_balance_centimes);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
    CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
  `,

  // ============================================================
  // integrity constraints v14 (migration 14)
  // - Adds an index for inventory_movements lookups by product.
  // - Adds non-negative CHECK constraints to products.stock_quantity,
  //   products.sale_price_centimes, products.cost_price_centimes,
  //   sales.total_centimes and sales.remaining_balance_centimes.
  //   SQLite cannot ALTER TABLE ... ADD CHECK, so products and sales are
  //   rebuilt (create new, copy, drop old, rename) with foreign_keys=OFF.
  //   The DROP TABLE also removes the migration-11 indexes, so they are
  //   re-created after each rebuild.
  //   CAUTION: this block is split on ';' — no semicolons may appear inside
  //   string literals or comments.
  // ============================================================
  integrityConstraintsV14: `
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);

    CREATE TABLE products_v14 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      category TEXT,
      sale_price_centimes INTEGER NOT NULL CHECK (sale_price_centimes >= 0),
      cost_price_centimes INTEGER NOT NULL CHECK (cost_price_centimes >= 0),
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
      minimum_stock_quantity INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'pcs',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT INTO products_v14 (id, name, sku, category, sale_price_centimes, cost_price_centimes, stock_quantity, minimum_stock_quantity, unit, is_active, created_at, updated_at)
    SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes, stock_quantity, minimum_stock_quantity, unit, is_active, created_at, updated_at FROM products;

    DROP TABLE products;
    ALTER TABLE products_v14 RENAME TO products;

    CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

    CREATE TABLE sales_v14 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      subtotal_centimes INTEGER NOT NULL DEFAULT 0,
      discount_centimes INTEGER NOT NULL DEFAULT 0,
      total_centimes INTEGER NOT NULL DEFAULT 0 CHECK (total_centimes >= 0),
      amount_paid_centimes INTEGER NOT NULL DEFAULT 0,
      remaining_balance_centimes INTEGER NOT NULL DEFAULT 0 CHECK (remaining_balance_centimes >= 0),
      payment_method TEXT NOT NULL DEFAULT 'cash',
      currency TEXT NOT NULL DEFAULT 'DZD',
      note TEXT,
      sold_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT INTO sales_v14 (id, customer_id, status, subtotal_centimes, discount_centimes, total_centimes, amount_paid_centimes, remaining_balance_centimes, payment_method, currency, note, sold_at, created_at, updated_at)
    SELECT id, customer_id, status, subtotal_centimes, discount_centimes, total_centimes, amount_paid_centimes, remaining_balance_centimes, payment_method, currency, note, sold_at, created_at, updated_at FROM sales;

    DROP TABLE sales;
    ALTER TABLE sales_v14 RENAME TO sales;

    CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
    CREATE INDEX IF NOT EXISTS idx_sales_remaining_balance ON sales(remaining_balance_centimes);
  `,
};
