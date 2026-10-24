/**
 * customerBalanceService — Customer debt, credit and payment service
 *
 * Rules:
 * - Signed balance = (completed sales' remaining balances)
 *                   − (money already taken on cancelled/returned sales)
 *                   − (net customer payments: repayments positive, refunds negative)
 * - Debt   = max(0, balance)   — what the customer still owes
 * - Credit = max(0, −balance) — what the merchant owes the customer
 * - Cancelled and returned sales no longer count toward debt, but any money the
 *   customer actually paid on them (upfront checkout payment, recorded within
 *   the sale's total) surfaces as customer credit.
 * - Overpayment is blocked; refunds cannot exceed the available credit.
 * - All financial changes use SQLite transactions with explicit tx handle passing.
 * - Refunds are stored as negative customer_payments rows and are an explicit
 *   merchant action — cancellations never reverse payments automatically.
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
 * Refund rows carry a negative amount_centimes.
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
 * Compute the customer's SIGNED balance in centimes.
 *
 *   balance = Σ(completed sales' remaining_balance)
 *           − Σ(min(amount_paid, total) of cancelled/returned sales)
 *           − Σ(net customer payments)
 *
 * - Positive: the customer owes the merchant (debt).
 * - Negative: the merchant owes the customer (credit), e.g. after cancelling a
 *   sale the customer had already paid for (upfront or via repayments).
 * - Cancelled/returned sales contribute only the money actually taken on them,
 *   clamped to the sale total (guards against legacy over-tendered rows).
 */
export async function getCustomerBalance(
  customerId: number,
  tx?: SQLiteDatabase,
): Promise<number> {
  const sql = `SELECT
      COALESCE((SELECT SUM(remaining_balance_centimes)
                FROM sales
                WHERE customer_id = ? AND status = 'completed'), 0) AS completed_remaining,
      COALESCE((SELECT SUM(MIN(amount_paid_centimes, total_centimes))
                FROM sales
                WHERE customer_id = ? AND status IN ('cancelled', 'returned')), 0) AS cancelled_taken,
      COALESCE((SELECT SUM(amount_centimes)
                FROM customer_payments
                WHERE customer_id = ?), 0) AS net_payments`;

  const rows: any[] = tx
    ? await executeRead(tx, sql, [customerId, customerId, customerId])
    : await executeRead(sql, [customerId, customerId, customerId]);

  const { completed_remaining, cancelled_taken, net_payments } = rows[0];

  return (
    (completed_remaining as number) -
    (cancelled_taken as number) -
    (net_payments as number)
  );
}

/**
 * The customer's current debt (what they owe the merchant), >= 0.
 */
export async function getCustomerDebt(
  customerId: number,
  tx?: SQLiteDatabase,
): Promise<number> {
  const balance = await getCustomerBalance(customerId, tx);
  return Math.max(0, balance);
}

/**
 * The customer's current credit (what the merchant owes the customer), >= 0.
 * Created when a sale the customer already paid for is cancelled or returned.
 */
export async function getCustomerCredit(
  customerId: number,
  tx?: SQLiteDatabase,
): Promise<number> {
  const balance = await getCustomerBalance(customerId, tx);
  return Math.max(0, -balance);
}

/**
 * Calculate the total outstanding customer debt for the whole shop in ONE grouped query.
 * Replaces N+1 per-customer queries with a single atomic aggregation.
 */
export async function getTotalShopDebt(tx?: SQLiteDatabase): Promise<number> {
  const sql = `
    SELECT COALESCE(SUM(c_debt), 0) AS total_debt
      FROM (
        SELECT c.id,
               MAX(0, COALESCE(s.total_sales_balance, 0) - COALESCE(p.total_payments, 0)) AS c_debt
          FROM customers c
          LEFT JOIN (
            SELECT customer_id, SUM(remaining_balance_centimes) AS total_sales_balance
              FROM sales
             WHERE status = 'completed' AND remaining_balance_centimes > 0
             GROUP BY customer_id
          ) s ON s.customer_id = c.id
          LEFT JOIN (
            SELECT customer_id, SUM(amount_centimes) AS total_payments
              FROM customer_payments
             GROUP BY customer_id
          ) p ON p.customer_id = c.id
         WHERE c.is_active = 1
      )
  `;

  const rows: any[] = tx
    ? await executeRead<{ total_debt: number }>(tx, sql)
    : await executeRead<{ total_debt: number }>(sql);

  return rows[0]?.total_debt ?? 0;
}

/**
 * Check if a payment can be recorded for a customer.
 * Blocks overpayment: the payment cannot exceed the customer's current debt.
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
 * Returns null (no row written) when the payment would overpay the debt.
 */
export async function recordPayment(
  customerId: number,
  amount: number,
  method: "cash" | "electronic",
  note?: string,
): Promise<CustomerPayment | null> {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
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
 * Record a refund for a customer in a single SQLite transaction.
 *
 * A refund returns money the merchant owes the customer (customer credit),
 * e.g. after cancelling a sale the customer had already paid for. It is stored
 * as a NEGATIVE customer_payments row, keeping the real payment method (how the
 * money was handed back) — refunds are distinguished by their sign, not by a
 * fake payment method.
 *
 * The available credit is re-read inside the transaction, so concurrent
 * refunds cannot exceed the credit between the check and the insert.
 *
 * Returns the recorded refund (negative amount), or null (no row written) when
 * the amount is invalid or exceeds the customer's available credit.
 */
export async function recordRefund(
  customerId: number,
  amount: number,
  method: "cash" | "electronic",
  note?: string,
): Promise<CustomerPayment | null> {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return null;
  }

  const db = await getDatabase();
  return await transaction(db, async (tx) => {
    // Re-check the credit INSIDE the transaction using explicit tx handle
    const credit = await getCustomerCredit(customerId, tx);
    if (amount > credit) {
      return null;
    }

    const refundId = await executeWrite(
      tx,
      `INSERT INTO customer_payments
         (customer_id, amount_centimes, payment_method, note, paid_at, created_at)
       VALUES
         (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [customerId, -amount, method, note],
    );

    const now = new Date().toISOString();

    return {
      id: refundId,
      customer_id: customerId,
      amount_centimes: -amount,
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
  const [balance, payments] = await Promise.all([
    getCustomerBalance(customerId),
    getCustomerPayments(customerId),
  ]);

  const totalPaid = payments
    .filter((p) => p.amount_centimes > 0)
    .reduce((sum, p) => sum + p.amount_centimes, 0);
  const totalRefunded = payments
    .filter((p) => p.amount_centimes < 0)
    .reduce((sum, p) => sum - p.amount_centimes, 0);

  return {
    customerId,
    balance_centimes: balance,
    debt_centimes: Math.max(0, balance),
    credit_centimes: Math.max(0, -balance),
    total_paid_centimes: totalPaid,
    total_refunded_centimes: totalRefunded,
    net_payments_centimes: totalPaid - totalRefunded,
    paymentCount: payments.length,
  };
}
