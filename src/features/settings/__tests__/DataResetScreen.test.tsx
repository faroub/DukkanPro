/**
 * DataResetScreen — behavioral tests for the type-to-confirm hard-reset gate.
 *
 * The gate is rendered with React Native Testing Library against the real
 * in-memory SQLite database: the hard reset must stay unreachable until the
 * typed text matches the stored business name exactly, and once the
 * confirmation alert is accepted every table must be empty.
 */
import React from "react";
import { Alert } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { DataResetScreen } from "../DataResetScreen";
import {
  renderScreen,
  resetTestDb,
  resetMockRouter,
  seedTestBusinessProfile,
  seedTestProduct,
} from "@/testing/screenTestHarness";
import { executeAll } from "@/database/database";

const SHOP_NAME = "Reset Gate Shop";

async function productCount(): Promise<number> {
  const rows = await executeAll<{ c: number }>(
    "SELECT COUNT(*) AS c FROM products",
  );
  return rows[0]?.c ?? 0;
}

async function tableIsEmpty(table: string): Promise<boolean> {
  const rows = await executeAll<{ c: number }>(
    `SELECT COUNT(*) AS c FROM ${table}`,
  );
  return (rows[0]?.c ?? 0) === 0;
}

/** True when the hard-reset action with the given label is currently disabled. */
async function resetButtonDisabled(label: RegExp): Promise<boolean> {
  return waitFor(async () => {
    const state = screen.getByLabelText(label).props.accessibilityState;
    expect(state).toBeDefined();
    return state.disabled as boolean;
  }, { timeout: 4000 });
}

/**
 * The Alert mock swallows the native dialog; find the confirmation dialog
 * (the one whose button carries an onPress) and invoke the confirm action
 * directly so the observable behavior (the reset) still runs.
 */
async function confirmPressedAlert(): Promise<void> {
  await waitFor(() => {
    const confirmButtons = (Alert.alert as jest.Mock).mock.calls.flatMap(
      ([, , buttons]) => (buttons ?? []).filter((b: any) => b?.onPress),
    );
    expect(confirmButtons.length).toBeGreaterThan(0);
    confirmButtons[0].onPress();
  });
}

describe("DataResetScreen hard-reset gate (F13)", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(async () => {
    resetMockRouter();
    await resetTestDb();
    await seedTestBusinessProfile(SHOP_NAME);
    await seedTestProduct({ name: "Gate Product", sku: "GATE-1" });
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("keeps the hard reset buttons disabled while the typed name does not match", async () => {
    await renderScreen(<DataResetScreen />);

    const nameInput = await screen.findByPlaceholderText(/Saisissez/u);

    // Before any input the gate is closed on both hard-reset actions.
    expect(await resetButtonDisabled(/tout supprimer/i)).toBe(true);
    expect(await resetButtonDisabled(/réinitialiser et retourner/i)).toBe(true);

    // Typing a wrong name keeps the gate closed and shows the mismatch state.
    fireEvent.changeText(nameInput, "wrong name");
    await waitFor(() =>
      expect(screen.getByText(/non conforme/i)).toBeTruthy(),
    );
    expect(await resetButtonDisabled(/tout supprimer/i)).toBe(true);

    // Nothing was reset: the seeded product is still in the database.
    expect(await productCount()).toBeGreaterThan(0);
  });

  it("runs the hard reset only after the exact name is typed and confirmed", async () => {
    await renderScreen(<DataResetScreen />);

    const nameInput = await screen.findByPlaceholderText(/Saisissez/u);
    fireEvent.changeText(nameInput, SHOP_NAME);

    // Once the name matches exactly, the gate opens.
    await waitFor(async () => {
      expect(
        screen.getByLabelText(/tout supprimer/i).props.accessibilityState
          ?.disabled,
      ).toBe(false);
    });

    fireEvent.press(screen.getByLabelText(/tout supprimer/i));
    await confirmPressedAlert();

    // The confirmation flow wiped the app-data tables.
    await waitFor(async () => {
      for (const table of [
        "products",
        "customers",
        "sales",
        "sale_items",
        "customer_payments",
        "inventory_movements",
        "business_profiles",
      ]) {
        expect(await tableIsEmpty(table)).toBe(true);
      }
    });
  });

  it("does not open the confirmation dialog when the name does not match", async () => {
    await renderScreen(<DataResetScreen />);

    const nameInput = await screen.findByPlaceholderText(/Saisissez/u);
    fireEvent.changeText(nameInput, "NOT-" + SHOP_NAME);
    await waitFor(() =>
      expect(screen.getByText(/non conforme/i)).toBeTruthy(),
    );

    // The button stays disabled; a disabled press never reaches the handler.
    fireEvent.press(screen.getByLabelText(/tout supprimer/i));
    expect(alertSpy).not.toHaveBeenCalled();
    expect(await productCount()).toBeGreaterThan(0);
  });
});
