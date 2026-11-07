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

export const BACKUP_FORMAT = "dukkanpro-backup";
export const SUPPORTED_BACKUP_VERSION = 1;

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

type ColumnSpec = { name: string; kind: "int" | "text" };

/**
 * Fixed table → column whitelist (column name → JSON type). Column order is
 * stable so two exports of the same data are byte-identical and the importer
 * can build prepared INSERTs directly from the spec.
 */
export const TABLE_SPECS: Record<BackupTable, ColumnSpec[]> = {
  business_profiles: [
    { name: "id", kind: "int" },
    { name: "business_name", kind: "text" },
    { name: "owner_name", kind: "text" },
    { name: "business_type", kind: "text" },
    { name: "currency", kind: "text" },
    { name: "selected_locale", kind: "text" },
    { name: "phone_number", kind: "text" },
    { name: "address", kind: "text" },
    { name: "rc_number", kind: "text" },
    { name: "created_at", kind: "text" },
    { name: "updated_at", kind: "text" },
  ],
  app_settings: [
    { name: "key", kind: "text" },
    { name: "value", kind: "text" },
    { name: "updated_at", kind: "text" },
  ],
  customers: [
    { name: "id", kind: "int" },
    { name: "name", kind: "text" },
    { name: "phone", kind: "text" },
    { name: "note", kind: "text" },
    { name: "is_active", kind: "int" },
    { name: "created_at", kind: "text" },
    { name: "updated_at", kind: "text" },
  ],
  products: [
    { name: "id", kind: "int" },
    { name: "name", kind: "text" },
    { name: "sku", kind: "text" },
    { name: "category", kind: "text" },
    { name: "sale_price_centimes", kind: "int" },
    { name: "cost_price_centimes", kind: "int" },
    { name: "stock_quantity", kind: "int" },
    { name: "minimum_stock_quantity", kind: "int" },
    { name: "unit", kind: "text" },
    { name: "is_active", kind: "int" },
    { name: "created_at", kind: "text" },
    { name: "updated_at", kind: "text" },
  ],
  sales: [
    { name: "id", kind: "int" },
    { name: "customer_id", kind: "int" },
    { name: "status", kind: "text" },
    { name: "subtotal_centimes", kind: "int" },
    { name: "discount_centimes", kind: "int" },
    { name: "total_centimes", kind: "int" },
    { name: "amount_paid_centimes", kind: "int" },
    { name: "remaining_balance_centimes", kind: "int" },
    { name: "payment_method", kind: "text" },
    { name: "currency", kind: "text" },
    { name: "note", kind: "text" },
    { name: "sold_at", kind: "text" },
    { name: "created_at", kind: "text" },
    { name: "updated_at", kind: "text" },
  ],
  sale_items: [
    { name: "id", kind: "int" },
    { name: "sale_id", kind: "int" },
    { name: "product_id", kind: "int" },
    { name: "product_name_snapshot", kind: "text" },
    { name: "quantity", kind: "int" },
    { name: "unit_sale_price_centimes", kind: "int" },
    { name: "unit_cost_price_centimes", kind: "int" },
    { name: "line_total_centimes", kind: "int" },
    { name: "created_at", kind: "text" },
  ],
  customer_payments: [
    { name: "id", kind: "int" },
    { name: "customer_id", kind: "int" },
    { name: "amount_centimes", kind: "int" },
    { name: "payment_method", kind: "text" },
    { name: "currency", kind: "text" },
    { name: "note", kind: "text" },
    { name: "paid_at", kind: "text" },
    { name: "created_at", kind: "text" },
  ],
  inventory_movements: [
    { name: "id", kind: "int" },
    { name: "product_id", kind: "int" },
    { name: "movement_type", kind: "text" },
    { name: "quantity_change", kind: "int" },
    { name: "reference_sale_id", kind: "int" },
    { name: "note", kind: "text" },
    { name: "created_at", kind: "text" },
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

  if (!root.tables || typeof root.tables !== "object" || Array.isArray(root.tables)) {
    throw invalid("the tables object is missing");
  }
  const tables = root.tables as Record<string, unknown>;

  for (const table of BACKUP_TABLES) {
    if (!Array.isArray(tables[table])) {
      throw invalid(`tables.${table} is missing or not an array`);
    }
  }

  for (const table of BACKUP_TABLES) {
    const spec = TABLE_SPECS[table];
    const known = new Set(spec.map((c) => c.name));
    const rows = tables[table] as unknown[];
    rows.forEach((rawRow, index) => {
      if (!rawRow || typeof rawRow !== "object" || Array.isArray(rawRow)) {
        throw invalidContent(table, `row ${index} is not an object`);
      }
      for (const [key, value] of Object.entries(rawRow as Record<string, unknown>)) {
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
        }
      }
    });
  }

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

  return root as unknown as BackupData;
}
