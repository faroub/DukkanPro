/**
 * backupFormat — the backup file format: constants, the table/column
 * whitelist and pure structural validation.
 *
 * - `format`/`backupVersion` identify the file layout so the importer can
 *   evolve it later and refuse what it cannot understand.
 * - `databaseVersion` (max row of _migration_version at export) records which
 *   database schema produced the data; the importer rejects backups made by a
 *   NEWER app and accepts older ones (migrations so far are additive, so older
 *   rows restore into the current schema, missing columns taking their schema
 *   defaults).
 * - The whitelist pins exactly which tables and columns may appear. Unknown
 *   columns and mistyped values (notably money that is not an integer) are
 *   rejected before the database is touched — never silently dropped.
 */

import { normalizeSkuForLookup } from "@/database/repositories/productRepository";

export const BACKUP_FORMAT = "dukkanpro-backup";
export const SUPPORTED_BACKUP_VERSION = 1;

export const MAX_BACKUP_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_BACKUP_ROW_COUNT_PER_TABLE = 100000; // 100,000 rows per table
export const MAX_BACKUP_TOTAL_ROW_COUNT = 500000; // 500,000 total rows
export const MAX_BACKUP_STRING_LENGTH = 10000; // 10,000 chars per text field

/**
 * Calculate the exact UTF-8 byte length of a string without unnecessary memory allocations.
 */
export function getUtf8ByteLength(str: string): number {
  if (!str) return 0;
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str).length;
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.byteLength(str, "utf8");
  }
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      i++;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/** A SQLite cell as JSON: INTEGER, TEXT or NULL. */
export type SqlJsonValue = number | string | null;
export type TableRow = Record<string, SqlJsonValue>;

export const BACKUP_TABLES = [
  "business_profiles",
  "app_settings",
  "customers",
  "products",
  "sales",
  "sale_items",
  "customer_payments",
  "inventory_movements",
] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

type ColumnSpec = {
  name: string;
  kind: "int" | "text";
  nullable?: boolean;
  allowedValues?: readonly string[];
  isTimestamp?: boolean;
};

/**
 * Fixed table → column whitelist (column name → JSON type). Column order is
 * stable so two exports of the same data are byte-identical and the importer
 * can build prepared INSERTs directly from the spec.
 */
