import React from "react";
import { act } from "@testing-library/react-native";
import { showToast, ToastHost, _resetToastForTesting } from "../use-toast";
import { renderScreen } from "@/testing/screenTestHarness";

describe("use-toast / showToast", () => {
  beforeEach(() => {
    _resetToastForTesting();
  });

  it("renders toast message when showToast is called", async () => {
    const screen = await renderScreen(<ToastHost />);

    await act(async () => {
      showToast("Settings Saved", { duration: 500 });
    });

    const element = await screen.findByText("Settings Saved");
    expect(element).toBeTruthy();

    screen.unmount();
  });

  it("replaces existing toast message when new toast is emitted", async () => {
    const screen = await renderScreen(<ToastHost />);

    await act(async () => {
      showToast("First Message", { duration: 500 });
    });

    const firstElement = await screen.findByText("First Message");
    expect(firstElement).toBeTruthy();

    await act(async () => {
      showToast("Second Message", { duration: 500 });
    });

    const secondElement = await screen.findByText("Second Message");
    expect(secondElement).toBeTruthy();
    expect(screen.queryByText("First Message")).toBeNull();

    screen.unmount();
  });
});
