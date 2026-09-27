import React from "react";
import { waitFor, screen } from "@testing-library/react-native";

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

      renderScreen(<CustomerListScreen />);

      await waitFor(() => {
        expect(screen.getAllByText("Mustapha Customer").length).toBeGreaterThan(0);
      });
    });
  });

  describe("CustomerFormScreen", () => {
    it("renders form inputs for adding a customer", async () => {
      renderScreen(<CustomerFormScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Nouveau Client/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("CustomerDetailScreen", () => {
    it("renders customer profile and debt balance", async () => {
      const customer = await seedTestCustomer({ name: "Khaled Debtor" });
      await seedTestSale({ customerId: customer.id, paymentMethod: "credit", amountPaidCentimes: 0 });
      setMockSearchParams({ id: String(customer.id) });

      renderScreen(<CustomerDetailScreen customerId={customer.id} />);

      await waitFor(() => {
        expect(screen.getAllByText("Khaled Debtor").length).toBeGreaterThan(0);
      });
    });
  });

  describe("RecordPaymentScreen", () => {
    it("renders payment recording interface for a customer", async () => {
      const customer = await seedTestCustomer({ name: "Salim Payer" });
      setMockSearchParams({ id: String(customer.id), customerId: String(customer.id) });

      renderScreen(<RecordPaymentScreen customerId={customer.id} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Enregistrer un paiement/i).length).toBeGreaterThan(0);
      });
    });
  });
});
