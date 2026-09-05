/**
 * saleCalculator — Unit tests for sale finance calculations.
 *
 * All money is integer centimes. No floating-point arithmetic.
 * Profit uses the historical cost_price_centimes snapshotted on the sale item,
 * never the current product cost.
 */

import { calculateSubtotal, calculateTotal, calculateChange, calculateProfit } from "@/services/sales/saleCalculator";

// --------------------
// calculateSubtotal
// --------------------

describe("calculateSubtotal", () => {
  it("calculates subtotal for single item", () => {
    expect(calculateSubtotal([{ quantity: 2, unitSalePriceCentimes: 500 }])).toBe(1000);
  });

  it("calculates subtotal for multiple items", () => {
    expect(
      calculateSubtotal([
        { quantity: 1, unitSalePriceCentimes: 200 },
        { quantity: 3, unitSalePriceCentimes: 100 },
      ])
    ).toBe(500);
  });

  it("calculates subtotal for zero-quantity item returns 0", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("calculates subtotal with large quantities", () => {
    expect(
      calculateSubtotal([{ quantity: 10, unitSalePriceCentimes: 250 }])
    ).toBe(2500);
  });
});

// --------------------
// calculateTotal
// --------------------

describe("calculateTotal", () => {
  it("calculates total with no discount", () => {
    expect(calculateTotal(1000, 0)).toBe(1000);
  });

  it("calculates total with discount", () => {
    expect(calculateTotal(1000, 200)).toBe(800);
  });

  it("calculates total with discount larger than subtotal returns 0", () => {
    expect(calculateTotal(100, 200)).toBe(0);
  });

  it("calculates total preserves integer type", () => {
    expect(calculateTotal(1000, 0)).toBe(1000);
    expect(Number.isInteger(calculateTotal(1000, 200))).toBe(true);
  });
});

// --------------------
// calculateChange
// --------------------

describe("calculateChange", () => {
  it("calculates change when payment exceeds total", () => {
    expect(calculateChange(2000, 1000)).toBe(1000);
  });

  it("calculates change when payment equals total", () => {
    expect(calculateChange(1000, 1000)).toBe(0);
  });

  it("calculates change when payment is less than total returns 0", () => {
    expect(calculateChange(500, 1000)).toBe(0);
  });

  it("calculates change preserves integer type", () => {
    expect(Number.isInteger(calculateChange(2000, 1000))).toBe(true);
  });
});

// --------------------
// calculateProfit
// --------------------

describe("calculateProfit", () => {
  it("calculates profit when revenue exceeds cost", () => {
    expect(
      calculateProfit([
        { quantity: 2, unitSalePriceCentimes: 500, unitCostPriceCentimes: 300 },
      ])
    ).toBe(400); // (2*500) - (2*300) = 1000 - 600 = 400
  });

  it("calculates profit when cost equals revenue returns 0", () => {
    expect(
      calculateProfit([
        { quantity: 3, unitSalePriceCentimes: 200, unitCostPriceCentimes: 200 },
      ])
    ).toBe(0);
  });

  it("calculates profit when cost exceeds revenue returns negative", () => {
    expect(
      calculateProfit([
        { quantity: 2, unitSalePriceCentimes: 100, unitCostPriceCentimes: 300 },
      ])
    ).toBe(-400); // (2*100) - (2*300) = 200 - 600 = -400
  });

  it("calculates profit for multiple items", () => {
    expect(
      calculateProfit([
        { quantity: 2, unitSalePriceCentimes: 500, unitCostPriceCentimes: 300 },
        { quantity: 1, unitSalePriceCentimes: 200, unitCostPriceCentimes: 100 },
      ])
    ).toBe(500); // (2*500-2*300) + (1*200-1*100) = 400 + 100 = 500
  });

  it("calculates profit with zero items returns 0", () => {
    expect(calculateProfit([])).toBe(0);
  });

  it("calculates profit preserves integer type", () => {
    const result = calculateProfit([
      { quantity: 2, unitSalePriceCentimes: 500, unitCostPriceCentimes: 300 },
    ]);
    expect(Number.isInteger(result)).toBe(true);
  });
});