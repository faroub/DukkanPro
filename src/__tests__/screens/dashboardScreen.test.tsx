import React from "react";
import { fireEvent } from "@testing-library/react-native";

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

    const screen = await renderScreen(<HomeScreen />);

    expect(await screen.findByText("Chiffre d'affaires")).toBeTruthy();
    expect(await screen.findByText("240")).toBeTruthy();
  });

  it("displays low stock alerts when products are below minimum threshold", async () => {
    await seedTestBusinessProfile("Mon Dukkan");
    await seedTestProduct({
      name: "Low Stock Juice",
      stock_quantity: 2,
      minimum_stock_quantity: 10,
    });

    const screen = await renderScreen(<HomeScreen />);

    const elements = await screen.findAllByText("Low Stock Juice");
    expect(elements.length).toBeGreaterThan(0);
  });

  it("navigates on Quick Action press", async () => {
    const screen = await renderScreen(<HomeScreen />);

    const quickAction = await screen.findByText("Nouvelle vente");
    fireEvent.press(quickAction);
    expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/sell");
  });
});
