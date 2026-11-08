/**
 * security-rules — business-rule guards, verified behaviorally.
 *
 * These tests exercise the real in-memory SQLite database instead of
 * string-matching source files: a guard that lives only in a comment or a
 * variable name cannot be caught by grepping code.
 *
 * Covered behaviorally:
 * - cancelling or returning a sale that is not completed throws;
 * - a refund cannot exceed the customer's available credit;
 * - a payment cannot exceed the customer's current debt;
 * - a hard reset empties every table and resets the autoincrement sequences.
 *
 * Dropped (cannot be made behavioral against the data layer):
 * - the DataResetScreen type-to-confirm gate (expectedBusinessName / isMatched
 *   string checks) — it is pure UI render state (a text input whose value must
 *   match the stored business name before resetDatabase is reachable). Its
 *   data-layer effect is covered by the hard-reset test below; the gate itself
 *   would need a full screen render with navigation/i18n/theme contexts and is
 *   intentionally not re-tested here.
 *
 * Kept as static where behavior cannot be observed: none — the route-file
 * "no raw SQL" convention now lives in eslint.config.js as a
 * no-restricted-imports rule (a stronger, structural version of the check:
 * route files cannot reach the database layer at all), and the DataResetScreen
 * gate is covered by src/features/settings/__tests__/DataResetScreen.test.tsx.
 */
import { executeAll, getDatabase } from "@/database/database";
import { create as createSale, cancel, returnSale } from "@/database/repositories/saleRepository";
import { create as createProduct } from "@/database/repositories/productRepository";
import { create as createCustomer } from "@/database/repositories/customerRepository";
import { resetDatabase } from "@/database/repositories/resetRepository";
import {
  canRecordPayment,
  getCustomerCredit,
  getCustomerDebt,
  recordPayment,
  recordRefund,
} from "@/services/customers/customerBalanceService";

async function resetAll(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(
    `DELETE FROM sale_items; DELETE FROM customer_payments; DELETE FROM inventory_movements; DELETE FROM sales; DELETE FROM products; DELETE FROM customers;`,
  );
}

async function tableCount(table: string): Promise<number> {
  const rows = await executeAll<{ c: number }>(`SELECT COUNT(*) AS c FROM ${table}`);
  return rows[0]?.c ?? 0;
}

