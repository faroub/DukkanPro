import React from "react";
import { RecordRefundScreen } from "@/features/customers/RecordRefundScreen";
import {
  renderScreen,
  resetTestDb,
  seedTestCustomer,
} from "@/testing/screenTestHarness";
import {
  create as createSale,
  cancel as cancelSale,
} from "@/database/repositories/saleRepository";
import { create as createProduct } from "@/database/repositories/productRepository";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { getCustomerCredit, getCustomerDebt, recordRefund } from "@/services/customers/customerBalanceService";
import { CustomerDetailScreen } from "@/features/customers/CustomerDetailScreen";
import { getDatabase } from "@/database/database";
import { triggerMockFocus, setMockSearchParams } from "@/testing/screenTestHarness";

/**
 * Helper: create a customer whose credit is exactly `creditCentimes`
 * (via a fully-paid sale that is then cancelled).
 */
async function seedCustomerWithCredit(creditCentimes: number) {
  const product = await createProduct({
    name: "Credit Item",
    sku: `CREDIT-${creditCentimes}`,
    sale_price_centimes: creditCentimes,
    cost_price_centimes: Math.round(creditCentimes / 2),
    stock_quantity: 100,
    minimum_stock_quantity: 0,
    unit: "pcs",
  } as any);
  const customer = await seedTestCustomer({
    name: "Refund Tester",
    phone: `05${String(creditCentimes).padStart(8, "0")}`,
  });
  const sale = await createSale({
    customerId: customer.id,
    paymentMethod: "cash",
    items: [{ productId: product.id, quantity: 1, unitSalePriceCentimes: creditCentimes }],
    amountPaidCentimes: creditCentimes,
  });
  await cancelSale(sale.id, "test");
  return customer;
}

