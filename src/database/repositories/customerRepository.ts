/**
 * customerRepository — Repository for customers table.
 *
 - Uses prepared statements via db.runSync / db.getAllSync / db.getFirstSync.
 - Archive (soft-delete) sets is_active = false; customers are never physically deleted.
 - Archived customers retain all historical data (sales, payments, movements).
 */

import { Customer } from "../../types/entities";
import { executeAll, executeRead, executeWrite, escapeLike, getDatabase, transaction } from "../database";
import { getCustomerDebt } from "@/services/customers/customerBalanceService";

export type CustomerFilters = {
  is_active?: boolean;
};

export type CustomerResult = {
  customer: Customer | null;
  error?: string;
};

/**
 - Retrieve all customers, optionally filtered by is_active.
 */
export async function getAll(
  filters: CustomerFilters = {},
): Promise<Customer[]> {
  const { is_active } = filters;
  let sql = `SELECT id, name, phone, note, is_active, created_at, updated_at FROM customers`;
  const params: unknown[] = [];

  if (is_active !== undefined) {
    sql += ` WHERE is_active = ?`;
    params.push(is_active ? 1 : 0);
  }
  sql += ` ORDER BY name ASC`;

  const rows: any[] = await executeAll(sql, params);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    note: r.note,
    is_active: r.is_active !== 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/**
 - Retrieve a single customer by id.
 - Returns null if not found.
 */
export async function getById(id: number): Promise<Customer | null> {
  const rows: any[] = await executeRead(
    // language=SQLite
    `SELECT id, name, phone, note, is_active, created_at, updated_at FROM customers WHERE id = ?`,
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    note: r.note,
    is_active: r.is_active !== 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/**
 * Search customers by name or phone substring.
 */
export async function search(
  query: string,
  filters: CustomerFilters = {},
): Promise<Customer[]> {
  const { is_active } = filters;
  const escaped = escapeLike(query);
  let sql = `SELECT id, name, phone, note, is_active, created_at, updated_at FROM customers WHERE (name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\')`;
  const params: unknown[] = [`%${escaped}%`, `%${escaped}%`];

  if (is_active !== undefined) {
    sql += ` AND is_active = ?`;
    params.push(is_active ? 1 : 0);
  }
  sql += ` ORDER BY name ASC`;

  const rows: any[] = await executeAll(sql, params);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    note: r.note,
    is_active: r.is_active !== 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/**
 * Create a new customer atomically inside a transaction.
 * If a customer with the same phone number already exists, the existing one is returned
   (idempotent).
 */
export async function create(
  customer: Omit<Customer, "id" | "created_at" | "updated_at">,
): Promise<Customer> {
  const db = await getDatabase();
  return await transaction(db, async (tx) => {
    // Check if a customer with the same phone already exists inside the transaction
    if (customer.phone) {
      const existing = await getByPhone(customer.phone, tx);
      if (existing) {
        return existing;
      }
    }

    const result = await executeWrite(
      tx,
      `INSERT INTO customers (name, phone, note, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        customer.name,
        customer.phone,
        customer.note,
        customer.is_active !== false ? 1 : 0,
      ],
    );

    const rows: any[] = await executeRead(
      tx,
      `SELECT id, name, phone, note, is_active, created_at, updated_at FROM customers WHERE id = ?`,
      [result],
    );

    if (rows.length === 0) throw new Error("Customer was not created");
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      note: r.note,
      is_active: r.is_active !== 0,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });
}

/**
 - Update an existing customer by id.
 - Only the provided fields are updated; id, created_at remain unchanged.
 */
export async function update(
  id: number,
  customer: Partial<Omit<Customer, "id" | "created_at">>,
): Promise<Customer> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (customer.name !== undefined) {
    fields.push(`name = ?`);
    values.push(customer.name);
  }
  if (customer.phone !== undefined) {
    fields.push(`phone = ?`);
    values.push(customer.phone);
  }
  if (customer.note !== undefined) {
    fields.push(`note = ?`);
    values.push(customer.note);
  }
  if (customer.is_active !== undefined) {
    fields.push(`is_active = ?`);
    values.push(customer.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    const existing = await getById(id);
    if (!existing) throw new Error(`Customer id=${id} not found`);
    return existing;
  }

  values.push(id);

  await executeWrite(
    // language=SQLite
    `UPDATE customers
     SET ${fields.join(", ")},
         updated_at = datetime('now')
     WHERE id = ?`,
    values,
  );
  const updated = await getById(id);
  if (!updated) throw new Error(`Customer id=${id} not found`);
  return updated;
}

/**
 * Archive (soft-delete) a customer by id.
 * Sets is_active = false; the row is retained for history and referential integrity.
 * Rejects archiving if the customer has an active outstanding debt balance inside an atomic transaction.
 */
export async function archive(id: number): Promise<void> {
  const db = await getDatabase();
  await transaction(db, async (tx) => {
    const debt = await getCustomerDebt(id, tx);
    if (debt > 0) {
      throw new Error(
        `Cannot archive customer id=${id} while an outstanding balance remains.`,
      );
    }

    await executeWrite(
      tx,
      `UPDATE customers
       SET is_active = 0,
           updated_at = datetime('now')
       WHERE id = ?`,
      [id],
    );
  });
}

/**
 * Helper: retrieve a customer by phone (used by create idempotency).
 */
async function getByPhone(
  phone: string,
  tx?: any,
): Promise<Customer | null> {
  const sql = `SELECT id, name, phone, note, is_active, created_at, updated_at FROM customers WHERE phone = ?`;
  const rows: any[] = tx
    ? await executeRead(tx, sql, [phone])
    : await executeRead(sql, [phone]);

  if (rows.length === 0) {
    return null;
  }
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    note: r.note,
    is_active: r.is_active !== 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}
