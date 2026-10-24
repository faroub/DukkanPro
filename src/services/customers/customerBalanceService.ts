/**
 * customerBalanceService — Customer debt and payment service
 *
 * Rules:
 * - Debt = valid unpaid sale balances minus recorded payments
 * - Cancelled and returned sales are excluded from debt calculation
 * - Debt is calculated dynamically from sales and payments (no mutable field)
 * - Overpayment is blocked in MVP
 * - All financial changes use SQLite transactions and explicit tx handle passing
 */

import { type SQLiteDatabase } from "expo-sqlite";
import {
  executeRead,
  executeWrite,
  getDatabase,
  transaction,
} from "@/database/database";
import { CustomerPayment, Sale } from "@/types/entities";

/**
 * Retrieve all sales for a customer, optionally filtered by status.
 * Threading `tx` explicitly ensures queries run directly inside active transactions.
 */
async function getSalesByCustomer(
  customerId: number,
  statusFilter?: "completed" | "cancelled" | "refunded" | "returned",
  tx?: SQLiteDatabase,
): Promise<Sale[]> {
  const sql = `SELECT s.id, s.customer_id, s.status, s.subtotal_centimes, s.discount_centimes,
             s.total_centimes, s.amount_paid_centimes, s.remaining_balance_centimes,
             s.payment_method, s.note, s.sold_at, s.created_at, s.updated_at
       FROM sales s
       WHERE s.customer_id = ?
       ORDER BY s.sold_at DESC`;

  const rows: any[] = tx
    ? await executeRead(tx, sql, [customerId])
    : await executeRead(sql, [customerId]);

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

  if (statusFilter) {
    return sales.filter((sale) => sale.status === statusFilter);
  }

  return sales;
}

/**
 * Retrieve all customer payments from the customer_payments table.
 */
export async function getCustomerPayments(
  customerId: number,
  tx?: SQLiteDatabase,
): Promise<CustomerPayment[]> {
  const sql = `SELECT cp.id, cp.customer_id, cp.amount_centimes, cp.payment_method,
             cp.note, cp.paid_at, cp.created_at
       FROM customer_payments cp
      WHERE cp.customer_id = ?
      ORDER BY cp.paid_at DESC`;

  const rows: any[] = tx
    ? await executeRead(tx, sql, [customerId])
    : await executeRead(sql, [customerId]);

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
 * Calculate the customer's current debt.
 */
export async function getCustomerDebt(
  customerId: number,
  tx?: SQLiteDatabase,
): Promise<number> {
  const completedSales = await getSalesByCustomer(customerId, "completed", tx);

  const totalSaleBalance = completedSales.reduce(
    (sum, sale) => sum + Math.max(0, sale.remaining_balance_centimes),
    0,
  );

  const payments = await getCustomerPayments(customerId, tx);

  const totalPaid = payments.reduce(
    (sum, payment) => sum + payment.amount_centimes,
    0,
  );

  return Math.max(0, totalSaleBalance - totalPaid);
}

/**
 * Check if a payment can be recorded for a customer.
 */
export async function canRecordPayment(
  customerId: number,
  amount: number,
): Promise<boolean> {
  if (amount <= 0) {
    return false;
  }

  const debt = await getCustomerDebt(customerId);
  return amount <= debt;
}

/**
 * Record a payment for a customer in a single SQLite transaction.
 */
export async function recordPayment(
  customerId: number,
  amount: number,
  method: "cash" | "electronic",
  note?: string,
): Promise<CustomerPayment | null> {
  if (amount <= 0) {
    return null;
  }

  const db = await getDatabase();
  return await transaction(db, async (tx) => {
    // Re-check the debt INSIDE the transaction using explicit tx handle
    const debt = await getCustomerDebt(customerId, tx);
    if (amount > debt) {
      return null;
    }

    const paymentId = await executeWrite(
      tx,
      `INSERT INTO customer_payments
         (customer_id, amount_centimes, payment_method, note, paid_at, created_at)
       VALUES
         (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [customerId, amount, method, note],
    );

    const now = new Date().toISOString();

    return {
      id: paymentId,
      customer_id: customerId,
      amount_centimes: amount,
      payment_method: method,
      note: note ?? null,
      paid_at: now,
      created_at: now,
    };
  });
}

/**
 * Get summary of a customer's financial status.
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
