# Backup & Restore — Design Plan (DukkanPro)

> Status: **Fully implemented** — `src/services/backup/backupFormat.ts` +
> `backupService.ts` (round-trip tests in `__tests__/`), wired into the app via
> `src/features/settings/BackupScreen.tsx` (route `/settings/backup`, linked
> from the More menu and from the Data Reset screen's critical callout), with
> `expo-document-picker` for file selection and `expo-sharing` for export.
> Scope: full-data backup (export) and restore (import) for the offline-first
> SQLite database, with no new cloud dependencies.

## 1. Goals

- Export **every** user-data table to a single versioned JSON file the merchant
  can share (AirDrop, WhatsApp, email, drive).
- Restore a device (or move to a new device) from that file in **one atomic
  transaction**: either the whole backup is applied or nothing changes.
- Never silently destroy data: restore refuses to overwrite a non-empty
  database unless the merchant explicitly confirms.
- Preserve money safety: all centimes fields are copied verbatim (integers),
  never converted or recomputed.

## 2. Installed capabilities (verified)

| Package | Installed | Role |
|---|---|---|
| `expo-file-system` | ✅ `~57.0.6` | Writing/reading backup JSON on disk |
| `expo-sharing` | ✅ `~57.0.18` (plugin declared in `app.json`) | Share sheet for the exported file |
| `expo-document-picker` | ✅ `~57.0.3` (plugin declared in `app.json`) | Picking a backup file to restore |

No other new dependency is proposed. The SQLite layer (`expo-sqlite`),
`getDatabase()`/`transaction()` from `src/database/database.ts`, and
`resetDatabase()` from `src/database/repositories/resetRepository.ts` already
provide everything else.

## 3. Export format — versioned JSON

```jsonc
{
  "format": "dukkanpro-backup",
  "backupVersion": 1,               // the BACKUP FILE format (not the DB version)
  "createdAt": "2026-11-07T14:30:00.000Z",   // JS ISO string (export side only)
  "databaseVersion": 14,            // MAX(version) of _migration_version at export
  "store": {                        // summary for the UI (redundant with rows, convenience only)
    "businessName": "...",
    "currency": "DZD"
  },
  "tables": {
    "business_profiles":   [ { "id": 1, "business_name": "...", "currency": "DZD", ... } ],
    "app_settings":        [ { "key": "selected_locale", "value": "fr", ... } ],
    "customers":           [ ... ],
    "products":            [ ... ],
    "sales":               [ ... ],   // includes per-row currency
    "sale_items":          [ ... ],
    "customer_payments":   [ ... ],   // includes per-row currency
    "inventory_movements": [ ... ]
  }
}
```

Rules:

- **Every user-data table** is included. `_migration_version` is deliberately
  excluded — it is re-derived on import (§4.4) so a backup can never lie about
  which schema it was written by.
- Rows are copied **verbatim**: exact column names and values as stored
  (including `currency`, `is_active` as 0/1, nullable nulls). No mapping,
  no unit conversion, no rounding — money stays integer centimes.
- Column order in each object is stable (driven by a fixed table/column
  whitelist, not `SELECT *`) so two exports of the same data are byte-identical
  and diffs are meaningful.
- Export reads run through the existing serialized `executeAll` against the
  live WAL database, which yields a per-table consistent snapshot. (Sales are
  written in single transactions, so an in-progress sale never produces a
  torn header/items pair.)
- `backupVersion` lets the importer evolve later (rename columns, split files)
  while refusing files it cannot understand.

## 4. Import (restore) semantics

### 4.1 Validation (before any write)

1. File parses as UTF-8 JSON (bounded size, reject > 100 MB).
2. `format === "dukkanpro-backup"` and `backupVersion` is one the importer knows.
3. Every table key and every column in every row is in the fixed whitelist
   (§3 / §5). Unknown tables/columns cause a hard rejection (typo or hostile
   file — never silently dropped).
4. Foreign-key shape pre-check: all non-null `product_id`/`customer_id`/`sale_id`
   references resolve inside the backup itself. (The merchant could hand-edit
   a file; FK integrity must not be first discovered mid-transaction.)
5. Version gate (§4.4).

### 4.2 Overwrite guard

- `restoreBackup(file, { confirmOverwrite })` counts rows in
  `business_profiles`, `products`, `customers`, `sales` first.
- If any table is non-empty **and** `confirmOverwrite !== true`, the call
  rejects with an `OVERWRITE_REQUIRED` error carrying the current row counts —
  no DELETE ever executes.
- The UI (settings screen) shows the business name + counts and requires an
  explicit "Replace all data" confirmation before re-calling with
  `confirmOverwrite: true`. This mirrors the type-to-confirm gate already used
  by `DataResetScreen`.

### 4.3 One atomic transaction

The entire restore executes inside a single `transaction(db, ...)`:

1. Delete in child→parent order (same ordering `resetRepository` uses):
   `sale_items`, `customer_payments`, `inventory_movements`, `sales`,
   `products`, `customers`, `business_profiles`, `app_settings`.
2. Delete those tables' rows from `sqlite_sequence` so autoincrement resumes
   after the imported ids.
3. Insert in parent→child order with the rows' **exact original ids**:
   `business_profiles`, `app_settings`, `customers`, `products`, `sales`,
   `sale_items`, `customer_payments`, `inventory_movements`.
4. Re-run `runMigrations(db, CURRENT_TARGET)` *after* the inserts when
   `databaseVersion < CURRENT_TARGET` (bring an older backup up to the app's
   schema, e.g. a v12 backup restored onto a v14 app). Wrapped in the same
   outer flow; any failure rolls back everything.

Deletion-before-insertion ordering guarantees foreign keys hold throughout;
no `PRAGMA foreign_keys = OFF` is needed (which would be a no-op inside a
transaction anyway, per migration 14's finding).

### 4.4 Version handling

- `databaseVersion > app's CURRENT_TARGET` (backup from a newer app):
  **reject** with `BACKUP_NEWER_VERSION` — never partially import, never
  downgrade the schema.
- `databaseVersion <= CURRENT_TARGET`: import the rows into the app's current
  schema. No re-migration is run: restore replaces only row *data* — the
  local `_migration_version` bookkeeping and the schema itself stay exactly as
  the app built them (getDatabase() always runs the app to CURRENT_TARGET at
  open). Migrations 1–14 are additive, so an older backup's rows are a subset
  of the current columns; columns missing from a partial row bind NULL and
  fall back to their schema defaults (e.g. `customer_payments.currency` →
  `'DZD'`), while a row that violates a NOT NULL/CHECK constraint fails inside
  the transaction and the whole restore rolls back — loudly, never silently.
- `_migration_version` itself is never imported.

### 4.5 Post-import verification (returned to the caller, asserted in tests)

Per-table row counts, plus two financial invariants recomputed from the
restored data:

- `SUM(quantity_change) GROUP BY product_id == products.stock_quantity` (the
  ledger reconciliation rule from Task 2). A product whose movements do not
  sum to `stock_quantity` — the classic case is a legacy product created
  before the `inventory_movements` table existed, with stock but no opening
  movement — is **not** rejected: restore records a one-time
  `"Opening stock reconciliation"` movement (signed, `in`/`out` by sign of
  `stock − SUM(quantity_change)`) inside the same transaction, and reports
  the repaired products via `RestoreSummary.reconciliations` so the fix is
  visible instead of silent;
- customer debt totals equal the sum of unpaid balances.

### 4.6 Privacy note

The backup JSON contains customer names and phone numbers in plain text. The
share sheet is only opened after an explicit warning in `BackupScreen`, and
the file is written under the app's documents directory.

## 5. Whitelist (tables + columns, fixed in code)

`business_profiles(id, business_name, owner_name, business_type, currency,
selected_locale, created_at, updated_at)`,
`app_settings(key, value, updated_at)`,
`customers(id, name, phone, note, is_active, created_at, updated_at)`,
`products(id, name, sku, category, sale_price_centimes, cost_price_centimes,
stock_quantity, minimum_stock_quantity, unit, is_active, created_at,
updated_at)`,
`sales(id, customer_id, status, subtotal_centimes, discount_centimes,
total_centimes, amount_paid_centimes, remaining_balance_centimes,
payment_method, currency, note, sold_at, created_at, updated_at)`,
`sale_items(id, sale_id, product_id, product_name_snapshot, quantity,
unit_sale_price_centimes, unit_cost_price_centimes, line_total_centimes,
created_at)`,
`customer_payments(id, customer_id, amount_centimes, payment_method, currency,
note, paid_at, created_at)`,
`inventory_movements(id, product_id, movement_type, quantity_change,
reference_sale_id, note, created_at)`.

## 6. File storage & sharing

- **Export:** write to `expo-file-system.documentDirectory` +
  `DukkanPro/backups/dukkanpro-backup-YYYY-MM-DD.json` (mkdir-first), then
  `Sharing.shareAsync(uri, { mimeType: "application/json",
  dialogTitle: … })`. The file stays on disk afterwards so the merchant can
  re-share it without re-exporting.
- **Import:** needs a file picker. Since **`expo-document-picker` is not
  installed**, the proposed single new dependency is
  `expo-document-picker@~57.x` (SDK-57-pinned), used only to pick a `.json`
  file and read it via `expo-file-system`. No cloud/URL import is proposed —
  offline-first is preserved.
- Both directory and picker are interior to the device; nothing leaves the
  merchant's hands except through the OS share sheet.

## 7. Code layout (as implemented)

```
src/services/backup/backupFormat.ts        // BACKUP_FORMAT constants, column whitelist, validateBackup() (pure)
src/services/backup/backupService.ts       // buildBackup(), createBackup(), restoreBackup()
src/services/backup/__tests__/backupService.test.ts   // 10 tests incl. the §8 round-trip
```

UI (later, separate change): a "Backup & Restore" entry in settings with two
buttons and the overwrite-confirmation dialog, reading a picked file into a
string and passing it to `restoreBackup`; `Sharing.shareAsync(uri)` for
export. No repository changes were needed.

## 8. Round-trip acceptance tests (implemented)

1. Seed a DB with a business profile, products (with opening stock), a
   completed sale, a payment, an inventory adjustment — spanning every table.
2. `createBackup()` → assert JSON structure (`format`, `backupVersion`,
   `databaseVersion`), every table non-empty, currency present.
3. `resetDatabase()` → assert all tables empty.
4. `restoreBackup(file)` → row counts per table equal the originals.
5. `SUM(quantity_change) == stock_quantity` per product (ledger invariant).
6. Customer debt totals match the pre-backup values.
7. Restore onto a **non-empty** DB without `confirmOverwrite` throws
   `OVERWRITE_REQUIRED` and leaves the existing data untouched (zero rows
   deleted).
8. A tampered file (unknown column) is rejected before any write.

## 9. Risks & open questions for review

- New dependency: `expo-document-picker` — the only genuinely required
  addition. Alternative (no new dep): import only from files this app itself
  wrote to `DukkanPro/backups/`, with a plain in-app file list instead of a
  picker. That is simpler but cannot import backups received via WhatsApp /
  downloaded to the device — which is the realistic restore scenario.
- Large DBs: export is pure JSON; ~10k sales ≈ a few MB, acceptable. A
  streaming/stream-compressed format is out of scope for v1.
- Restoring an *older* backup onto a *newer* app relies on forward-only
  migrations staying data-compatible (they are, by project rule 15 —
  migrations never rewrite history). Migration 14's CHECK constraints must
  hold for imported rows; if a legacy backup contained negative money, the
  import transaction will fail and roll back — the correct, loud outcome.
