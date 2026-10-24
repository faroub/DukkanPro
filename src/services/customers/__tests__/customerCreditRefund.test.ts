/**
 * Customer credit & refund workflow — regression tests.
 *
 * Covers the H1 remainder: cancelling/returning a sale the customer already
 * paid for must surface customer credit (not hide it), and an explicit refund
 * must consume that credit without corrupting other sales' settlement.
 */
import { getDatabase } from "@/database/database";
import {
  create as createSale,
  cancel as cancelSale,
  returnSale,
} from "@/database/repositories/saleRepository";
import { create as createProduct } from "@/database/repositories/productRepository";
import { create as createCustomer } from "@/database/repositories/customerRepository";
import {
  getCustomerBalance,
  getCustomerDebt,
  getCustomerCredit,
  getCustomerPayments,
  recordPayment,
  canRecordPayment,
  recordRefund,
} from "@/services/customers/customerBalanceService";

async function resetAll() {
  const db = await getDatabase();
  await db.execAsync(
    `DELETE FROM sale_items; DELETE FROM customer_payments; DELETE FROM inventory_movements; DELETE FROM sales; DELETE FROM products; DELETE FROM customers;`,
  );
}

async function makeProduct(sku: string, price = 10000) {
  return createProduct({
    name: `Item ${sku}`,
    sku,
    sale_price_centimes: price,
    cost_price_centimes: Math.round(price / 2),
    stock_quantity: 100,
    minimum_stock_quantity: 0,
    unit: "pcs",
  } as any);
}

async function makeCustomer(name: string) {
  // Unique phone per customer: the repository dedupes customers by phone
  // and returns the existing record instead of creating a new one.
  return createCustomer({
    name,
    phone: `05${Math.floor(10000000 + Math.random() * 89999999)}`,
  } as any);
}

