/**
 * financialIntegrity.test.ts — End-to-End Behavioral Audit & Regression Test Suite
 * Exercises complete financial transaction lifecycles against real SQLite semantics.
 */

import { getDatabase } from "@/database/database";
import {
  create as createSale,
  cancel as cancelSale,
  returnSale,
  getById as getSaleById,
} from "@/database/repositories/saleRepository";
import { create as createProduct, getById as getProductById } from "@/database/repositories/productRepository";
import {
  create as createCustomer,
  archive as archiveCustomer,
  restore as restoreCustomer,
} from "@/database/repositories/customerRepository";
import {
  getCustomerBalance,
  getCustomerDebt,
  getCustomerCredit,
  getTotalShopDebt,
  getTotalShopCredit,
  recordPayment,
  recordRefund,
} from "@/services/customers/customerBalanceService";

async function resetTestDb() {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM sale_items;
    DELETE FROM customer_payments;
    DELETE FROM inventory_movements;
    DELETE FROM sales;
    DELETE FROM products;
    DELETE FROM customers;
    DELETE FROM business_profiles;
    DELETE FROM sqlite_sequence;
  `);
  await db.runAsync(
    `INSERT INTO business_profiles (business_name, owner_name, business_type, currency, selected_locale)
     VALUES ('Financial Test Shop', 'Owner', 'grocery', 'DZD', 'fr')`,
  );
  return db;
}

describe("Task 1: Financial Transaction Integrity Suite", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("Scenario 1: Fully paid cash sale followed by cancellation", async () => {
    const product = await createProduct({
      name: "Milk Carton",
      sku: "MILK-F1",
      category: "Dairy",
      sale_price_centimes: 12000,
      cost_price_centimes: 8000,
      stock_quantity: 50,
      minimum_stock_quantity: 5,
      unit: "pcs",
      is_active: true,
    });
    const customer = await createCustomer({
      name: "Yassine FullyPaid",
      phone: "0550111222",
      note: "Test",
      is_active: true,
    });

    // 1. Create fully paid cash sale (12,000 centimes)
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "cash",
      amountPaidCentimes: 12000,
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 12000 }],
    });

    expect(sale.status).toBe("completed");
    expect(sale.total_centimes).toBe(12000);
    expect(sale.amount_paid_centimes).toBe(12000);
    expect(sale.remaining_balance_centimes).toBe(0);

    // Stock deducted from 50 to 49
    const prodAfterSale = await getProductById(product.id);
    expect(prodAfterSale?.stock_quantity).toBe(49);

    // Balance, Debt, Credit checks before cancel
    expect(await getCustomerBalance(customer.id)).toBe(0);
    expect(await getCustomerDebt(customer.id)).toBe(0);
    expect(await getCustomerCredit(customer.id)).toBe(0);
    expect(await getTotalShopDebt()).toBe(0);
    expect(await getTotalShopCredit()).toBe(0);

    // 2. Cancel the fully paid sale
    await cancelSale(sale.id, "Customer changed mind");

    const cancelledSale = await getSaleById(sale.id);
    expect(cancelledSale?.status).toBe("cancelled");

    // Stock restored to 50
    const prodAfterCancel = await getProductById(product.id);
    expect(prodAfterCancel?.stock_quantity).toBe(50);

    // Balance after cancellation: upfront paid 12,000 on cancelled sale creates 12,000 store credit
    expect(await getCustomerBalance(customer.id)).toBe(-12000);
    expect(await getCustomerDebt(customer.id)).toBe(0);
    expect(await getCustomerCredit(customer.id)).toBe(12000);
    expect(await getTotalShopDebt()).toBe(0);
    expect(await getTotalShopCredit()).toBe(12000);
  });

  it("Scenario 2: Credit sale followed by partial repayment and cancellation", async () => {
    const product = await createProduct({
      name: "Rice 5kg",
      sku: "RICE-F2",
      category: "Grains",
      sale_price_centimes: 30000,
      cost_price_centimes: 20000,
      stock_quantity: 20,
      minimum_stock_quantity: 2,
      unit: "pcs",
      is_active: true,
    });
    const customer = await createCustomer({
      name: "Karim PartialCancel",
      phone: "0550333444",
      note: "Test",
      is_active: true,
    });

    // 1. Credit sale for 30,000 centimes
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 30000 }],
    });

    expect(await getCustomerDebt(customer.id)).toBe(30000);

    // 2. Customer repays 10,000 centimes
    const payment = await recordPayment(customer.id, 10000, "cash", "Partial repayment");
    expect(payment).not.toBeNull();
    expect(await getCustomerDebt(customer.id)).toBe(20000);

    // 3. Cancel the credit sale
    await cancelSale(sale.id, "Defective packaging");

    // Stock restored to 20
    const prodAfterCancel = await getProductById(product.id);
    expect(prodAfterCancel?.stock_quantity).toBe(20);

    // Customer balance: debt cleared, 10,000 repayment converted to store credit
    expect(await getCustomerBalance(customer.id)).toBe(-10000);
    expect(await getCustomerDebt(customer.id)).toBe(0);
    expect(await getCustomerCredit(customer.id)).toBe(10000);
    expect(await getTotalShopDebt()).toBe(0);
    expect(await getTotalShopCredit()).toBe(10000);
  });

  it("Scenario 3: Credit sale followed by full repayment and cancellation", async () => {
    const product = await createProduct({
      name: "Cooking Oil 5L",
      sku: "OIL-F3",
      category: "Oils",
      sale_price_centimes: 20000,
      cost_price_centimes: 15000,
      stock_quantity: 15,
      minimum_stock_quantity: 2,
      unit: "pcs",
      is_active: true,
    });
    const customer = await createCustomer({
      name: "Sofiane FullPaidCancel",
      phone: "0550555666",
      note: "Test",
      is_active: true,
    });

    // 1. Credit sale 20,000 centimes
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 20000 }],
    });

    // 2. Repay 20,000 in full
    await recordPayment(customer.id, 20000, "cash", "Paid in full");
    expect(await getCustomerDebt(customer.id)).toBe(0);

    // 3. Cancel sale
    await cancelSale(sale.id, "Wrong item selected");

    // Balance becomes -20,000 (20,000 store credit)
    expect(await getCustomerBalance(customer.id)).toBe(-20000);
    expect(await getCustomerCredit(customer.id)).toBe(20000);

    // 4. Refund customer 20,000 in cash
    const refund = await recordRefund(customer.id, 20000, "cash", "Cash refund for cancelled sale");
    expect(refund).not.toBeNull();
    expect(refund?.amount_centimes).toBe(-20000);

    // Balance fully settled back to 0
    expect(await getCustomerBalance(customer.id)).toBe(0);
    expect(await getCustomerDebt(customer.id)).toBe(0);
    expect(await getCustomerCredit(customer.id)).toBe(0);
  });

  it("Scenario 4: Return after partial payment", async () => {
    const product = await createProduct({
      name: "Sugar 1kg",
      sku: "SUGAR-F4",
      category: "Pantry",
      sale_price_centimes: 20000,
      cost_price_centimes: 12000,
      stock_quantity: 30,
      minimum_stock_quantity: 5,
      unit: "pcs",
      is_active: true,
    });
    const customer = await createCustomer({
      name: "Amine PartialReturn",
      phone: "0550777888",
      note: "Test",
      is_active: true,
    });

    // 1. Partial cash sale (20,000 total, 5,000 paid, 15,000 debt)
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "partial",
      amountPaidCentimes: 5000,
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 20000 }],
    });

    expect(sale.remaining_balance_centimes).toBe(15000);
    expect(await getCustomerDebt(customer.id)).toBe(15000);

    // 2. Process sale return
    await returnSale(sale.id, "Customer returned product");

    const returnedSale = await getSaleById(sale.id);
    expect(returnedSale?.status).toBe("returned");

    // Stock restored to 30
    const prodAfterReturn = await getProductById(product.id);
    expect(prodAfterReturn?.stock_quantity).toBe(30);

    // Balance: 15,000 debt cleared, 5,000 paid becomes store credit
    expect(await getCustomerBalance(customer.id)).toBe(-5000);
    expect(await getCustomerDebt(customer.id)).toBe(0);
    expect(await getCustomerCredit(customer.id)).toBe(5000);
  });

  it("Scenario 5: Multiple sequential refunds", async () => {
    const product = await createProduct({
      name: "Coffee 250g",
      sku: "COFFEE-F5",
      category: "Pantry",
      sale_price_centimes: 20000,
      cost_price_centimes: 10000,
      stock_quantity: 10,
      minimum_stock_quantity: 1,
      unit: "pcs",
      is_active: true,
    });
    const customer = await createCustomer({
      name: "Leila Refunds",
      phone: "0550999000",
      note: "Test",
      is_active: true,
    });

    // Seed 20,000 store credit by cancelling a paid sale
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "cash",
      amountPaidCentimes: 20000,
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 20000 }],
    });
    await cancelSale(sale.id, "cancelled");

    expect(await getCustomerCredit(customer.id)).toBe(20000);

    // First refund: 8,000 centimes
    const r1 = await recordRefund(customer.id, 8000, "cash", "First installment refund");
    expect(r1).not.toBeNull();
    expect(await getCustomerCredit(customer.id)).toBe(12000);

    // Second refund: 12,000 centimes
    const r2 = await recordRefund(customer.id, 12000, "cash", "Final installment refund");
    expect(r2).not.toBeNull();
    expect(await getCustomerCredit(customer.id)).toBe(0);

    // Third refund attempt: 1 centime (exceeds 0 credit $\rightarrow$ blocked)
    const r3 = await recordRefund(customer.id, 1, "cash", "Exceeding refund");
    expect(r3).toBeNull();
    expect(await getCustomerCredit(customer.id)).toBe(0);
  });

  it("Scenario 6: Two concurrent repayment attempts against debt", async () => {
    const product = await createProduct({
      name: "Flour 10kg",
      sku: "FLOUR-F6",
      category: "Grains",
      sale_price_centimes: 20000,
      cost_price_centimes: 14000,
      stock_quantity: 40,
      minimum_stock_quantity: 5,
      unit: "pcs",
      is_active: true,
    });
    const customer = await createCustomer({
      name: "Farid ConcurrentPay",
      phone: "0551111222",
      note: "Test",
      is_active: true,
    });

    await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 20000 }],
    });

    expect(await getCustomerDebt(customer.id)).toBe(20000);

    // Launch two concurrent 15,000 repayments against 20,000 debt
    const [res1, res2] = await Promise.all([
      recordPayment(customer.id, 15000, "cash", "Attempt 1"),
      recordPayment(customer.id, 15000, "cash", "Attempt 2"),
    ]);

    const succeeded = [res1, res2].filter((r) => r !== null);
    const failed = [res1, res2].filter((r) => r === null);

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(await getCustomerDebt(customer.id)).toBe(5000);
  });

  it("Scenario 7: Two concurrent refund attempts against store credit", async () => {
    const product = await createProduct({
      name: "Tea Pack",
      sku: "TEA-F7",
      category: "Pantry",
      sale_price_centimes: 10000,
      cost_price_centimes: 6000,
      stock_quantity: 20,
      minimum_stock_quantity: 2,
      unit: "pcs",
      is_active: true,
    });
    const customer = await createCustomer({
      name: "Nadia ConcurrentRefund",
      phone: "0552222333",
      note: "Test",
      is_active: true,
    });

    // Create 10,000 credit
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "cash",
      amountPaidCentimes: 10000,
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
    });
    await cancelSale(sale.id, "cancel");

    expect(await getCustomerCredit(customer.id)).toBe(10000);

    // Launch two concurrent 8,000 refunds against 10,000 credit
    const [ref1, ref2] = await Promise.all([
      recordRefund(customer.id, 8000, "cash", "Refund 1"),
      recordRefund(customer.id, 8000, "cash", "Refund 2"),
    ]);

    const succeeded = [ref1, ref2].filter((r) => r !== null);
    const failed = [ref1, ref2].filter((r) => r === null);

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(await getCustomerCredit(customer.id)).toBe(2000);
  });

  it("Scenario 8: Customer archiving and restoration balance safeguards", async () => {
    const product = await createProduct({
      name: "Juice Box",
      sku: "JUICE-F8",
      category: "Beverages",
      sale_price_centimes: 5000,
      cost_price_centimes: 3000,
      stock_quantity: 10,
      minimum_stock_quantity: 1,
      unit: "pcs",
      is_active: true,
    });
    const customer = await createCustomer({
      name: "Omar ArchiveGuard",
      phone: "0553333444",
      note: "Test",
      is_active: true,
    });

    // 1. Create debt (5,000 centimes)
    await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 5000 }],
    });

    // Archiving must fail while debt exists
    await expect(archiveCustomer(customer.id)).rejects.toThrow(/outstanding balance/i);

    // Pay off debt
    await recordPayment(customer.id, 5000, "cash");
    expect(await getCustomerDebt(customer.id)).toBe(0);

    // Archiving now succeeds
    await archiveCustomer(customer.id);

    // Attempting to record debt sale for archived customer fails
    await expect(
      createSale({
        customerId: customer.id,
        paymentMethod: "credit",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 5000 }],
      }),
    ).rejects.toThrow("INACTIVE_CUSTOMER");

    // Restore customer
    const restored = await restoreCustomer(customer.id);
    expect(restored.is_active).toBe(true);

    // Creating debt sale for restored customer succeeds
    const sale2 = await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 5000 }],
    });
    expect(sale2.status).toBe("completed");
    expect(await getCustomerDebt(customer.id)).toBe(5000);
  });

  it("Scenario 9: Numerical boundary validation around zero and overflow limits", async () => {
    const customer = await createCustomer({
      name: "Boundary Customer",
      phone: "0554444555",
      note: "Test",
      is_active: true,
    });

    // Zero payment rejected
    const pZero = await recordPayment(customer.id, 0, "cash");
    expect(pZero).toBeNull();

    // Negative payment rejected
    const pNeg = await recordPayment(customer.id, -500, "cash");
    expect(pNeg).toBeNull();

    // Zero refund rejected
    const rZero = await recordRefund(customer.id, 0, "cash");
    expect(rZero).toBeNull();

    // Negative refund rejected
    const rNeg = await recordRefund(customer.id, -500, "cash");
    expect(rNeg).toBeNull();

    // Unsafe integer repayment rejected
    const pOverflow = await recordPayment(customer.id, Number.MAX_SAFE_INTEGER + 1, "cash");
    expect(pOverflow).toBeNull();
  });
});
