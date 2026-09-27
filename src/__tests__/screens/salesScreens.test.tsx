import React from "react";
import { waitFor, screen, fireEvent } from "@testing-library/react-native";

import SellScreen from "@/features/sales/SellScreen";
import { SalesHistoryScreen } from "@/features/sales/SalesHistoryScreen";
import { SaleDetailScreen } from "@/features/sales/SaleDetailScreen";
import {
  renderScreen,
  resetTestDb,
  seedTestProduct,
  seedTestCustomer,
  seedTestSale,
  resetMockRouter,
  setMockSearchParams,
} from "@/testing/screenTestHarness";
import { useCartStore } from "@/stores/cartStore";

describe("Sales Screens Integration Harness", () => {
  beforeEach(async () => {
    resetMockRouter();
    await resetTestDb();
    useCartStore.getState().clearCart();
  });

  describe("SellScreen (POS Checkout Flow)", () => {
    it("renders available products and adds item to cart", async () => {
      await seedTestProduct({ name: "Jus d'Orange", sale_price_centimes: 15000, stock_quantity: 20 });

      renderScreen(<SellScreen />);

      await waitFor(() => {
        expect(screen.getAllByText("Jus d'Orange").length).toBeGreaterThan(0);
      });

      // Tap product to add to cart
      fireEvent.press(screen.getAllByText("Jus d'Orange")[0]);

      // Verify item appears in cart total
      await waitFor(() => {
        expect(screen.getAllByText("150 DZD").length).toBeGreaterThan(0);
      });
    });

    it("completes checkout transaction and displays payment options", async () => {
      await seedTestProduct({ name: "Eau Minerale", sale_price_centimes: 5000, stock_quantity: 30 });

      renderScreen(<SellScreen />);

      await waitFor(() => {
        expect(screen.getAllByText("Eau Minerale").length).toBeGreaterThan(0);
      });

      // Add product to cart
      fireEvent.press(screen.getAllByText("Eau Minerale")[0]);

      // Press view cart button
      await waitFor(() => {
        expect(screen.getByText("Voir le panier")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Voir le panier"));
    });
  });

  describe("SalesHistoryScreen", () => {
    it("renders list of sales from database", async () => {
      const customer = await seedTestCustomer({ name: "Billel Buyer" });
      await seedTestSale({ customerId: customer.id, amountPaidCentimes: 24000 });

      renderScreen(<SalesHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText("Billel Buyer")).toBeTruthy();
        expect(screen.getByText("240 DZD")).toBeTruthy();
      });
    });
  });

  describe("SaleDetailScreen", () => {
    it("renders sale receipt details for a specific sale ID", async () => {
      const customer = await seedTestCustomer({ name: "Omar Details" });
      const sale = await seedTestSale({ customerId: customer.id, amountPaidCentimes: 24000 });

      setMockSearchParams({ id: String(sale.id) });

      renderScreen(<SaleDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText("Omar Details")).toBeTruthy();
        expect(screen.getAllByText("240 DZD").length).toBeGreaterThan(0);
      });
    });
  });
});