export const TABLE_SPECS: Record<BackupTable, ColumnSpec[]> = {
  business_profiles: [
    { name: "id", kind: "int", nullable: false },
    { name: "business_name", kind: "text", nullable: false },
    { name: "owner_name", kind: "text", nullable: false },
    { name: "business_type", kind: "text", nullable: false },
    { name: "currency", kind: "text", nullable: false, allowedValues: ["DZD", "EUR", "USD"] },
    { name: "selected_locale", kind: "text", nullable: false, allowedValues: ["ar", "fr", "en"] },
    { name: "phone_number", kind: "text", nullable: true },
    { name: "address", kind: "text", nullable: true },
    { name: "rc_number", kind: "text", nullable: true },
    { name: "created_at", kind: "text", nullable: true, isTimestamp: true },
    { name: "updated_at", kind: "text", nullable: true, isTimestamp: true },
  ],
  app_settings: [
    { name: "key", kind: "text", nullable: false },
    { name: "value", kind: "text", nullable: false },
    { name: "updated_at", kind: "text", nullable: true, isTimestamp: true },
  ],
  customers: [
    { name: "id", kind: "int", nullable: false },
    { name: "name", kind: "text", nullable: false },
    { name: "phone", kind: "text", nullable: true },
    { name: "note", kind: "text", nullable: true },
    { name: "is_active", kind: "int", nullable: false, allowedValues: ["0", "1"] },
    { name: "created_at", kind: "text", nullable: true, isTimestamp: true },
    { name: "updated_at", kind: "text", nullable: true, isTimestamp: true },
  ],
  products: [
    { name: "id", kind: "int", nullable: false },
    { name: "name", kind: "text", nullable: false },
    { name: "sku", kind: "text", nullable: true },
    { name: "category", kind: "text", nullable: true },
    { name: "sale_price_centimes", kind: "int", nullable: false },
    { name: "cost_price_centimes", kind: "int", nullable: true },
    { name: "stock_quantity", kind: "int", nullable: false },
    { name: "minimum_stock_quantity", kind: "int", nullable: false },
    { name: "unit", kind: "text", nullable: false },
    { name: "is_active", kind: "int", nullable: false, allowedValues: ["0", "1"] },
    { name: "created_at", kind: "text", nullable: true, isTimestamp: true },
    { name: "updated_at", kind: "text", nullable: true, isTimestamp: true },
  ],
  sales: [
    { name: "id", kind: "int", nullable: false },
    { name: "customer_id", kind: "int", nullable: true },
    { name: "status", kind: "text", nullable: false, allowedValues: ["completed", "cancelled", "returned"] },
    { name: "subtotal_centimes", kind: "int", nullable: false },
    { name: "discount_centimes", kind: "int", nullable: false },
    { name: "total_centimes", kind: "int", nullable: false },
    { name: "amount_paid_centimes", kind: "int", nullable: false },
    { name: "remaining_balance_centimes", kind: "int", nullable: false },
    { name: "payment_method", kind: "text", nullable: false, allowedValues: ["cash", "electronic", "mixed", "partial", "credit"] },
    { name: "currency", kind: "text", nullable: false, allowedValues: ["DZD", "EUR", "USD"] },
    { name: "note", kind: "text", nullable: true },
    { name: "sold_at", kind: "text", nullable: true, isTimestamp: true },
    { name: "created_at", kind: "text", nullable: true, isTimestamp: true },
    { name: "updated_at", kind: "text", nullable: true, isTimestamp: true },
  ],
  sale_items: [
    { name: "id", kind: "int", nullable: false },
    { name: "sale_id", kind: "int", nullable: false },
    { name: "product_id", kind: "int", nullable: true },
    { name: "product_name_snapshot", kind: "text", nullable: false },
    { name: "quantity", kind: "int", nullable: false },
    { name: "unit_sale_price_centimes", kind: "int", nullable: false },
    { name: "unit_cost_price_centimes", kind: "int", nullable: true },
    { name: "line_total_centimes", kind: "int", nullable: false },
    { name: "created_at", kind: "text", nullable: true, isTimestamp: true },
  ],
  customer_payments: [
    { name: "id", kind: "int", nullable: false },
    { name: "customer_id", kind: "int", nullable: false },
    { name: "amount_centimes", kind: "int", nullable: false },
    { name: "payment_method", kind: "text", nullable: false, allowedValues: ["cash", "electronic", "mixed", "partial", "credit"] },
    { name: "currency", kind: "text", nullable: false, allowedValues: ["DZD", "EUR", "USD"] },
    { name: "note", kind: "text", nullable: true },
    { name: "paid_at", kind: "text", nullable: true, isTimestamp: true },
    { name: "created_at", kind: "text", nullable: true, isTimestamp: true },
  ],
  inventory_movements: [
    { name: "id", kind: "int", nullable: false },
    { name: "product_id", kind: "int", nullable: false },
    { name: "movement_type", kind: "text", nullable: false, allowedValues: ["in", "out"] },
    { name: "quantity_change", kind: "int", nullable: false },
    { name: "reference_sale_id", kind: "int", nullable: true },
    { name: "note", kind: "text", nullable: true },
    { name: "created_at", kind: "text", nullable: true, isTimestamp: true },
  ],
};

export type BackupData = {
  format: string;
  backupVersion: number;
  createdAt: string;
  databaseVersion: number;
  /** Convenience summary for the UI; ignored on import. */
  store: { businessName: string | null; currency: string | null };
  tables: Record<BackupTable, TableRow[]>;
};

function invalid(reason: string): Error {
  return new Error(`INVALID_BACKUP_FILE: ${reason}`);
}

function invalidContent(table: string, reason: string): Error {
  return new Error(`INVALID_BACKUP_CONTENT: ${table}: ${reason}`);
}

/**
 * Structurally validate a parsed backup: envelope, version gate, whitelist and
 * foreign-key shape. Throws with a typed prefix on any problem; returns the
 * same object narrowed to BackupData.
 */
