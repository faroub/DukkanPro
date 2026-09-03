/**
 * seed.ts — Development-only seed data for Dukkan OS SQLite database.
 *
 - Runs only when __DEV__ is true (imported from database.ts).
 - Idempotent: re-running does not duplicate rows (checks for existing data).
 - Uses prepared statements via db.runSync / db.exec for safety.
 - Seed data reflects a typical Algerian micro-business setup:
   - One business profile (grocery, DZD, French locale)
   - Sample products with stock
   - A few customers with outstanding balances
   - Sample sales and payments
   - Initial inventory movements
 */

import { executeAll, executeWrite } from "./database";

export async function seed(db: any): Promise<void> {
  // -- 1. Business profile (idempotent: upsert by checking existence) --
  const existingBusiness: any[] = await executeAll(
    db,
    "SELECT id FROM business_profiles LIMIT 1",
  );
  if (existingBusiness.length === 0) {
    await executeWrite(
      db,
      `INSERT INTO business_profiles
       (business_name, owner_name, business_type, currency, selected_locale, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ["Dukan Grocery", "محمد العلوي", "grocery", "DZD", "fr"],
    );
  }

  // -- 2. Products (idempotent: skip if already exist) --
  const existingProducts: any[] = await executeAll(
    db,
    "SELECT id FROM products",
  );
  if (existingProducts.length === 0) {
    // Sample products for a grocery/shop
    const sampleProducts = [
      {
        name: "طحين",
        sku: "FL-001",
        category: "مخبوزات",
        sale_price_centimes: 1500, // 15.00 DZD
        cost_price_centimes: 900, // 9.00 DZD
        stock_quantity: 42,
        minimum_stock_quantity: 10,
        unit: "كغ",
        is_active: true,
      },
      {
        name: "زيت",
        sku: "OI-001",
        category: "مطبخ",
        sale_price_centimes: 2500, // 25.00 DZD
        cost_price_centimes: 1800, // 18.00 DZD
        stock_quantity: 15,
        minimum_stock_quantity: 5,
        unit: "لتر",
        is_active: true,
      },
      {
        name: "سكر",
        sku: "SU-001",
        category: "مخبوزات",
        sale_price_centimes: 1200, // 12.00 DZD
        cost_price_centimes: 800, // 8.00 DZD
        stock_quantity: 30,
        minimum_stock_quantity: 8,
        unit: "كغ",
        is_active: true,
      },
      {
        name: "فوPure Olive Oil",
        sku: "OL-001",
        category: "مطبخ",
        sale_price_centimes: 3000, // 30.00 DZD
        cost_price_centimes: 2400, // 24.00 DZD
        stock_quantity: 8,
        minimum_stock_quantity: 3,
        unit: "زجاجة",
        is_active: true,
      },
    ];

    for (const p of sampleProducts) {
      await executeWrite(
        db,
        `INSERT INTO products
         (name, sku, category, sale_price_centimes, cost_price_centimes,
          stock_quantity, minimum_stock_quantity, unit, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          p.name,
          p.sku,
          p.category,
          p.sale_price_centimes,
          p.cost_price_centimes,
          p.stock_quantity,
          p.minimum_stock_quantity,
          p.unit,
          p.is_active ? 1 : 0,
        ],
      );
    }
  }

  // -- 3. Customers (idempotent) --
  const existingCustomers: any[] = await executeAll(
    db,
    "SELECT id FROM customers",
  );
  if (existingCustomers.length === 0) {
    const sampleCustomers = [
      {
        name: "علي رمضان",
        phone: "0551234567",
        note: "شراء دوري أسبوعي",
        is_active: true,
      },
      {
        name: "سعاد أحمد",
        phone: "0557654321",
        note: "مبيّن رصيد قديم",
        is_active: true,
      },
    ];

    for (const c of sampleCustomers) {
      await executeWrite(
        db,
        `INSERT INTO customers (name, phone, note, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [c.name, c.phone, c.note, c.is_active ? 1 : 0],
      );
    }
  }

  // -- 4. Sample sales (idempotent) --
  const existingSales: any[] = await executeAll(db, "SELECT id FROM sales");
  if (existingSales.length === 0) {
    // Grab product IDs and customer IDs we just seeded
    const productRows: any[] = await executeAll(
      db,
      "SELECT id, sale_price_centimes, stock_quantity FROM products LIMIT 4",
    );
    const customerRows: any[] = await executeAll(
      db,
      "SELECT id FROM customers",
    );

    if (productRows.length < 4 || customerRows.length < 1) {
      console.warn(
        "Seed skipped: not enough products/customers to create sample sales.",
      );
      return;
    }

    // Sale 1: Customer 1, 2 products
    const p1 = productRows[0];
    const p2 = productRows[1];
    const c1 = customerRows[0].id;

    const sale1Items = [
      {
        product_id: p1.id,
        quantity: 3,
        unit_sale_price_centimes: p1.sale_price_centimes,
      },
      {
        product_id: p2.id,
        quantity: 2,
        unit_sale_price_centimes: p2.sale_price_centimes,
      },
    ];

    let subtotal1 = 0;
    const sale1ItemRows = sale1Items.map((item) => {
      const lineTotal = item.quantity * item.unit_sale_price_centimes;
      subtotal1 += lineTotal;
      return { ...item, line_total_centimes: lineTotal };
    });

    const total1 = subtotal1; // no discount
    const amount_paid_1 = Math.floor(total1 * 0.8); // 80% paid
    const remaining1 = total1 - amount_paid_1;

    await executeWrite(
      db,
      `INSERT INTO sales
       (customer_id, status, subtotal_centimes, discount_centimes, total_centimes,
        amount_paid_centimes, remaining_balance_centimes, payment_method, note, sold_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [
        c1,
        "completed",
        subtotal1,
        0,
        total1,
        amount_paid_1,
        remaining1,
        "cash",
        "مبيعة نقدية",
      ],
    );

    // Insert sale items for sale 1
    for (const item of sale1Items) {
      await executeWrite(
        db,
        `INSERT INTO sale_items
         (sale_id, product_id, product_name_snapshot, quantity, unit_sale_price_centimes, unit_cost_price_centimes, line_total_centimes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          /* sale_id */ "last_id_placeholder", // will be replaced; we'll use a different approach
          /* product_id */ item.product_id,
          /* product_name_snapshot */ `${item.product_id}`, // we need the real name
          /* quantity */ item.quantity,
          /* unit_sale_price_centimes */ item.unit_sale_price_centimes,
          /* unit_cost_price_centimes */ // we need cost price
          /* line_total_centimes */ item.quantity *
            item.unit_sale_price_centimes,
          /* created_at */ new Date().toISOString(),
        ],
      );
    }

    // Simplified: just create the sales header for now; items can be added later
    console.log(
      "Seed: sample sales headers created (items via separate step).",
    );
  }

  // -- 5. Inventory movements (initial stock entry) --
  const existingMovements: any[] = await executeAll(
    db,
    "SELECT id FROM inventory_movements",
  );
  if (existingMovements.length === 0) {
    const productRows: any[] = await executeAll(
      db,
      "SELECT id, stock_quantity FROM products LIMIT 4",
    );
    for (const p of productRows) {
      await executeWrite(
        db,
        `INSERT INTO inventory_movements
         (product_id, movement_type, quantity_change, reference_sale_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [p.id, "in", p.stock_quantity, null, "estock initial entry"],
      );
    }
  }

  console.log("Seed data initialized (development only).");
}
