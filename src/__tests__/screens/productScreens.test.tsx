import React from "react";
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

      const screen = await renderScreen(<ProductListScreen />);

      const elements = await screen.findAllByText("Farine 1kg");
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe("ProductFormScreen", () => {
    it("renders form inputs for adding a product", async () => {
      const screen = await renderScreen(<ProductFormScreen onSave={jest.fn()} onCancel={jest.fn()} />);

      const elements = await screen.findAllByText(/Nouveau Produit/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe("ProductDetailScreen", () => {
    it("renders product details and current stock", async () => {
      const product = await seedTestProduct({ name: "Huile d'Olive 1L", stock_quantity: 45 });
      setMockSearchParams({ id: String(product.id) });

      const screen = await renderScreen(<ProductDetailScreen productId={product.id} />);

      const titleElements = await screen.findAllByText("Huile d'Olive 1L");
      expect(titleElements.length).toBeGreaterThan(0);
      const stockElements = await screen.findAllByText(/45/i);
      expect(stockElements.length).toBeGreaterThan(0);
    });
  });

  describe("StockAdjustmentScreen", () => {
    it("renders stock adjustment form for a product", async () => {
      const product = await seedTestProduct({ name: "Sucre 1kg", stock_quantity: 10 });
      setMockSearchParams({ id: String(product.id), productId: String(product.id) });

      const screen = await renderScreen(<StockAdjustmentScreen />);

      expect(await screen.findByText("Ajuster le stock")).toBeTruthy();
    });
  });
});