describe("RecordRefundScreen", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("renders the customer's exact credit and defaults the amount to it (centimes preserved)", async () => {
    // 10.50 DZD of credit — must NOT be rounded to whole dinars.
    const customer = await seedCustomerWithCredit(1050);

    const screen = await renderScreen(
      <RecordRefundScreen customerId={customer.id} />
    );

    // The credit card shows the exact amount (app formatter trims trailing
    // zeros: 10.50 DZD displays as "10,5 DZD").
    await waitFor(() => {
      expect(screen.getByText("10,5 DZD")).toBeTruthy();
    });

    // The amount input defaults to the exact credit in centime-exact form
    // ("10,50"), so the full-amount chip is active.
    const amountInput = screen.getByPlaceholderText("0");
    expect(amountInput.props.value).toBe("10,50");

    // Confirm is enabled with the exact default amount.
    const confirm = screen.getByText(/Confirmer le remboursement/i);
    expect(confirm).toBeTruthy();
  });

  it("refunds a fractional credit exactly, leaving zero credit", async () => {
    const customer = await seedCustomerWithCredit(1050);

    const screen = await renderScreen(
      <RecordRefundScreen customerId={customer.id} />
    );
    await waitFor(() => {
      expect(screen.getByText("10,5 DZD")).toBeTruthy();
    });

    // Press the full-amount quick fill (exact centimes), then confirm.
    const fullChip = await screen.findByText(/Montant total/i);
    fireEvent.press(fullChip);

    const confirm = await screen.findByText(/Confirmer le remboursement/i);
    fireEvent.press(confirm);

    // The refund was recorded for exactly 1050 centimes.
    await waitFor(async () => {
      expect(await getCustomerCredit(customer.id)).toBe(0);
    });
  });

  it("supports credits smaller than one dinar", async () => {
    // 0.50 DZD of credit.
    const customer = await seedCustomerWithCredit(50);

    const screen = await renderScreen(
      <RecordRefundScreen customerId={customer.id} />
    );

    await waitFor(() => {
      expect(screen.getByText("0,5 DZD")).toBeTruthy();
    });

    // The input defaults to the centime-exact amount.
    const amountInput = screen.getByPlaceholderText("0");
    expect(amountInput.props.value).toBe("0,50");

    const fullChip = await screen.findByText(/Montant total/i);
    fireEvent.press(fullChip);

    const confirm = await screen.findByText(/Confirmer le remboursement/i);
    fireEvent.press(confirm);

    await waitFor(async () => {
      expect(await getCustomerCredit(customer.id)).toBe(0);
    });
  });

  it("blocks refunds exceeding the available credit and disables confirm", async () => {
    const customer = await seedCustomerWithCredit(5000);

    const screen = await renderScreen(
      <RecordRefundScreen customerId={customer.id} />
    );

    // Credit of 50.00 DZD displays as "50 DZD" (trailing zeros trimmed).
    await waitFor(() => {
      expect(screen.getByText("50 DZD")).toBeTruthy();
    });

    // Type an amount far above the credit.
    const input = screen.getByPlaceholderText("0");
    fireEvent.changeText(input, "99,00");

    await waitFor(() => {
      expect(
        screen.getByText(/dépasse le crédit client disponible/i)
      ).toBeTruthy();
    });

    // Confirm is disabled while exceeding (TouchableOpacity surfaces this
    // via accessibilityState.disabled on the host node).
    const confirm = screen.getByText(/Confirmer le remboursement/i);
    let node: any = confirm;
    let isDisabled = false;
    while (node) {
      if (
        node.props?.disabled === true ||
        node.props?.accessibilityState?.disabled === true
      ) {
        isDisabled = true;
        break;
      }
      node = node.parent;
    }
    expect(isDisabled).toBe(true);

    // No refund was recorded.
    expect(await getCustomerCredit(customer.id)).toBe(5000);
  });

  it("records a partial refund exactly and refreshes the detail screen on refocus", async () => {
    const customer = await seedCustomerWithCredit(1050);

    const screen = await renderScreen(
      <RecordRefundScreen customerId={customer.id} />
    );
    await waitFor(() => {
      expect(screen.getByText("10,5 DZD")).toBeTruthy();
    });

    const input = screen.getByPlaceholderText("0");

    // Change the amount away from the default, then press the full-amount
    // quick fill — it must restore the exact centime amount in the input.
    fireEvent.changeText(input, "3,25");
    const fullChip = await screen.findByText(/Montant total/i);
    fireEvent.press(fullChip);
    await waitFor(() => {
      expect(input.props.value).toBe("10,50");
    });

    // Now enter a partial amount and confirm.
    fireEvent.changeText(input, "3,25");
    const confirm = await screen.findByText(/Confirmer le remboursement/i);
    fireEvent.press(confirm);

    // Exactly one refund of -325 centimes with the selected method.
    const db = await getDatabase();
    await waitFor(async () => {
      const rows: Array<{ amount_centimes: number; payment_method: string }> =
        await db.getAllAsync(
          `SELECT amount_centimes, payment_method FROM customer_payments
           WHERE customer_id = ? AND amount_centimes < 0`,
          [customer.id]
        );
      expect(rows).toHaveLength(1);
      expect(rows[0].amount_centimes).toBe(-325);
      expect(rows[0].payment_method).toBe("cash");
    });

    // Remaining credit is exact; no debt is created.
    await waitFor(async () => {
      expect(await getCustomerCredit(customer.id)).toBe(725);
      expect(await getCustomerDebt(customer.id)).toBe(0);
    });

    // The customer detail screen refreshes when it regains focus —
    // no remount, only the focus effect fires. Render it with the current
    // credit (725), then refund more in the background and refocus.
    const detail = await renderScreen(
      <CustomerDetailScreen customerId={customer.id} />
    );
    setMockSearchParams({ id: String(customer.id) });
    await waitFor(() => {
      expect(detail.getAllByText("7,25 DZD").length).toBeGreaterThan(0);
    });

    // Another refund happens while the detail screen would be in the
    // background: 700 centimes, leaving 25 centimes (0,25 DZD).
    const refunded = await recordRefund(customer.id, 700, "cash");
    expect(refunded).not.toBeNull();
    expect(await getCustomerCredit(customer.id)).toBe(25);
    expect(detail.queryAllByText("0,25 DZD")).toHaveLength(0); // still stale

    // The user returns to the detail screen — focus fires without remount.
    triggerMockFocus();
    await waitFor(() => {
      expect(detail.getAllByText("0,25 DZD").length).toBeGreaterThan(0);
    });
  });

  it("shows the no-credit state for customers without credit", async () => {
    const customer = await seedTestCustomer({
      name: "No Credit",
      phone: "0500000001",
    });

    const screen = await renderScreen(
      <RecordRefundScreen customerId={customer.id} />
    );

    await waitFor(() => {
      expect(screen.getByText(/pas de crédit à rembourser/i)).toBeTruthy();
    });
  });
});
