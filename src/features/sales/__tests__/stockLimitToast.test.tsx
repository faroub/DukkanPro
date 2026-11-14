import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import SellScreen from "../SellScreen";
import { renderScreen, resetTestDb, seedTestProduct } from "@/testing/screenTestHarness";
import { useCartStore } from "@/stores/cartStore";
import { showToast } from "@/components/use-toast";

jest.mock("@/components/use-toast", () => ({
  showToast: jest.fn(),
}));

describe("SellScreen Cart Stock Limit Feedback", () => {
  beforeEach(async () => {
    await resetTestDb();
    useCartStore.getState().clearCart();
    (showToast as jest.Mock).mockClear();
  });

  it("calls showToast with localized message when attempting to add product beyond available stock limit", async () => {
    // Seed product with exact stock_quantity = 2
    const product = await seedTestProduct({
      name: "Limited Juice",
      stock_quantity: 2,
    });

    const screen = await renderScreen(<SellScreen />);

    // Tap product once (adds 1 to cart)
    const addBtns = await screen.findAllByText("Ajouter");
    fireEvent.press(addBtns[0]);

    expect(useCartStore.getState().items.find((i) => i.product.id === product.id)?.quantity).toBe(1);
    expect(showToast).not.toHaveBeenCalled();

    // Tap plus button (adds 2nd unit to cart = stock limit)
    const plusBtns = await screen.findAllByLabelText("+");
    fireEvent.press(plusBtns[0]);

    expect(useCartStore.getState().items.find((i) => i.product.id === product.id)?.quantity).toBe(2);
    expect(showToast).not.toHaveBeenCalled();

    // Tap plus button 3rd time (exceeds stock limit of 2)
    fireEvent.press(plusBtns[0]);

    // Quantity remains clamped at 2
    expect(useCartStore.getState().items.find((i) => i.product.id === product.id)?.quantity).toBe(2);

    // showToast should be called with stock limit feedback
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining("Seulement 2 disponible(s) en stock."),
      );
    });
  });
});
