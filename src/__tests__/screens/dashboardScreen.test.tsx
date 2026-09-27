import React from "react";
import { waitFor, screen, fireEvent } from "@testing-library/react-native";

import HomeScreen from "@/app/(tabs)/index";
import {
  renderScreen,
  resetTestDb,
  seedTestBusinessProfile,
  seedTestProduct,
  seedTestSale,
  resetMockRouter,
  mockRouter,
} from "@/testing/screenTestHarness";

describe("Dashboard Screen Integration Harness", () => {
  beforeEach(async () => {
    resetMockRouter();
    await resetTestDb();
  });

  it("renders the dashboard screen with metrics and revenue", async () => {
    await seedTestBusinessProfile("Mon Dukkan Superette");
    await seedTestSale(); // 240 DZD sale

    renderScreen(<HomeScreen />);

    // Wait for metrics to load from SQLite
    await waitFor(() => {
      expect(screen.getByText("Chiffre d'affaires")).toBeTruthy();
      expect(screen.getByText("240")).toBeTruthy();
    });
  });

  it("displays low stock alerts when products are below minimum threshold", async () => {
    await seedTestBusinessProfile("Mon Dukkan");
    // Seed a product with stock 2 (below min threshold 10)
    await seedTestProduct({
      name: "Low Stock Juice",
      stock_quantity: 2,
      minimum_stock_quantity: 10,
    });

    renderScreen(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("Low Stock Juice").length).toBeGreaterThan(0);
    });
  });

  it("navigates on Quick Action press", async () => {
    renderScreen(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("Nouvelle vente")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Nouvelle vente"));
    expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/sell");
  });
});
