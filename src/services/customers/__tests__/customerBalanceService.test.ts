/// <reference types="jest" />
/**
 * customerBalanceService tests — run against the REAL SQLite engine (sql.js),
 * exercising actual SQL semantics instead of mocking query results.
 */
import { getDatabase } from "@/database/database";
import {
  create as createSale,
  cancel as cancelSale,
  returnSale,
} from "@/database/repositories/saleRepository";
import { create as createProduct } from "@/database/repositories/productRepository";
import { create as createCustomer } from "@/database/repositories/customerRepository";
import * as customerBalanceService from "@/services/customers/customerBalanceService";
import { beforeEach, describe, expect, it } from "@jest/globals";

let customerCounter = 0;

async function resetAll() {
  const db = await getDatabase();
  await db.execAsync(
    `DELETE FROM sale_items; DELETE FROM customer_payments; DELETE FROM inventory_movements; DELETE FROM sales; DELETE FROM products; DELETE FROM customers;`,
  );
}

async function makeProduct(sku: string) {
  return createProduct({
    name: `Item ${sku}`,
    sku,
    sale_price_centimes: 10000,
    cost_price_centimes: 5000,
    stock_quantity: 1000,
    minimum_stock_quantity: 0,
    unit: "pcs",
  } as any);
}

async function makeCustomer() {
  customerCounter += 1;
  return createCustomer({
    name: `Customer ${customerCounter}`,
    phone: `05${String(customerCounter).padStart(8, "0")}`,
  } as any);
}

async function makeCreditSale(
  customerId: number,
  productId: number,
  quantity = 1,
  unitPrice = 10000,
) {
  return createSale({
    customerId,
    paymentMethod: "credit",
    items: [{ productId, quantity, unitSalePriceCentimes: unitPrice }],
  });
}

