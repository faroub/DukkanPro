import { cancel, create, getById, returnSale } from "../saleRepository";
import { create as createCustomer } from "../customerRepository";
import { create as createProduct } from "../productRepository";
import { recordPayment, getCustomerDebt, getCustomerPayments } from "@/services/customers/customerBalanceService";
import { executeAll, getDatabase } from "@/database/database";

const dummyCustomer = (name: string) => ({
  name,
  phone: null,
  note: null,
  is_active: true,
});

const dummyProduct = (data: {
  name: string;
  sale_price_centimes: number;
  cost_price_centimes: number;
  stock_quantity: number;
}) => ({
  name: data.name,
  sku: null,
  category: null,
  sale_price_centimes: data.sale_price_centimes,
  cost_price_centimes: data.cost_price_centimes,
  stock_quantity: data.stock_quantity,
  minimum_stock_quantity: 5,
  unit: "Pcs",
  is_active: true,
});

describe("High Findings Safeguards (H1, H2, H3)", () => {
  beforeEach(async () => {
    const db = await getDatabase();
    await db.execAsync("DELETE FROM customer_payments;");
    await db.execAsync("DELETE FROM sale_items;");
    await db.execAsync("DELETE FROM sales;");
    await db.execAsync("DELETE FROM inventory_movements;");
    await db.execAsync("DELETE FROM products;");
    await db.execAsync("DELETE FROM customers;");
  });

  describe("H1: Cancel/Return Payment Reversal & Debt Reconciliation", () => {
    it("reverses customer payments on sale cancellation so orphaned payments do not absorb future sales", async () => {
      const customer = await createCustomer(dummyCustomer("Farid Customer"));
      const product = await createProduct(
        dummyProduct({
          name: "Test Juice",
          sale_price_centimes: 10000,
          cost_price_centimes: 6000,
          stock_quantity: 50,
        })
      );

      // 1. Credit sale of 100 DZD (10000 centimes)
      const sale = await create({
        customerId: customer.id,
        paymentMethod: "credit",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
        amountPaidCentimes: 0,
      });

      // Customer debt is 100 DZD
      expect(await getCustomerDebt(customer.id)).toBe(10000);

      // 2. Customer repays 100 DZD via ledger payment
      await recordPayment(customer.id, 10000, "cash", "Settling bill");

      // Customer debt is now 0 DZD
      expect(await getCustomerDebt(customer.id)).toBe(0);

      // 3. Merchant cancels the sale
      await cancel(sale.id, "Customer returned goods");

      // 4. Verify a negative refund payment entry was logged for customer
      const payments = await getCustomerPayments(customer.id);
      expect(payments).toHaveLength(2);
      expect(payments.map((p) => p.amount_centimes)).toContain(-10000);

      // 5. Debt for customer should be 0 DZD
      const debtAfterCancel = await getCustomerDebt(customer.id);
      expect(debtAfterCancel).toBe(0);

      // 6. New credit sale of 50 DZD to the same customer
      await create({
        customerId: customer.id,
        paymentMethod: "credit",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 5000 }],
        amountPaidCentimes: 0,
      });

      // 7. Customer debt must be EXACTLY 50 DZD (not absorbed by orphaned payment)
      const newDebt = await getCustomerDebt(customer.id);
      expect(newDebt).toBe(5000);
    });

    it("reverses customer payments on sale return", async () => {
      const customer = await createCustomer(dummyCustomer("Karim Returner"));
      const product = await createProduct(
        dummyProduct({
          name: "Test Water",
          sale_price_centimes: 4000,
          cost_price_centimes: 2000,
          stock_quantity: 20,
        })
      );

      const sale = await create({
        customerId: customer.id,
        paymentMethod: "credit",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 4000 }],
        amountPaidCentimes: 0,
      });

      await recordPayment(customer.id, 4000, "cash", "Full payment");

      await returnSale(sale.id, "Defective packaging");

      const payments = await getCustomerPayments(customer.id);
      expect(payments).toHaveLength(2);
      expect(payments.map((p) => p.amount_centimes)).toContain(-4000);

      const debt = await getCustomerDebt(customer.id);
      expect(debt).toBe(0);
    });
  });

  describe("H2: Overselling Prevention & Accurate Stock Restoration", () => {
    it("rejects sales where requested quantity exceeds available stock", async () => {
      const product = await createProduct(
        dummyProduct({
          name: "Scarce Item",
          sale_price_centimes: 5000,
          cost_price_centimes: 3000,
          stock_quantity: 1,
        })
      );

      // Attempt to sell 2 items when stock is 1
      await expect(
        create({
          paymentMethod: "cash",
          items: [{ productId: product.id, quantity: 2, unitSalePriceCentimes: 5000 }],
        })
      ).rejects.toThrow("Insufficient stock for 'Scarce Item'");

      // Verify product stock remains 1
      const db = await getDatabase();
      const pRows = await executeAll<{ stock_quantity: number }>(
        `SELECT stock_quantity FROM products WHERE id = ?`,
        [product.id]
      );
      expect(pRows[0].stock_quantity).toBe(1);
    });
  });

  describe("H3: Cash Underpayment & Over-tender Clamping", () => {
    it("rejects underpayment / partial debt sales if no customer is selected", async () => {
      const product = await createProduct(
        dummyProduct({
          name: "Bread",
          sale_price_centimes: 5000,
          cost_price_centimes: 3000,
          stock_quantity: 10,
        })
      );

      // Sale total = 5000, amount paid = 3000 (2000 remaining) without customerId
      await expect(
        create({
          paymentMethod: "cash",
          items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 5000 }],
          amountPaidCentimes: 3000,
        })
      ).rejects.toThrow("A customer must be selected to record partial payment or debt.");
    });

    it("clamps stored amount_paid_centimes to total_centimes when over-tendered", async () => {
      const product = await createProduct(
        dummyProduct({
          name: "Milk",
          sale_price_centimes: 5000,
          cost_price_centimes: 3000,
          stock_quantity: 10,
        })
      );

      // Customer tenders 10000 cash for 5000 sale
      const sale = await create({
        paymentMethod: "cash",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 5000 }],
        amountPaidCentimes: 10000,
      });

      expect(sale.total_centimes).toBe(5000);
      expect(sale.amount_paid_centimes).toBe(5000); // Clamped
      expect(sale.remaining_balance_centimes).toBe(0);
    });
  });
});
