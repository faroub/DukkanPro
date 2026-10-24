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
    it("cancelling an unrelated cash sale B leaves customer A's credit sale A settled (debt = 0)", async () => {
      const customer = await createCustomer(dummyCustomer("Farid Discriminating Test"));
      const product = await createProduct(
        dummyProduct({
          name: "Test Product",
          sale_price_centimes: 10000, // 100 DZD
          cost_price_centimes: 6000,
          stock_quantity: 50,
        })
      );

      // 1. Credit sale A for 100 DZD
      const saleA = await create({
        customerId: customer.id,
        paymentMethod: "credit",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
        amountPaidCentimes: 0,
      });

      // Customer repays sale A in full -> debt = 0
      await recordPayment(customer.id, 10000, "cash", "Repaying sale A");
      expect(await getCustomerDebt(customer.id)).toBe(0);

      // 2. Separate fully-paid cash sale B (100 DZD) for the same customer -> debt = 0
      const saleB = await create({
        customerId: customer.id,
        paymentMethod: "cash",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 10000 }],
        amountPaidCentimes: 10000,
      });
      expect(await getCustomerDebt(customer.id)).toBe(0);

      // 3. Cancel Cash Sale B
      await cancel(saleB.id, "Cancelling cash sale B");

      // 4. Cancelling B MUST leave A settled (debt remains 0)!
      const debtAfterCancelB = await getCustomerDebt(customer.id);
      expect(debtAfterCancelB).toBe(0);
    });

    it("returning an unrelated cash sale B leaves customer A's credit sale A settled (debt = 0)", async () => {
      const customer = await createCustomer(dummyCustomer("Karim Return Test"));
      const product = await createProduct(
        dummyProduct({
          name: "Test Water",
          sale_price_centimes: 4000,
          cost_price_centimes: 2000,
          stock_quantity: 20,
        })
      );

      // 1. Credit sale A for 40 DZD
      const saleA = await create({
        customerId: customer.id,
        paymentMethod: "credit",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 4000 }],
        amountPaidCentimes: 0,
      });

      // Customer repays sale A in full
      await recordPayment(customer.id, 4000, "cash", "Full repayment for A");
      expect(await getCustomerDebt(customer.id)).toBe(0);

      // 2. Separate cash sale B for 40 DZD
      const saleB = await create({
        customerId: customer.id,
        paymentMethod: "cash",
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 4000 }],
        amountPaidCentimes: 4000,
      });
      expect(await getCustomerDebt(customer.id)).toBe(0);

      // 3. Return Sale B
      await returnSale(saleB.id, "Defective packaging on B");

      // 4. Returning B MUST leave A settled (debt remains 0)!
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
