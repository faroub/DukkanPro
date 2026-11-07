/**
 * customerRepository — Repository for customers table.
 *
 - Uses prepared statements via db.runSync / db.getAllSync / db.getFirstSync.
 - Archive (soft-delete) sets is_active = false; customers are never physically deleted.
 - Archived customers retain all historical data (sales, payments, movements).
 */

import { Customer } from "../../types/entities";
import { executeAll, executeRead, executeWrite, escapeLike, getDatabase, transaction } from "../database";
import { getCustomerBalance } from "@/services/customers/customerBalanceService";
import { mapCustomerRow } from "./mappers";

export type CustomerFilters = {
  is_active?: boolean;
};

export type CustomerResult = {
  customer: Customer | null;
  error?: string;
};

/**
 * Normalize a phone number for storage and lookup: trim and strip spaces,
 * dashes, dots and parentheses. A leading '+' is kept so international
 * numbers stay distinct from local ones.
 */
export function normalizePhone(phone: string): string {
  return phone.trim().replace(/[\s\-().]/g, "");
}

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
  return rows.map(mapCustomerRow);
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
  return mapCustomerRow(rows[0]);
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
  const phoneQuery = escapeLike(normalizePhone(query));
  let sql = `SELECT id, name, phone, note, is_active, created_at, updated_at FROM customers WHERE (name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\')`;
  const params: unknown[] = [`%${escaped}%`, `%${phoneQuery}%`];

  if (is_active !== undefined) {
    sql += ` AND is_active = ?`;
    params.push(is_active ? 1 : 0);
  }
  sql += ` ORDER BY name ASC`;

  const rows: any[] = await executeAll(sql, params);
  return rows.map(mapCustomerRow);
}

/**
 * Create a new customer atomically inside a transaction.
 * The phone number is normalized before storage. If an ACTIVE customer with the
 * same normalized phone already exists, the existing one is returned (idempotent);
 * if that customer is ARCHIVED, the create is rejected with PHONE_ARCHIVED so the
 * merchant restores or settles the archived record instead of duplicating it.
 */
export async function create(
  customer: Omit<Customer, "id" | "created_at" | "updated_at">,
): Promise<Customer> {
  const db = await getDatabase();
  return await transaction(db, async (tx) => {
    const normalizedPhone =
      customer.phone === null || customer.phone === undefined
        ? customer.phone
        : normalizePhone(customer.phone);

    // Check if a customer with the same phone already exists inside the transaction
    if (normalizedPhone) {
      const existing = await getByPhone(normalizedPhone, tx);
      if (existing) {
        if (!existing.is_active) {
          throw new Error(
            `PHONE_ARCHIVED: An archived customer already uses this phone number. Restore that customer instead of creating a duplicate.`,
          );
        }
        return existing;
      }
    }

    const result = await executeWrite(
      tx,
      `INSERT INTO customers (name, phone, note, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        customer.name,
        normalizedPhone,
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
    return mapCustomerRow(rows[0]);
  });
}

/**
 * Update an existing customer by id.
 * Only the provided fields are updated; id, created_at remain unchanged.
 * The phone number is normalized before storage, and a phone already used by
 * another customer is rejected with DUPLICATE_PHONE.
 */
export async function update(
  id: number,
  customer: Partial<Omit<Customer, "id" | "created_at">>,
): Promise<Customer> {
  const db = await getDatabase();
  return await transaction(db, async (tx) => {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (customer.name !== undefined) {
      fields.push(`name = ?`);
      values.push(customer.name);
    }
    if (customer.phone !== undefined) {
      const normalizedPhone =
        customer.phone === null ? null : normalizePhone(customer.phone);

      if (normalizedPhone !== null) {
        const phoneOwner = await getByPhone(normalizedPhone, tx);
        if (phoneOwner && phoneOwner.id !== id) {
          throw new Error(
            `DUPLICATE_PHONE: Another customer already uses this phone number.`,
          );
        }
      }

      fields.push(`phone = ?`);
      values.push(normalizedPhone);
    }
    if (customer.note !== undefined) {
      fields.push(`note = ?`);
      values.push(customer.note);
    }
    if (customer.is_active !== undefined) {
      fields.push(`is_active = ?`);
      values.push(customer.is_active ? 1 : 0);
    }

    // Reads use the transaction handle: getById would deadlock on the dbMutex.
    const readCustomer = async (): Promise<Customer> => {
      const rows: any[] = await executeRead(
        tx,
        // language=SQLite
        `SELECT id, name, phone, note, is_active, created_at, updated_at FROM customers WHERE id = ?`,
        [id],
      );
      if (rows.length === 0) throw new Error(`Customer id=${id} not found`);
      return mapCustomerRow(rows[0]);
    };

    if (fields.length === 0) {
      return await readCustomer();
    }

    values.push(id);

    await executeWrite(
      tx,
      // language=SQLite
      `UPDATE customers
       SET ${fields.join(", ")},
           updated_at = datetime('now')
       WHERE id = ?`,
      values,
    );

    return await readCustomer();
  });
}

/**
 * Archive (soft-delete) a customer by id.
 * Sets is_active = false; the row is retained for history and referential integrity.
 * Rejects archiving inside an atomic transaction when the customer's balance is
 * non-zero: a positive balance is outstanding debt, a negative one is store
 * credit the merchant still owes. Both must be settled before archiving.
 */
export async function archive(id: number): Promise<void> {
  const db = await getDatabase();
  await transaction(db, async (tx) => {
    const balance = await getCustomerBalance(id, tx);
    if (balance > 0) {
      throw new Error(
        `Cannot archive customer id=${id} while an outstanding balance of ${balance} centimes remains.`,
      );
    }
    if (balance < 0) {
      throw new Error(
        `Cannot archive customer id=${id} while they hold a store credit of ${-balance} centimes. Settle the refund first.`,
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
 * Helper: retrieve a customer by phone (used by create idempotency and the
 * update duplicate guard). The given phone is normalized first so lookups
 * match numbers stored in any formatting variant.
 */
async function getByPhone(
  phone: string,
  tx?: any,
): Promise<Customer | null> {
  const normalized = normalizePhone(phone);
  const sql = `SELECT id, name, phone, note, is_active, created_at, updated_at FROM customers WHERE phone = ?`;
  const rows: any[] = tx
    ? await executeRead(tx, sql, [normalized])
    : await executeRead(sql, [normalized]);

  if (rows.length === 0) {
    return null;
  }
  return mapCustomerRow(rows[0]);
}