describe("customerBalanceService", () => {
  beforeEach(async () => {
    await resetAll();
  });

  describe("getCustomerDebt", () => {
    it("should calculate debt from completed sales balance minus payments", async () => {
      const product = await makeProduct("BS1");
      const customer = await makeCustomer();
      // Completed credit sale: 28000 owed, nothing repaid.
      await makeCreditSale(customer.id, product.id, 1, 28000);

      const debt = await customerBalanceService.getCustomerDebt(customer.id);
      expect(debt).toBe(28000);
    });

    it("should exclude cancelled sales from debt calculation", async () => {
      const product = await makeProduct("BS2");
      const customer = await makeCustomer();
      const sale = await makeCreditSale(customer.id, product.id, 1, 5000);
      await cancelSale(sale.id, "test cancel");

      const debt = await customerBalanceService.getCustomerDebt(customer.id);
      expect(debt).toBe(0);
    });

    it("should exclude returned sales from debt calculation", async () => {
      const product = await makeProduct("BS3");
      const customer = await makeCustomer();
      const sale = await makeCreditSale(customer.id, product.id, 1, 3000);
      await returnSale(sale.id, "test return");

      const debt = await customerBalanceService.getCustomerDebt(customer.id);
      expect(debt).toBe(0);
    });

    it("should handle multiple completed sales", async () => {
      const product = await makeProduct("BS4");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);
      await makeCreditSale(customer.id, product.id, 1, 5000);
      await customerBalanceService.recordPayment(customer.id, 10000, "cash");

      const debt = await customerBalanceService.getCustomerDebt(customer.id);
      expect(debt).toBe(15000);
    });

    it("should block overpayment (debt cannot be negative)", async () => {
      const product = await makeProduct("BS5");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);
      // A 30000 payment is blocked; only 20000 lands on the ledger.
      const blocked = await customerBalanceService.recordPayment(
        customer.id,
        30000,
        "cash",
      );
      expect(blocked).toBeNull();

      const debt = await customerBalanceService.getCustomerDebt(customer.id);
      expect(debt).toBe(20000);
    });

    it("should return 0 debt when no sales exist", async () => {
      const customer = await makeCustomer();
      const debt = await customerBalanceService.getCustomerDebt(customer.id);
      expect(debt).toBe(0);
    });
  });

  describe("getCustomerPayments", () => {
    it("should retrieve payments for a customer", async () => {
      const product = await makeProduct("BS6");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);
      await customerBalanceService.recordPayment(customer.id, 5000, "cash");

      const payments = await customerBalanceService.getCustomerPayments(
        customer.id,
      );
      expect(payments).toHaveLength(1);
      expect(payments[0].amount_centimes).toBe(5000);
    });

    it("should return empty array when no payments exist", async () => {
      const customer = await makeCustomer();
      const payments = await customerBalanceService.getCustomerPayments(
        customer.id,
      );
      expect(payments).toEqual([]);
    });
  });

  describe("canRecordPayment", () => {
    it("should allow payment when amount <= debt", async () => {
      const product = await makeProduct("BS7");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);

      expect(
        await customerBalanceService.canRecordPayment(customer.id, 20000),
      ).toBe(true);
      expect(
        await customerBalanceService.canRecordPayment(customer.id, 10000),
      ).toBe(true);
    });

    it("should block overpayment when amount > debt", async () => {
      const product = await makeProduct("BS8");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);

      expect(
        await customerBalanceService.canRecordPayment(customer.id, 25000),
      ).toBe(false);
    });

    it("should block zero amount payment", async () => {
      const product = await makeProduct("BS9");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);

      expect(
        await customerBalanceService.canRecordPayment(customer.id, 0),
      ).toBe(false);
    });

    it("should block negative amount payment", async () => {
      const product = await makeProduct("BS10");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);

      expect(
        await customerBalanceService.canRecordPayment(customer.id, -500),
      ).toBe(false);
    });
  });

  describe("recordPayment", () => {
    it("should record a payment successfully", async () => {
      const product = await makeProduct("BS11");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);

      const payment = await customerBalanceService.recordPayment(
        customer.id,
        15000,
        "cash",
      );
      expect(payment).not.toBeNull();
      expect(payment!.amount_centimes).toBe(15000);
      expect(await customerBalanceService.getCustomerDebt(customer.id)).toBe(
        5000,
      );
    });

    it("should return null when payment would exceed debt", async () => {
      const product = await makeProduct("BS12");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);

      const blocked = await customerBalanceService.recordPayment(
        customer.id,
        25000,
        "cash",
      );
      expect(blocked).toBeNull();
      expect(await customerBalanceService.getCustomerDebt(customer.id)).toBe(
        20000,
      );
    });

    it("should record electronic payment", async () => {
      const product = await makeProduct("BS13");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 10000);

      const payment = await customerBalanceService.recordPayment(
        customer.id,
        10000,
        "electronic",
      );
      expect(payment).not.toBeNull();
      expect(payment!.payment_method).toBe("electronic");
    });

    it("re-checks debt inside the transaction so a concurrent payment cannot cause overpayment", async () => {
      const product = await makeProduct("BS14");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);

      // Two 15000 payments launched together against 20000 of debt:
      // only one may succeed.
      const results = await Promise.all([
        customerBalanceService.recordPayment(customer.id, 15000, "cash"),
        customerBalanceService.recordPayment(customer.id, 15000, "cash"),
      ]);
      const succeeded = results.filter((r) => r !== null);
      expect(succeeded).toHaveLength(1);
      expect(await customerBalanceService.getCustomerDebt(customer.id)).toBe(
        5000,
      );
    });
  });

  describe("getCustomerBalanceSummary", () => {
    it("should return balance summary with debt, total paid, and payment count", async () => {
      const product = await makeProduct("BS15");
      const customer = await makeCustomer();
      await makeCreditSale(customer.id, product.id, 1, 20000);
      await customerBalanceService.recordPayment(customer.id, 5000, "cash");

      const summary = await customerBalanceService.getCustomerBalanceSummary(
        customer.id,
      );
      expect(summary.debt_centimes).toBe(15000);
      expect(summary.balance_centimes).toBe(15000);
      expect(summary.credit_centimes).toBe(0);
      expect(summary.total_paid_centimes).toBe(5000);
      expect(summary.total_refunded_centimes).toBe(0);
      expect(summary.paymentCount).toBe(1);
    });

    it("should return zero summary for customer with no sales or payments", async () => {
      const customer = await makeCustomer();
      const summary = await customerBalanceService.getCustomerBalanceSummary(
        customer.id,
      );
      expect(summary.debt_centimes).toBe(0);
      expect(summary.balance_centimes).toBe(0);
      expect(summary.credit_centimes).toBe(0);
      expect(summary.total_paid_centimes).toBe(0);
      expect(summary.paymentCount).toBe(0);
    });

    it("should report credit in the summary after cancelling a repaid sale", async () => {
      const product = await makeProduct("BS16");
      const customer = await makeCustomer();
      const sale = await makeCreditSale(customer.id, product.id, 1, 10000);
      await customerBalanceService.recordPayment(customer.id, 10000, "cash");
      await cancelSale(sale.id, "mistake");

      const summary = await customerBalanceService.getCustomerBalanceSummary(
        customer.id,
      );
      expect(summary.balance_centimes).toBe(-10000);
      expect(summary.credit_centimes).toBe(10000);
      expect(summary.debt_centimes).toBe(0);
      expect(summary.total_paid_centimes).toBe(10000);
      expect(summary.total_refunded_centimes).toBe(0);
      expect(summary.net_payments_centimes).toBe(10000);
    });
  });

  describe("getTotalShopDebt", () => {
    it("matches per-customer balance sum including store credits from cancelled prepaid sales", async () => {
      const product = await makeProduct("TSD1");
      const customer = await makeCustomer();

      // 1. Completed credit sale for 30,000 centimes
      await makeCreditSale(customer.id, product.id, 1, 30000);

      // 2. Separate prepaid cash sale for 20,000 centimes that was cancelled
      const cashSale = await createSale({
        customerId: customer.id,
        paymentMethod: "cash",
        amountPaidCentimes: 20000,
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 20000 }],
      });
      await cancelSale(cashSale.id, "Customer returned unneeded item");

      // Per-customer debt = 30000 - 20000 = 10000
      const customerDebt = await customerBalanceService.getCustomerDebt(customer.id);
      expect(customerDebt).toBe(10000);

      // Shop total debt MUST equal 10000 (not 30000!)
      const shopDebt = await customerBalanceService.getTotalShopDebt();
      expect(shopDebt).toBe(10000);
    });
  });
});
