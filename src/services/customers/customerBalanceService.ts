/**
 * customerBalanceService — Customer debt and payment service
 *
 * Rules:
 * - Debt = valid unpaid sale balances minus recorded payments
 * - Cancelled and returned sales are excluded from debt calculation
 * - Debt is calculated dynamically from sales and payments (no mutable field)
 * - Overpayment is blocked in MVP
 * - All financial changes use SQLite transactions
 */

import {
    executeRead,
    executeWrite,
    getDatabase,
    transaction,
} from "@/database/database";
import { CustomerPayment, Sale } from "@/types/entities";

/**
 - Retrieve all sales for a customer, optionally filtered by status.
 - Completed sales count toward debt.
 - Cancelled and returned sales are excluded.
 */
async function getSalesByCustomer(
  customerId: number,
  statusFilter?: "completed" | "cancelled" | "refunded" | "returned",
): Promise<Sale[]> {
  const filter: Record<string, any> = {};

  if (statusFilter) {
    filter.status = statusFilter;
  }

  // Note: The saleRepository.getByCustomerId passes customerId via filters
  // We'll implement a direct query here for flexibility
  const rows: any[] = await executeRead(
    // language=SQLite
    `SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
             s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
             s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at
       FROM sales s
       WHERE s.customer_id = ?
       ORDER BY s.sold_at DESC`,
    [customerId],
  );

  const sales: Sale[] = rows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    status: r.status,
    subtotal_centimes: r.subtotal_centimes,
    discount_centimes: r.discount_centimes,
    total_centimes: r.total_centimes,
    amount_paid_centimes: r.amount_paid_centimes,
    remaining_balance_centimes: r.remaining_balance_centimes,
    payment_method: r.payment_method as
      | "cash"
      | "electronic"
      | "mixed"
      | "partial"
      | "credit",
    note: r.note,
    sold_at: r.sold_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  // Apply client-side filter if needed (for excluding cancelled/returned)
  if (statusFilter) {
    return sales.filter((sale) => sale.status === statusFilter);
  }

  return sales;
}

/**
 - Retrieve all customer payments from the customer_payments table.
 */
export async function getCustomerPayments(
  customerId: number,
): Promise<CustomerPayment[]> {
  const rows: any[] = await executeRead(
    // language=SQLite
    `SELECT cp.id, cp.customer_id, cp.amount_centimes, cp.payment_method,
             cp.note, cp.paid_at, cp.created_at
       FROM customer_payments cp
      WHERE cp.customer_id = ?
      ORDER BY cp.paid_at DESC`,
    [customerId],
  );

  return rows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    amount_centimes: r.amount_centimes,
    payment_method: r.payment_method as
      | "cash"
      | "electronic"
      | "mixed"
      | "partial"
      | "credit",
    note: r.note,
    paid_at: r.paid_at,
    created_at: r.created_at,
  }));
}

/**
 - Calculate the customer's current debt.
 -
 - Debt = sum of valid unpaid sale balances minus recorded payments.
 - A "valid unpaid sale" is a completed sale with remaining_balance_centimes > 0
   (or total_centimes > amount_paid_centimes).
 - Cancelled and returned sales are explicitly excluded.
 -
 - @param customerId - The customer's ID
 - @returns Debt in centimes (integer, >= 0)
 */
export async function getCustomerDebt(customerId: number): Promise<number> {
  // 1. Get all completed sales for this customer
  const completedSales = await getSalesByCustomer(customerId, "completed");

  // 2. Sum the remaining balances from completed sales
  //    (use remaining_balance_centimes if > 0, otherwise 0)
  const totalSaleBalance = completedSales.reduce(
    (sum, sale) => sum + Math.max(0, sale.remaining_balance_centimes),
    0,
  );

  // 3. Get all recorded payments for this customer
  const payments = await getCustomerPayments(customerId);

  // 4. Sum all payment amounts
  const totalPaid = payments.reduce(
    (sum, payment) => sum + payment.amount_centimes,
    0,
  );

  // 5. Debt = total outstanding balance from sales - total payments
  //    Ensure debt cannot be negative (block overpayment in MVP)
  const debt = Math.max(0, totalSaleBalance - totalPaid);

  return debt;
}

/**
 - Check if a payment can be recorded for a customer.
 -
 - Blocks overpayment in MVP: payment cannot exceed the customer's current debt.
 -
 - @param customerId - The customer's ID
 - @param amount - Payment amount in centimes
 - @returns True if payment can be recorded, false if it would overpay
 */
export async function canRecordPayment(
  customerId: number,
  amount: number,
): Promise<boolean> {
  if (amount <= 0) {
    return false;
  }

  const debt = await getCustomerDebt(customerId);

  // Payment is allowed if it does not exceed the current debt
  return amount <= debt;
}

/**
 - Record a payment for a customer in a single SQLite transaction.
 -
 - Payment rules:
   - Amount must be positive (enforced by canRecordPayment check)
   - Payment method: cash or electronic (MVP)
   - Note is optional
   - Confirmation is handled by the caller
 - Block overpayment in MVP
 -
 - @param customerId - The customer's ID
 - @param amount - Payment amount in centimes
 - @param method - Payment method: "cash" | "electronic"
 - @param note - Optional payment note
 - @returns The recorded CustomerPayment, or null if payment was blocked
 */
export async function recordPayment(
  customerId: number,
  amount: number,
  method: "cash" | "electronic",
  note?: string,
): Promise<CustomerPayment | null> {
  // Check if payment can be recorded (blocks overpayment)
  const canPay = await canRecordPayment(customerId, amount);
  if (!canPay) {
    return null;
  }

  const now = new Date().toISOString();

  const db = await getDatabase();
  const paymentId = await transaction(db, async () =>
    executeWrite(
      // language=SQLite
      `INSERT INTO customer_payments
         (customer_id, amount_centimes, payment_method, note, paid_at, created_at)
       VALUES
         (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [customerId, amount, method, note],
    ),
  );

  // Return the newly created payment record
  return {
    id: paymentId,
    customer_id: customerId,
    amount_centimes: amount,
    payment_method: method,
    note: note ?? null,
    paid_at: now,
    created_at: now,
  };
}

/**
 - Get summary of a customer's financial status.
 -
 - @param customerId - The customer's ID
 - @returns Debt summary object
 */
export async function getCustomerBalanceSummary(customerId: number) {
  const debt = await getCustomerDebt(customerId);
  const payments = await getCustomerPayments(customerId);

  return {
    customerId,
    debt_centimes: debt,
    total_paid_centime: payments.reduce((sum, p) => sum + p.amount_centimes, 0),
    paymentCount: payments.length,
  };
}
