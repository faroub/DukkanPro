import React from "react";
import { waitFor, screen } from "@testing-library/react-native";

import { ProductListScreen } from "@/features/products/ProductListScreen";
import { ProductFormScreen } from "@/features/products/ProductFormScreen";
import ProductDetailScreen from "@/features/products/ProductDetailScreen";
import { StockAdjustmentScreen } from "@/features/products/StockAdjustmentScreen";
import {
  renderScreen,
  resetTestDb,
  seedTestProduct,
  resetMockRouter,
  setMockSearchParams,
} from "@/testing/screenTestHarness";

describe("Product Screens Integration Harness", () => {
  beforeEach(async () => {
    resetMockRouter();
    await resetTestDb();
  });

  describe("ProductListScreen", () => {
    it("renders list of products from catalogue", async () => {
      await seedTestProduct({ name: "Farine 1kg", sale_price_centimes: 6000 });

      renderScreen(<ProductListScreen />);

      await waitFor(() => {
        expect(screen.getAllByText("Farine 1kg").length).toBeGreaterThan(0);
      });
    });
  });

  describe("ProductFormScreen", () => {
    it("renders form inputs for adding a product", async () => {
      renderScreen(<ProductFormScreen onSave={jest.fn()} onCancel={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Nouveau Produit/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("ProductDetailScreen", () => {
    it("renders product details and current stock", async () => {
      const product = await seedTestProduct({ name: "Huile d'Olive 1L", stock_quantity: 45 });
      setMockSearchParams({ id: String(product.id) });

      renderScreen(<ProductDetailScreen productId={product.id} />);

      await waitFor(() => {
        expect(screen.getAllByText("Huile d'Olive 1L").length).toBeGreaterThan(0);
        expect(screen.getAllByText(/45/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("StockAdjustmentScreen", () => {
    it("renders stock adjustment form for a product", async () => {
      const product = await seedTestProduct({ name: "Sucre 1kg", stock_quantity: 10 });
      setMockSearchParams({ id: String(product.id), productId: String(product.id) });

      renderScreen(<StockAdjustmentScreen />);

      await waitFor(() => {
        expect(screen.getByText("Ajuster le stock")).toBeTruthy();
      });
    });
  });
});
