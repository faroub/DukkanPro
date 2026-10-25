import React from "react";
import { CustomerListScreen } from "@/features/customers/CustomerListScreen";
import { CustomerFormScreen } from "@/features/customers/CustomerFormScreen";
import { CustomerDetailScreen } from "@/features/customers/CustomerDetailScreen";
import { RecordPaymentScreen } from "@/features/customers/RecordPaymentScreen";
import {
  renderScreen,
  resetTestDb,
  seedTestCustomer,
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
  });
});