describe("Customer credit & refund workflow", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("cancelling a repaid credit sale surfaces the money as customer credit", async () => {
    const product = await makeProduct("C1");
    const customer = await makeCustomer("Ahmed");
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
    });
    await recordPayment(customer.id, 10000, "cash");

    // Before cancel: fully settled.
    expect(await getCustomerDebt(customer.id)).toBe(0);
    expect(await getCustomerCredit(customer.id)).toBe(0);

    await cancelSale(sale.id, "mistake");

    // After cancel: the customer's 100.00 is now visible credit, not hidden debt.
    expect(await getCustomerBalance(customer.id)).toBe(-10000);
    expect(await getCustomerCredit(customer.id)).toBe(10000);
    expect(await getCustomerDebt(customer.id)).toBe(0);
  });

  it("returning a repaid credit sale also surfaces customer credit", async () => {
    const product = await makeProduct("C2");
    const customer = await makeCustomer("Salah");
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
    });
    await recordPayment(customer.id, 10000, "cash");
    await returnSale(sale.id, "returned goods");

    expect(await getCustomerCredit(customer.id)).toBe(10000);
    expect(await getCustomerDebt(customer.id)).toBe(0);
  });

  it("cancelling a customer-linked fully-paid cash sale creates credit (upfront payment counted)", async () => {
    const product = await makeProduct("C3");
    const customer = await makeCustomer("Karim");
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "cash",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
      amountPaidCentimes: 10000,
    });
    await cancelSale(sale.id, "wrong sale");

    expect(await getCustomerCredit(customer.id)).toBe(10000);
  });

  it("cancelling a partially-paid sale creates credit equal to the upfront payment", async () => {
    const product = await makeProduct("C4");
    const customer = await makeCustomer("Yacine");
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "partial",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
      amountPaidCentimes: 4000,
    });
    // 60.00 still owed before the cancel.
    expect(await getCustomerDebt(customer.id)).toBe(6000);

    await cancelSale(sale.id, "mistake");

    expect(await getCustomerCredit(customer.id)).toBe(4000);
    expect(await getCustomerDebt(customer.id)).toBe(0);
  });

  it("killer regression: refunding credit after cancelling a paid cash sale never revives another sale's debt", async () => {
    const product = await makeProduct("C5");
    const customer = await makeCustomer("Mounir");

    // Sale A: credit sale, fully repaid.
    const saleA = await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
    });
    await recordPayment(customer.id, 10000, "cash");
    expect(await getCustomerDebt(customer.id)).toBe(0);

    // Sale B: fully-paid cash sale.
    const saleB = await createSale({
      customerId: customer.id,
      paymentMethod: "cash",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
      amountPaidCentimes: 10000,
    });

    // Cancel B → credit 100.00 (not debt).
    await cancelSale(saleB.id, "wrong sale");
    expect(await getCustomerDebt(customer.id)).toBe(0);
    expect(await getCustomerCredit(customer.id)).toBe(10000);

    // Explicitly refund the credit → A must stay settled, credit consumed.
    const refund = await recordRefund(customer.id, 10000, "cash", "refund for B");
    expect(refund).not.toBeNull();
    expect(refund!.amount_centimes).toBe(-10000);
    expect(await getCustomerDebt(customer.id)).toBe(0);
    expect(await getCustomerCredit(customer.id)).toBe(0);
    expect(await getCustomerBalance(customer.id)).toBe(0);
  });

  it("recordRefund validation: partial, full, exceeding credit, and invalid amounts", async () => {
    const product = await makeProduct("C6");
    const customer = await makeCustomer("Rachid");
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "cash",
      items: [{ productId: product.id, quantity: 2, unitSalePriceCentimes: 10000 }],
      amountPaidCentimes: 20000,
    });
    await cancelSale(sale.id, "mistake");
    expect(await getCustomerCredit(customer.id)).toBe(20000);

    // Partial refund.
    const partial = await recordRefund(customer.id, 5000, "cash");
    expect(partial).not.toBeNull();
    expect(await getCustomerCredit(customer.id)).toBe(15000);

    // Exceeding the remaining credit is blocked (no row written).
    const tooMuch = await recordRefund(customer.id, 20000, "cash");
    expect(tooMuch).toBeNull();
    expect(await getCustomerCredit(customer.id)).toBe(15000);

    // Full refund of the remainder.
    const full = await recordRefund(customer.id, 15000, "electronic");
    expect(full).not.toBeNull();
    expect(await getCustomerCredit(customer.id)).toBe(0);
    expect(await getCustomerBalance(customer.id)).toBe(0);

    // Refund with no credit available is blocked.
    const none = await recordRefund(customer.id, 100, "cash");
    expect(none).toBeNull();

    // Invalid amounts are blocked.
    expect(await recordRefund(customer.id, 0, "cash")).toBeNull();
    expect(await recordRefund(customer.id, -500, "cash")).toBeNull();
    expect(await recordRefund(customer.id, 100.5, "cash")).toBeNull();
  });

  it("a later credit sale consumes existing credit exactly once", async () => {
    const product = await makeProduct("C7");
    const customer = await makeCustomer("Hakim");
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "cash",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
      amountPaidCentimes: 10000,
    });
    await cancelSale(sale.id, "mistake");
    expect(await getCustomerCredit(customer.id)).toBe(10000);

    // New credit sale of 50.00: the 100.00 credit must offset it exactly once.
    await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 5, unitSalePriceCentimes: 1000 }],
    });
    expect(await getCustomerBalance(customer.id)).toBe(-5000);
    expect(await getCustomerCredit(customer.id)).toBe(5000);
    expect(await getCustomerDebt(customer.id)).toBe(0);

    // Another credit sale of 150.00: 50.00 credit + 150.00 owed → 100.00 net debt.
    await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 15, unitSalePriceCentimes: 1000 }],
    });
    expect(await getCustomerDebt(customer.id)).toBe(10000);
    expect(await getCustomerCredit(customer.id)).toBe(0);
  });

  it("payments are still blocked when there is no debt (overpayment guard unchanged)", async () => {
    const product = await makeProduct("C8");
    const customer = await makeCustomer("Omar");
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
    });
    expect(await canRecordPayment(customer.id, 15000)).toBe(false);
    const overpay = await recordPayment(customer.id, 15000, "cash");
    expect(overpay).toBeNull();

    const ok = await recordPayment(customer.id, 10000, "cash");
    expect(ok).not.toBeNull();
    expect(await getCustomerDebt(customer.id)).toBe(0);

    // More payments against zero debt are blocked.
    expect(await recordPayment(customer.id, 1000, "cash")).toBeNull();
  });

  it("concurrent refunds cannot exceed the available credit", async () => {
    const product = await makeProduct("C9");
    const customer = await makeCustomer("Bilal");
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "cash",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
      amountPaidCentimes: 10000,
    });
    await cancelSale(sale.id, "mistake");
    expect(await getCustomerCredit(customer.id)).toBe(10000);

    // Two refunds of 100.00 launched together: only 100.00 of credit exists,
    // so at most one may succeed (serialized by the DB mutex).
    const results = await Promise.all([
      recordRefund(customer.id, 10000, "cash"),
      recordRefund(customer.id, 10000, "cash"),
    ]);
    const succeeded = results.filter((r) => r !== null);
    expect(succeeded.length).toBe(1);
    expect(await getCustomerCredit(customer.id)).toBe(0);
    expect(await getCustomerBalance(customer.id)).toBe(0);
  });

  it("one customer's credit never offsets another customer's debt", async () => {
    const product = await makeProduct("C10");
    const debtor = await makeCustomer("Debtor");
    const creditor = await makeCustomer("Creditor");

    await createSale({
      customerId: debtor.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
    });

    const paidSale = await createSale({
      customerId: creditor.id,
      paymentMethod: "cash",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
      amountPaidCentimes: 10000,
    });
    await cancelSale(paidSale.id, "mistake");

    expect(await getCustomerDebt(debtor.id)).toBe(10000);
    expect(await getCustomerCredit(creditor.id)).toBe(10000);
    // Each customer's signed balance is independent.
    expect(await getCustomerBalance(debtor.id)).toBe(10000);
    expect(await getCustomerBalance(creditor.id)).toBe(-10000);
  });

  it("refund rows appear in payment history and are labelled by their sign", async () => {
    const product = await makeProduct("C11");
    const customer = await makeCustomer("Nabil");
    const sale = await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
    });
    await recordPayment(customer.id, 10000, "cash");
    await cancelSale(sale.id, "mistake");
    await recordRefund(customer.id, 4000, "cash", "partial give-back");

    const payments = await getCustomerPayments(customer.id);
    expect(payments).toHaveLength(2);
    const refundRow = payments.find((p) => p.amount_centimes < 0);
    expect(refundRow).toBeDefined();
    expect(refundRow!.amount_centimes).toBe(-4000);
    expect(refundRow!.note).toContain("partial give-back");
    expect(await getCustomerCredit(customer.id)).toBe(6000);
  });

  it("normal completed sales keep the exact same debt as before (no regression)", async () => {
    const product = await makeProduct("C12");
    const customer = await makeCustomer("Sami");
    await createSale({
      customerId: customer.id,
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 2, unitSalePriceCentimes: 10000 }],
    });
    await createSale({
      customerId: customer.id,
      paymentMethod: "partial",
      items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
      amountPaidCentimes: 4000,
    });
    await recordPayment(customer.id, 6000, "cash");

    // 30000 total owed (20000 + 10000) − 4000 upfront − 6000 repaid = 20000.
    expect(await getCustomerDebt(customer.id)).toBe(20000);
    expect(await getCustomerCredit(customer.id)).toBe(0);
  });
});
