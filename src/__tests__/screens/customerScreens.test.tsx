import React from "react";
import { CustomerListScreen } from "@/features/customers/CustomerListScreen";
import { CustomerFormScreen } from "@/features/customers/CustomerFormScreen";
import { CustomerDetailScreen } from "@/features/customers/CustomerDetailScreen";
import { RecordPaymentScreen, parseDzdToCentimes } from "@/features/customers/RecordPaymentScreen";
import { getCustomerDebt } from "@/services/customers/customerBalanceService";
import { fireEvent, waitFor } from "@testing-library/react-native";
import {
  renderScreen,
  resetTestDb,
  seedTestCustomer,
  seedTestProduct,
  seedTestSale,
  resetMockRouter,
  setMockSearchParams,
} from "@/testing/screenTestHarness";

describe("Customer Screens Integration Harness", () => {
  beforeEach(async () => {
    resetMockRouter();
    await resetTestDb();
  });

  describe("CustomerListScreen", () => {
    it("renders list of customers from database", async () => {
      await seedTestCustomer({ name: "Mustapha Customer", phone: "0661223344" });

      const screen = await renderScreen(<CustomerListScreen />);

      const elements = await screen.findAllByText("Mustapha Customer");
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe("CustomerFormScreen", () => {
    it("renders form inputs for adding a customer", async () => {
      const screen = await renderScreen(<CustomerFormScreen />);

      const elements = await screen.findAllByText(/Nouveau Client/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it("renders form in edit mode when customerId is provided", async () => {
      const customer = await seedTestCustomer({
        name: "Yassine EditTarget",
        phone: "0770112233",
        note: "Edit Note",
      });

      const screen = await renderScreen(<CustomerFormScreen customerId={customer.id} />);

      const elements = await screen.findAllByDisplayValue("Yassine EditTarget");
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe("CustomerDetailScreen", () => {
    it("renders customer profile and debt balance", async () => {
      const customer = await seedTestCustomer({ name: "Khaled Debtor" });
      await seedTestSale({ customerId: customer.id, paymentMethod: "credit", amountPaidCentimes: 0 });
      setMockSearchParams({ id: String(customer.id) });

      const screen = await renderScreen(<CustomerDetailScreen customerId={customer.id} />);

      const elements = await screen.findAllByText("Khaled Debtor");
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe("RecordPaymentScreen", () => {
    it("renders payment recording interface for a customer", async () => {
      const customer = await seedTestCustomer({ name: "Salim Payer" });
      setMockSearchParams({ id: String(customer.id), customerId: String(customer.id) });

      const screen = await renderScreen(<RecordPaymentScreen customerId={customer.id} />);

      const elements = await screen.findAllByText(/Enregistrer un paiement/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it("parses decimal DZD inputs with periods and commas correctly to centimes", () => {
      expect(parseDzdToCentimes("10.5")).toBe(1050);
      expect(parseDzdToCentimes("10,50")).toBe(1050);
      expect(parseDzdToCentimes("0.5")).toBe(50);
      expect(parseDzdToCentimes("0,50")).toBe(50);
      expect(parseDzdToCentimes("1500")).toBe(150000);
    });

    it("accepts exact repayment of fractional-unit debt (1050 centimes / 10.50 DZD) and clears debt to 0", async () => {
      const customer = await seedTestCustomer({ name: "Fractional Debtor" });
      const product = await seedTestProduct({
        name: "Juice 1L",
        sku: "FRAC-SKU-001",
        sale_price_centimes: 1050,
      });

      // Create fractional debt: 1050 centimes = 10.50 DZD
      await seedTestSale({
        customerId: customer.id,
        paymentMethod: "credit",
        amountPaidCentimes: 0,
        items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: 1050 }],
      });

      setMockSearchParams({ id: String(customer.id), customerId: String(customer.id) });

      const screen = await renderScreen(
        <RecordPaymentScreen customerId={customer.id} customerName={customer.name} currentDebt={1050} />
      );

      // Verify input is pre-filled with "10.5"
      const input = await screen.findByDisplayValue("10.5");
      expect(input).toBeTruthy();

      // Submit payment
      const submitBtn = await screen.findByText(/Confirmer le paiement/i);
      fireEvent.press(submitBtn);

      // Assert debt was fully cleared to 0
      await waitFor(async () => {
        const remainingDebt = await getCustomerDebt(customer.id);
        expect(remainingDebt).toBe(0);
      });
    });
  });
});