describe("security business rules", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("refuses to cancel a sale that is not completed", async () => {
    const product = await createProduct({
      name: "Guard Cancel Item",
      sku: "G-Cancel",
      sale_price_centimes: 10000,
      cost_price_centimes: 5000,
      stock_quantity: 10,
      minimum_stock_quantity: 0,
      unit: "pcs",
    } as any);
    const customer = await createCustomer({
      name: "Guard Cancel Client",
      phone: "0557000001",
    } as any);

    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "cash",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
      amountPaidCentimes: 10000,
    });

    await cancel(sale.id, "first cancel");

    // A cancelled sale must not be cancellable a second time…
    await expect(cancel(sale.id, "second cancel")).rejects.toThrow("already cancelled");
    // …nor returned.
    await expect(returnSale(sale.id, "return after cancel")).rejects.toThrow("already cancelled");
  });

  it("refuses to return a sale that is not completed", async () => {
    const product = await createProduct({
      name: "Guard Return Item",
      sku: "G-Return",
      sale_price_centimes: 10000,
      cost_price_centimes: 5000,
      stock_quantity: 10,
      minimum_stock_quantity: 0,
      unit: "pcs",
    } as any);
    const customer = await createCustomer({
      name: "Guard Return Client",
      phone: "0557000002",
    } as any);

    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "cash",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
      amountPaidCentimes: 10000,
    });

    await returnSale(sale.id, "first return");

    // A returned sale must not be returned a second time…
    await expect(returnSale(sale.id, "second return")).rejects.toThrow("already returned");
    // …nor cancelled.
    await expect(cancel(sale.id, "cancel after return")).rejects.toThrow("already returned");
  });

  it("blocks a refund that exceeds the customer's available credit", async () => {
    const product = await createProduct({
      name: "Guard Refund Item",
      sku: "G-Refund",
      sale_price_centimes: 10000,
      cost_price_centimes: 5000,
      stock_quantity: 10,
      minimum_stock_quantity: 0,
      unit: "pcs",
    } as any);
    const customer = await createCustomer({
      name: "Guard Refund Client",
      phone: "0557000003",
    } as any);

    // Build real credit: a repaid credit sale that is then cancelled.
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
    });
    await recordPayment(customer.id, 10000, "cash", "repaying the sale");
    await cancel(sale.id, "wrong sale");
    expect(await getCustomerCredit(customer.id)).toBe(10000);

    // Refunding more than the available credit writes no row and leaves the
    // credit untouched.
    await expect(recordRefund(customer.id, 15000, "cash", "over credit")).resolves.toBeNull();
    expect(await getCustomerCredit(customer.id)).toBe(10000);
    const paymentRows = await executeAll<{ c: number }>(
      `SELECT COUNT(*) AS c FROM customer_payments WHERE customer_id = ?`,
      [customer.id],
    );
    expect(paymentRows[0].c).toBe(1); // only the original payment

    // Refunding exactly the credit succeeds and clears it.
    await expect(recordRefund(customer.id, 10000, "cash", "full refund")).resolves.not.toBeNull();
    expect(await getCustomerCredit(customer.id)).toBe(0);
  });

  it("blocks a payment that exceeds the customer's current debt", async () => {
    const product = await createProduct({
      name: "Guard Payment Item",
      sku: "G-Payment",
      sale_price_centimes: 10000,
      cost_price_centimes: 5000,
      stock_quantity: 10,
      minimum_stock_quantity: 0,
      unit: "pcs",
    } as any);
    const customer = await createCustomer({
      name: "Guard Payment Client",
      phone: "0557000004",
    } as any);

    // Create a real debt of 100.00 via a credit sale.
    await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
    });
    expect(await getCustomerDebt(customer.id)).toBe(10000);

    // Overpaying is refused — no row is written and the debt is unchanged.
    await expect(recordPayment(customer.id, 15000, "cash", "overpay")).resolves.toBeNull();
    expect(await getCustomerDebt(customer.id)).toBe(10000);
    expect(await canRecordPayment(customer.id, 15000)).toBe(false);
    expect(await canRecordPayment(customer.id, 5000)).toBe(true);

    // Paying exactly the debt settles it.
    await expect(recordPayment(customer.id, 10000, "cash", "settling")).resolves.not.toBeNull();
    expect(await getCustomerDebt(customer.id)).toBe(0);
  });

  it("empties every table and resets the autoincrement sequences on hard reset", async () => {
    const db = await getDatabase();

    // Seed every table through the real repositories plus the profile/settings
    // tables directly: products, customers, sales, sale_items,
    // customer_payments and inventory_movements all end up non-empty.
    const product = await createProduct({
      name: "Reset Wheat",
      sku: "RST-W",
      sale_price_centimes: 5000,
      cost_price_centimes: 3000,
      stock_quantity: 10,
      minimum_stock_quantity: 0,
      unit: "pcs",
    } as any);
    const customer = await createCustomer({
      name: "Reset Client",
      phone: "0557000005",
    } as any);
    await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 5000 }],
    });
    await recordPayment(customer.id, 5000, "cash");
    await db.runAsync(
      `INSERT INTO business_profiles (business_name, owner_name, business_type, currency, selected_locale)
       VALUES ('Test Shop', 'Owner', 'grocery', 'DZD', 'fr')`,
    );
    await db.runAsync(`INSERT INTO app_settings (key, value) VALUES ('selected_locale', 'fr')`);

    for (const table of [
      "products",
      "customers",
      "sales",
      "sale_items",
      "customer_payments",
      "inventory_movements",
      "business_profiles",
      "app_settings",
    ]) {
      expect(await tableCount(table)).toBeGreaterThan(0);
    }
    expect(await tableCount("sqlite_sequence")).toBeGreaterThan(0);

    await resetDatabase();

    for (const table of [
      "products",
      "customers",
      "sales",
      "sale_items",
      "customer_payments",
      "inventory_movements",
      "business_profiles",
      "app_settings",
    ]) {
      expect(await tableCount(table)).toBe(0);
    }

    // The app-data sequences are cleared so autoincrement restarts from 1,
    // while the migration bookkeeping sequence is deliberately preserved
    // (resetting it would break the schema).
    const seqRows = await executeAll<{ name: string }>(`SELECT name FROM sqlite_sequence`);
    expect(seqRows.map((r) => r.name)).toEqual(["_migration_version"]);
    const firstProduct = await createProduct({
      name: "After Reset",
      sku: "RST-2",
      sale_price_centimes: 1000,
      cost_price_centimes: 500,
      stock_quantity: 1,
      minimum_stock_quantity: 0,
      unit: "pcs",
    } as any);
    expect(firstProduct.id).toBe(1);
  });
});
