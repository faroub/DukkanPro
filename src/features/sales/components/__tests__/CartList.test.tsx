import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderScreen, resetTestDb, seedTestProduct } from "@/testing/screenTestHarness";
import { CartList } from "../CartList";

describe("CartList Component Harness", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("expands discount input field on Android when discount button is pressed", async () => {
    const product = await seedTestProduct({ name: "Flour 1kg", sale_price_centimes: 10000 });
    const setDiscountMock = jest.fn();

    const screen = await renderScreen(
      <CartList
        items={[{ product, quantity: 1 }]}
        onRemove={jest.fn()}
        onUpdateQuantity={jest.fn()}
        subtotal={10000}
        discount={0}
        total={10000}
        setDiscount={setDiscountMock}
      />
    );

    // Tapping discount button
    const toggleButton = await screen.findByTestId("toggle-discount-btn");
    fireEvent.press(toggleButton);

    // Assert the inline TextInput becomes visible
    const discountInput = await screen.findByTestId("discount-input-field");
    expect(discountInput).toBeTruthy();

    // Type "10" DZD (1000 centimes) and submit
    fireEvent.changeText(discountInput, "10");

    const applyButton = await screen.findByTestId("apply-discount-btn");
    fireEvent.press(applyButton);

    expect(setDiscountMock).toHaveBeenCalledWith(1000);
  });
});
