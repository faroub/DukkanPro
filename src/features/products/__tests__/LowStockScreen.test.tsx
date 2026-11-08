import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";

import { LowStockScreen } from "../LowStockScreen";
import {
  renderScreen,
  resetTestDb,
  seedTestProduct,
  resetMockRouter,
} from "@/testing/screenTestHarness";
import { adjustStock } from "@/database/repositories/productRepository";

// Mock only adjustStock so the test can assert exactly which product id the
// screen targets. All other exports (getAll, create, ...) stay real so the
// screen still loads from the in-memory SQLite database.
jest.mock("@/database/repositories/productRepository", () => ({
  ...jest.requireActual("@/database/repositories/productRepository"),
  adjustStock: jest.fn(),
}));

const adjustStockMock = adjustStock as jest.MockedFunction<typeof adjustStock>;

describe("LowStockScreen", () => {
  beforeEach(async () => {
    resetMockRouter();
    adjustStockMock.mockReset();
    adjustStockMock.mockResolvedValue({} as any);
    await resetTestDb();
  });

  it("shows the empty state and no mock products when the database has no low-stock rows", async () => {
    const screen = await renderScreen(<LowStockScreen />);

    // The existing empty state renders (harness locale defaults to fr)
    const title = await screen.findByText(/aucun produit en stock bas/i);
    expect(title).toBeTruthy();

    // None of the previously hardcoded mock products may appear
    expect(screen.queryByText("Lait Candia 1L")).toBeNull();
    expect(screen.queryByText("Café Moulu 250g")).toBeNull();
    expect(screen.queryByText("Huile Elio 2L")).toBeNull();
  });

  it("targets the real database product when confirming a quick restock", async () => {
    const product = await seedTestProduct({
      name: "Real Restock Milk",
      stock_quantity: 2,
      minimum_stock_quantity: 10,
    });

    const screen = await renderScreen(<LowStockScreen />);

    // The seeded product card appears
    await screen.findByText("Real Restock Milk");

    // Open the quick restock modal for that product
    const addStockButton = await screen.getByLabelText(
      `Add stock for Real Restock Milk`,
    );
    fireEvent.press(addStockButton);

    // Confirm the restock
    const receiveButton = await screen.findByLabelText("Receive Units");
    fireEvent.press(receiveButton);

    // adjustStock must be called with the real database product id
    await waitFor(() => {
      expect(adjustStockMock).toHaveBeenCalledTimes(1);
    });
    expect(adjustStockMock).toHaveBeenCalledWith(
      product.id,
      expect.any(Number),
      expect.any(String),
    );
    expect(adjustStockMock.mock.calls[0][0]).toBeGreaterThan(0);
  });
});
