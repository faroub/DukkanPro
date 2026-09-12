/**
 * customerRepository — Repository for customers table.
 *
 - Uses prepared statements via db.runSync / db.getAllSync / db.getFirstSync.
 - Archive (soft-delete) sets is_active = false; customers are never physically deleted.
 - Archived customers retain all historical data (sales, payments, movements).
 */

import { Customer } from "../../types/entities";
import { executeAll, executeRead, executeWrite } from "../database";

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
 - Search customers by name or phone substring.
 */
export async function search(
  query: string,
  filters: CustomerFilters = {},
): Promise<Customer[]> {
  const { is_active } = filters;
  let sql = `SELECT id, name, phone, note, is_active, created_at, updated_at FROM customers WHERE (name LIKE ? OR phone LIKE ?)`;
  const params: unknown[] = [`%${query}%`, `%${query}%`];

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
 - Create a new customer.
 - If a customer with the same phone number already exists, the existing one is returned
   (idempotent).
 */
export async function create(
  customer: Omit<Customer, "id" | "created_at" | "updated_at">,
): Promise<Customer> {
  // Check if a customer with the same phone already exists.
  if (customer.phone) {
    const existing: Customer | null = await getByPhone(customer.phone);
    if (existing) {
      return existing;
    }
  }

  const result = await executeWrite(
    // language=SQLite
    `INSERT INTO customers (name, phone, note, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [customer.name, customer.phone, customer.note, customer.is_active ? 1 : 0],
  );

  // Re-fetch the newly created row.
  if (customer.phone) {
    const created = await getByPhone(customer.phone);
    if (!created) throw new Error("Customer was not created");
    return created;
  }
  // If no phone, fetch the last inserted.
  const all = await getAll({});
  return (
    all[all.length - 1] || {
      id: -1,
      name: customer.name,
      phone: customer.phone || "",
      note: customer.note,
      is_active: customer.is_active,
      created_at: "",
      updated_at: "",
    }
  );
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
 - Archive (soft-delete) a customer by id.
 - Sets is_active = false; the row is retained for history and referential integrity.
 - Archived customers retain all history (sales, payments, inventory movements).
 */
export async function archive(id: number): Promise<void> {
  await executeWrite(
    // language=SQLite
    `UPDATE customers
     SET is_active = 0,
         updated_at = datetime('now')
     WHERE id = ?`,
    [id],
  );
}

/**
 - Helper: retrieve a customer by phone (used by create idempotency).
 */
async function getByPhone(phone: string): Promise<Customer | null> {
  const rows: any[] = await executeAll(
    // language=SQLite
    `SELECT id, name, phone, note, is_active, created_at, updated_at FROM customers WHERE phone = ?`,
    [phone],
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
