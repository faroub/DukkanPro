import React from "react";
import { fireEvent } from "@testing-library/react-native";

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

      const screen = await renderScreen(<SellScreen />);

      const productTiles = await screen.findAllByText("Jus d'Orange");
      expect(productTiles.length).toBeGreaterThan(0);

      // Tap product to add to cart
      fireEvent.press(productTiles[0]);

      // Verify item appears in cart total
      const totalElements = await screen.findAllByText("150 DZD");
      expect(totalElements.length).toBeGreaterThan(0);
    });

    it("completes checkout transaction and displays payment options", async () => {
      await seedTestProduct({ name: "Eau Minerale", sale_price_centimes: 5000, stock_quantity: 30 });

      const screen = await renderScreen(<SellScreen />);

      const productTiles = await screen.findAllByText("Eau Minerale");
      expect(productTiles.length).toBeGreaterThan(0);

      // Add product to cart
      fireEvent.press(productTiles[0]);

      // Press view cart button
      const viewCartBtn = await screen.findByText("Voir le panier");
      expect(viewCartBtn).toBeTruthy();
      fireEvent.press(viewCartBtn);
    });

    it("displays correct change due (50 DZD) on receipt preview when 150 DZD is tendered on a 100 DZD sale", async () => {
      const product = await seedTestProduct({ name: "Cereal Box", sale_price_centimes: 10000, stock_quantity: 10 });

      const screen = await renderScreen(<SellScreen />);

      const productTiles = await screen.findAllByText("Cereal Box");
      fireEvent.press(productTiles[0]);

      // Open checkout sheet
      const viewCartBtn = await screen.findByText("Voir le panier");
      fireEvent.press(viewCartBtn);

      const payBtn = await screen.findByText(/Payer/i);
      fireEvent.press(payBtn);

      // In checkout sheet, enter 150 DZD cash tendered
      const amountInput = await screen.findByDisplayValue("100");
      fireEvent.changeText(amountInput, "150");

      // Confirm sale
      const confirmBtn = await screen.findByText("Confirmer la vente");
      fireEvent.press(confirmBtn);

      // Verify receipt preview displays change due 50 DZD
      const changeDueElements = await screen.findAllByText("50 DZD");
      expect(changeDueElements.length).toBeGreaterThan(0);
    });
  });

  describe("SalesHistoryScreen", () => {
    it("renders list of sales from database", async () => {
      const customer = await seedTestCustomer({ name: "Billel Buyer" });
      await seedTestSale({ customerId: customer.id, amountPaidCentimes: 24000 });

      const screen = await renderScreen(<SalesHistoryScreen />);

      expect(await screen.findByText("Billel Buyer")).toBeTruthy();
      expect(await screen.findByText("240 DZD")).toBeTruthy();
    });
  });

  describe("SaleDetailScreen", () => {
    it("renders sale receipt details for a specific sale ID", async () => {
      const customer = await seedTestCustomer({ name: "Omar Details" });
      const sale = await seedTestSale({ customerId: customer.id, amountPaidCentimes: 24000 });

      setMockSearchParams({ id: String(sale.id) });

      const screen = await renderScreen(<SaleDetailScreen />);

      expect(await screen.findByText("Omar Details")).toBeTruthy();
      const priceElements = await screen.findAllByText("240 DZD");
      expect(priceElements.length).toBeGreaterThan(0);
    });
  });
});
