import React from "react";
import { Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";

import { CheckoutSheet } from "../CheckoutSheet";
import {
  renderScreen,
  resetTestDb,
  seedTestProduct,
  seedTestCustomer,
  resetMockRouter,
} from "@/testing/screenTestHarness";
import { useCartStore } from "@/stores/cartStore";
import { update as updateProduct } from "@/database/repositories/productRepository";

describe("CheckoutSheet Component Money Math & Re-validation Harness", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(async () => {
    resetMockRouter();
    await resetTestDb();
    useCartStore.getState().clearCart();
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("re-validates live prices from SQLite and updates display total when cart price is stale", async () => {
    // 1. Seed product in SQLite at 100 DZD (10000 centimes)
    const product = await seedTestProduct({
      name: "Price Changed Juice",
      sale_price_centimes: 10000,
    });

    // 2. Add item to cart at initial price 100 DZD
    useCartStore.getState().addItemWithProduct(product, 1);

    // 3. Price in catalog is updated in SQLite to 120 DZD (12000 centimes)
    await updateProduct(product.id, { sale_price_centimes: 12000 });

    const onCheckoutMock = jest.fn();

    // 4. Render CheckoutSheet with stale cartTotal = 10000
    const screen = await renderScreen(
      <CheckoutSheet
        visible={true}
        onRequestClose={jest.fn()}
        onCheckout={onCheckoutMock}
        cartTotal={10000}
        isSaving={false}
      />
    );

    // 5. CheckoutSheet must re-fetch live price (120 DZD) from SQLite and display 120 DZD
    const totalElements = await screen.findAllByText("120 DZD");
    expect(totalElements.length).toBeGreaterThan(0);
  });

  it("calculates exact change due for cash payments", async () => {
    const product = await seedTestProduct({
      name: "Water Bottle",
      sale_price_centimes: 5000, // 50 DZD
    });

    useCartStore.getState().addItemWithProduct(product, 1);

    const screen = await renderScreen(
      <CheckoutSheet
        visible={true}
        onRequestClose={jest.fn()}
        onCheckout={jest.fn()}
        cartTotal={5000}
        isSaving={false}
      />
    );

    // Initial total 50 DZD
    const initialElements = await screen.findAllByText("50 DZD");
    expect(initialElements.length).toBeGreaterThan(0);

    // Click "+500 DZD" quick cash chip
    const add500Chip = await screen.findByText("+500 DZD");
    fireEvent.press(add500Chip);

    // Change due should now display 500 DZD
    const changeElements = await screen.findAllByText("500 DZD");
    expect(changeElements.length).toBeGreaterThan(0);
  });

  it("requires customer selection before confirming credit or partial debt sales", async () => {
    const product = await seedTestProduct({
      name: "Flour Bag",
      sale_price_centimes: 15000, // 150 DZD
    });

    useCartStore.getState().addItemWithProduct(product, 1);

    const screen = await renderScreen(
      <CheckoutSheet
        visible={true}
        onRequestClose={jest.fn()}
        onCheckout={jest.fn()}
        cartTotal={15000}
        isSaving={false}
      />
    );

    // Select Credit payment method
    const creditButtons = await screen.findAllByText("Crédit");
    fireEvent.press(creditButtons[0]);

    // Press confirm sale without selecting a customer
    const confirmButton = await screen.findByText("Confirmer la vente");
    fireEvent.press(confirmButton);

    // Alert must warn that a customer is required for debt
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/Please select a customer/i)
      );
    });
  });

  it("submits checkout with live validated items and exact amount paid", async () => {
    const customer = await seedTestCustomer({ name: "Amine Purchaser" });
    const product = await seedTestProduct({
      name: "Olive Oil 1L",
      sale_price_centimes: 20000, // 200 DZD
    });

    useCartStore.getState().addItemWithProduct(product, 1);

    const onCheckoutMock = jest.fn();

    const screen = await renderScreen(
      <CheckoutSheet
        visible={true}
        onRequestClose={jest.fn()}
        onCheckout={onCheckoutMock}
        cartTotal={20000}
        isSaving={false}
      />
    );

    // Press confirm sale
    const confirmButton = await screen.findByText("Confirmer la vente");
    fireEvent.press(confirmButton);

    // Verify onCheckout callback was invoked asynchronously with live price and exact amount
    await waitFor(() => {
      expect(onCheckoutMock).toHaveBeenCalledWith({
        method: "cash",
        amountPaid: 20000,
        rawAmountReceived: 20000,
        note: "",
        customerId: undefined,
        validatedItems: [
          {
            productId: product.id,
            quantity: 1,
            unitSalePriceCentimes: 20000,
          },
        ],
      });
    });
  });

  it("displays error banner, re-enables confirm button, and allows retry on checkout failure", async () => {
    const product = await seedTestProduct({
      name: "Retry Tea",
      sale_price_centimes: 10000, // 100 DZD
    });

    useCartStore.getState().addItemWithProduct(product, 1);

    // onCheckout rejects once with DB Error, then resolves on second call
    const onCheckoutMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("Database transaction conflict"))
      .mockResolvedValueOnce(undefined);

    const screen = await renderScreen(
      <CheckoutSheet
        visible={true}
        onRequestClose={jest.fn()}
        onCheckout={onCheckoutMock}
        cartTotal={10000}
        isSaving={false}
        error="Database transaction conflict"
      />
    );

    const confirmButton = await screen.findByText("Confirmer la vente");

    // First attempt fails
    fireEvent.press(confirmButton);

    // Assert error banner is rendered in CheckoutSheet
    const errorBanner = await screen.findByTestId("checkout-error-banner");
    expect(errorBanner).toBeTruthy();
    expect(await screen.findByText("Database transaction conflict")).toBeTruthy();

    // Assert confirm button is re-enabled for retry
    expect(confirmButton.props.accessibilityState?.disabled).toBeFalsy();

    // Second attempt (retry)
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(onCheckoutMock).toHaveBeenCalledTimes(2);
    });
  });
});
