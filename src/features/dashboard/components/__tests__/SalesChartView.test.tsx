/**
 * SalesChartView (native) — renders the dashboard chart with plain Views.
 * jest-expo resolves ./SalesChartView to the native .tsx (no `web` platform),
 * so these tests exercise the pure-React-Native renderer, not recharts.
 */
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { SalesChartView } from "../SalesChartView";

const data = [
  { date: "2026-09-01", label: "Sept 1", totalCentimes: 10000, amount: 100, isToday: false },
  { date: "2026-09-02", label: "Sept 2", totalCentimes: 30000, amount: 300, isToday: true },
  { date: "2026-09-03", label: "Sept 3", totalCentimes: 20000, amount: 200, isToday: false },
];

describe("SalesChartView (native)", () => {
  it("renders bar mode with the peak selected by default", async () => {
    const { getByText } = await render(
      <SalesChartView data={data} chartType="bar" />,
    );

    // Peak (300 DZD) is preselected in the readout
    expect(getByText("300 DZD")).toBeTruthy();
    expect(getByText("Sept 2 (2026-09-02)")).toBeTruthy();
  });

  it("renders area mode without crashing", async () => {
    const { getByText } = await render(
      <SalesChartView data={data} chartType="area" />,
    );

    expect(getByText("300 DZD")).toBeTruthy();
  });

  it("updates the readout when a point is tapped", async () => {
    const { getAllByRole, getByText } = await render(
      <SalesChartView data={data} chartType="bar" />,
    );

    fireEvent.press(getAllByRole("button")[0]);

    expect(getByText("100 DZD")).toBeTruthy();
    expect(getByText("Sept 1 (2026-09-01)")).toBeTruthy();
  });
});
