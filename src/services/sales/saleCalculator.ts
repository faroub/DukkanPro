/**
 * saleCalculator — Pure calculations for sale finances.
 *
 * All money is integer centimes. No floating-point arithmetic.
 * Profit uses the historical cost_price_centimes snapshotted on the sale item,
 * never the current product cost.
 */

/**
 * Calculate the subtotal from cart items.
 * Each item: { productId, quantity, unitSalePriceCentimes }
 */
export function calculateSubtotal(items: Array<{ quantity: number; unitSalePriceCentimes: number }>): number {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.quantity * item.unitSalePriceCentimes;
  }
  return subtotal;
}

/**
 * Calculate the total after discount.
 * subtotal and discount are in centimes (integer).
 */
export function calculateTotal(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - discount);
}

/**
 * Calculate the change from a payment.
 * amountPaid and total are in centimes (integer).
 */
export function calculateChange(amountPaid: number, total: number): number {
  return Math.max(0, amountPaid - total);
}

/**
 * Calculate the profit from sale items.
 * Profit = revenue (sale price) - historical cost (cost_price_centimes snapshot).
 * Each saleItem: { quantity, unitSalePriceCentimes, unitCostPriceCentimes }
 * Returns profit in centimes (integer).
 */
export function calculateProfit(saleItems: Array<{ quantity: number; unitSalePriceCentimes: number; unitCostPriceCentimes: number }>): number {
  let profit = 0;
  for (const item of saleItems) {
    const revenue = item.quantity * item.unitSalePriceCentimes;
    const cost = item.quantity * item.unitCostPriceCentimes;
    profit += revenue - cost;
  }
  return profit;
}