export function validateBackup(
  data: unknown,
  currentDatabaseVersion: number,
): BackupData {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw invalid("root is not an object");
  }
  const root = data as Record<string, unknown>;

  if (root.format !== BACKUP_FORMAT) {
    throw invalid(`format is not "${BACKUP_FORMAT}"`);
  }
  if (typeof root.backupVersion !== "number" || !Number.isSafeInteger(root.backupVersion)) {
    throw invalid("backupVersion is missing or not an integer");
  }
  if (root.backupVersion !== SUPPORTED_BACKUP_VERSION) {
    throw new Error(
      `UNSUPPORTED_BACKUP_VERSION: The backup file version ${root.backupVersion} is not supported by this app (expected ${SUPPORTED_BACKUP_VERSION}).`,
    );
  }
  if (typeof root.databaseVersion !== "number" || !Number.isSafeInteger(root.databaseVersion)) {
    throw invalid("databaseVersion is missing or not an integer");
  }
  if (root.databaseVersion > currentDatabaseVersion) {
    throw new Error(
      `BACKUP_NEWER_VERSION: The backup was made by a newer app (database version ${root.databaseVersion} > ${currentDatabaseVersion}). Restore it on a device running that version instead.`,
    );
  }

  if (
    !root.createdAt ||
    typeof root.createdAt !== "string" ||
    isNaN(new Date(root.createdAt).getTime())
  ) {
    throw invalid("createdAt is missing or not a valid date string");
  }

  if (!root.tables || typeof root.tables !== "object" || Array.isArray(root.tables)) {
    throw invalid("the tables object is missing");
  }
  const tables = root.tables as Record<string, unknown>;

  // Reject unknown table names in tables object
  const validTableSet = new Set<string>(BACKUP_TABLES);
  for (const tableName of Object.keys(tables)) {
    if (!validTableSet.has(tableName)) {
      throw invalid(`unknown table "${tableName}" in tables object`);
    }
  }

  let totalRows = 0;
  for (const table of BACKUP_TABLES) {
    const rows = tables[table];
    if (!Array.isArray(rows)) {
      throw invalid(`tables.${table} is missing or not an array`);
    }
    if (rows.length > MAX_BACKUP_ROW_COUNT_PER_TABLE) {
      throw new Error(
        `MAX_BACKUP_ROWS_EXCEEDED: Table "${table}" contains ${rows.length} rows, exceeding limit of ${MAX_BACKUP_ROW_COUNT_PER_TABLE}.`,
      );
    }
    totalRows += rows.length;
  }

  if (totalRows > MAX_BACKUP_TOTAL_ROW_COUNT) {
    throw new Error(
      `MAX_BACKUP_ROWS_EXCEEDED: Total backup row count (${totalRows}) exceeds limit of ${MAX_BACKUP_TOTAL_ROW_COUNT}.`,
    );
  }

  for (const table of BACKUP_TABLES) {
    const spec = TABLE_SPECS[table];
    const known = new Set(spec.map((c) => c.name));
    const rows = tables[table] as unknown[];

    rows.forEach((rawRow, index) => {
      if (!rawRow || typeof rawRow !== "object" || Array.isArray(rawRow)) {
        throw invalidContent(table, `row ${index} is not an object`);
      }
      const rowRecord = rawRow as Record<string, unknown>;

      // Check required non-nullable columns
      for (const col of spec) {
        if (col.nullable === false) {
          const val = rowRecord[col.name];
          if (val === undefined || val === null) {
            throw invalidContent(table, `column "${col.name}" cannot be null (row ${index})`);
          }
        }
      }

      for (const [key, value] of Object.entries(rowRecord)) {
        if (!known.has(key)) {
          throw invalidContent(table, `unknown column "${key}" (row ${index})`);
        }
        const column = spec.find((c) => c.name === key)!;
        if (value === null) continue;

        if (column.kind === "int") {
          if (typeof value !== "number" || !Number.isSafeInteger(value)) {
            throw invalidContent(table, `column "${key}" must be an integer (row ${index})`);
          }
        } else if (typeof value !== "string") {
          throw invalidContent(table, `column "${key}" must be a string (row ${index})`);
        } else if (value.length > MAX_BACKUP_STRING_LENGTH) {
          throw invalidContent(
            table,
            `column "${key}" string length (${value.length}) exceeds maximum limit of ${MAX_BACKUP_STRING_LENGTH} chars (row ${index})`,
          );
        }

        // Validate allowed values for enums and currencies
        if (column.allowedValues && value !== null) {
          if (!column.allowedValues.includes(String(value))) {
            throw invalidContent(
              table,
              `invalid value "${value}" for column "${key}" (row ${index})`,
            );
          }
        }

        // Validate timestamp format
        if (column.isTimestamp && value !== null) {
          const timeMs = new Date(String(value)).getTime();
          if (isNaN(timeMs)) {
            throw invalidContent(
              table,
              `invalid timestamp format "${value}" for column "${key}" (row ${index})`,
            );
          }
        }
      }
    });
  }

  // Check for duplicate primary key IDs in each table
  for (const table of BACKUP_TABLES) {
    const rows = tables[table] as TableRow[];
    const seenIds = new Set<number | string>();
    rows.forEach((row, index) => {
      const idKey = table === "app_settings" ? row.key : row.id;
      if (idKey !== undefined && idKey !== null) {
        if (seenIds.has(idKey)) {
          throw invalidContent(table, `duplicate id "${idKey}" (row ${index})`);
        }
        seenIds.add(idKey);
      }
    });
  }

  // Check for canonical SKU collisions across product rows in backup
  const productRows = tables.products as TableRow[];
  const canonicalSkuSet = new Set<string>();
  productRows.forEach((prod, index) => {
    const rawSku = prod.sku;
    if (typeof rawSku === "string" && rawSku.trim().length > 0) {
      const normalized = normalizeSkuForLookup(rawSku);
      if (normalized) {
        if (canonicalSkuSet.has(normalized)) {
          throw invalidContent(
            "products",
            `canonical SKU collision on "${normalized}" (row ${index}, sku "${rawSku}")`,
          );
        }
        canonicalSkuSet.add(normalized);
      }
    }
  });

  // Foreign-key shape: every non-null reference must resolve to a parent row
  // inside the backup itself.
  const idSet = (table: BackupTable): Set<number> =>
    new Set((tables[table] as TableRow[]).map((row) => row.id as number));
  const parentIds: Record<string, Set<number>> = {
    products: idSet("products"),
    customers: idSet("customers"),
    sales: idSet("sales"),
  };
  let broken = 0;
  const checkRef = (table: BackupTable, column: string, parent: string) => {
    for (const row of tables[table] as TableRow[]) {
      const value = row[column];
      if (value === null || value === undefined) continue;
      if (!parentIds[parent].has(value as number)) broken++;
    }
  };
  checkRef("sales", "customer_id", "customers");
  checkRef("sale_items", "sale_id", "sales");
  checkRef("sale_items", "product_id", "products");
  checkRef("customer_payments", "customer_id", "customers");
  checkRef("inventory_movements", "product_id", "products");
  checkRef("inventory_movements", "reference_sale_id", "sales");
  if (broken > 0) {
    throw new Error(
      `BROKEN_REFERENCES: ${broken} foreign-key reference(s) in the backup do not resolve to a parent row inside the same backup.`,
    );
  }

  // Validate financial invariants using business logic from saleRepository.
  // These rules reflect exactly what the app writes and must always hold.
  const salesRows = tables.sales as TableRow[];
  const saleItemsRows = tables.sale_items as TableRow[];

  // 1. Compute sum of sale_items line_total per sale.
  const itemSumBySaleId = new Map<number, number>();
  const itemRowBySaleId = new Map<number, number>();
  saleItemsRows.forEach((item, idx) => {
    const saleId = item.sale_id as number;
    const lineTotal = item.line_total_centimes as number;
    const unitPrice = item.unit_sale_price_centimes as number;
    const quantity = item.quantity as number;

    if (quantity <= 0) {
      throw invalidContent("sale_items", `quantity must be positive (row ${idx}: ${quantity})`);
    }

    // Rule: line_total = unit_price * quantity
    if (lineTotal !== undefined && unitPrice !== undefined && quantity !== undefined) {
      const computedTotal = unitPrice * quantity;
      if (!Number.isSafeInteger(computedTotal)) {
        throw invalidContent("sale_items", `line_total calculation exceeds MAX_SAFE_INTEGER (row ${idx})`);
      }
      if (lineTotal !== computedTotal) {
        throw invalidContent(
          "sale_items",
          `line_total_centimes must equal unit_sale_price_centimes * quantity (row ${idx}: ${lineTotal} ≠ ${unitPrice} * ${quantity} = ${computedTotal})`,
        );
      }
    }

    // Accumulate sum per sale safely.
    const currentSum = itemSumBySaleId.get(saleId) || 0;
    const newSum = currentSum + lineTotal;
    if (!Number.isSafeInteger(newSum)) {
      throw invalidContent("sale_items", `aggregate sale items subtotal exceeds MAX_SAFE_INTEGER for sale_id ${saleId}`);
    }
    itemSumBySaleId.set(saleId, newSum);
    itemRowBySaleId.set(saleId, idx);
  });

  // 2. Validate each sale header.
  salesRows.forEach((sale, saleIdx) => {
    const subtotal = sale.subtotal_centimes as number | null | undefined;
    const discount = sale.discount_centimes as number | null | undefined;
    const total = sale.total_centimes as number | null | undefined;
    const amountPaid = sale.amount_paid_centimes as number | null | undefined;
    const remaining = sale.remaining_balance_centimes as number | null | undefined;
    const saleId = sale.id as number;

    if (subtotal !== null && subtotal !== undefined && subtotal < 0) {
      throw invalidContent("sales", `subtotal_centimes must be non-negative (row ${saleIdx}: ${subtotal})`);
    }
    if (discount !== null && discount !== undefined && discount < 0) {
      throw invalidContent("sales", `discount_centimes must be non-negative (row ${saleIdx}: ${discount})`);
    }
    if (total !== null && total !== undefined && total < 0) {
      throw invalidContent("sales", `total_centimes must be non-negative (row ${saleIdx}: ${total})`);
    }
    if (amountPaid !== null && amountPaid !== undefined && amountPaid < 0) {
      throw invalidContent("sales", `amount_paid_centimes must be non-negative (row ${saleIdx}: ${amountPaid})`);
    }
    if (remaining !== null && remaining !== undefined && remaining < 0) {
      throw invalidContent("sales", `remaining_balance_centimes must be non-negative (row ${saleIdx}: ${remaining})`);
    }

    // Rule: total = subtotal - discount.
    if (subtotal !== null && subtotal !== undefined && discount !== null && discount !== undefined && total !== null && total !== undefined) {
      const computedTotal = subtotal - discount;
      if (!Number.isSafeInteger(computedTotal)) {
        throw invalidContent("sales", `total calculation exceeds MAX_SAFE_INTEGER (row ${saleIdx})`);
      }
      if (total !== computedTotal) {
        throw invalidContent(
          "sales",
          `total_centimes must equal subtotal_centimes - discount_centimes (row ${saleIdx}: ${total} ≠ ${subtotal} - ${discount} = ${computedTotal})`,
        );
      }
    }

    // Rule: 0 ≤ amount_paid ≤ total.
    if (amountPaid !== null && amountPaid !== undefined && total !== null && total !== undefined) {
      if (amountPaid < 0 || amountPaid > total) {
        throw invalidContent(
          "sales",
          `amount_paid_centimes must be between 0 and total_centimes (row ${saleIdx}: ${amountPaid} vs total ${total})`,
        );
      }
    }

    // Rule: remaining = total - amount_paid.
    if (remaining !== null && remaining !== undefined && total !== null && total !== undefined && amountPaid !== null && amountPaid !== undefined) {
      const computedRemaining = total - amountPaid;
      if (!Number.isSafeInteger(computedRemaining)) {
        throw invalidContent("sales", `remaining balance calculation exceeds MAX_SAFE_INTEGER (row ${saleIdx})`);
      }
      if (remaining !== computedRemaining) {
        throw invalidContent(
          "sales",
          `remaining_balance_centimes must equal total_centimes - amount_paid_centimes (row ${saleIdx}: ${remaining} ≠ ${total} - ${amountPaid} = ${computedRemaining})`,
        );
      }
    }

    // Rule: sale's subtotal must equal the sum of its item line totals.
    const sumItems = itemSumBySaleId.get(saleId) || 0;
    if (subtotal !== null && subtotal !== undefined && sumItems !== subtotal) {
      throw invalidContent(
        "sales",
        `subtotal_centimes must equal sum of sale_items line_total_centimes (row ${saleIdx}: ${subtotal} ≠ sum ${sumItems})`,
      );
    }
  });

  return root as unknown as BackupData;
}
