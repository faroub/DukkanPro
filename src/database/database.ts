/**
 * Database.ts — Database initialization and singleton connection for Dukkan OS.
 *
 * - Uses expo-sqlite (Expo SDK 57 compatible).
 - Enables foreign keys and WAL mode on every connection.
 - Exposes a single database instance via getDatabase().
 - Provides `executeRead` and `executeWrite` helpers that return prepared-statement
   runners. Callers must not perform raw SQL string concatenation; use the provided
   helpers or import `schema.sql` strings and pass them as callbacks.
 - Transactions are provided via `transaction()`.
 - Seed data loads only in development (__DEV__).
 */

import { openDatabase } from "expo-sqlite";
import { runMigrations } from "./migrations";
import { schema } from "./schema";

// Use a persistent database file in the app's document cache.
// On Android: /data/user/.../files/DukkanOS.db
// On iOS:     Library/DukkanOS.db
// On web:     expo-sqlite uses a relative path indexedDB-like store.
const DATABASE_NAME = "DukkanOS.db";
const DATABASE_DESCRIPTION = "Dukkan OS — offline-first business app";

let database: any = null;

/**
 * Returns the singleton SQLite database instance, opening it if needed.
 */
export async function getDatabase() {
  if (database) {
    return database;
  }

  database = await openDatabase(DATABASE_NAME, DATABASE_DESCRIPTION);

  // --- Setup pragmas on every fresh connection ---
  // Foreign keys must be set on every connection (SQLite does not persist across connections).
  // WAL mode improves concurrent read/write performance.
  await database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA cache_size = -64000; -- 64MB cache
  `);

  // --- Run migrations (idempotent, tracked in _migration_version) ---
  await runMigrations(database);

  // --- Development-only seed data ---
  if (__DEV__) {
    await seed(database);
  }

  return database;
}

/**
 * Closes the database connection.
 * Call on app unload (e.g., in an Effect cleanup).
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    await database.closeAsync();
    database = null;
  }
}

/**
 * Execute a read-only statement and return the first row.
 * The callback receives a `statement` object from `database.run()` or `database.exec()`.
 */
export async function executeRead<T>(
  db: any,
  sql: string,
  params: Array<any> = [],
): Promise<T | null> {
  const result = await db.getFirstSync(sql, ...params);
  return result as T | null;
}

/**
 * Execute a statement and return all rows (array).
 */
export async function executeAll<T>(
  db: any,
  sql: string,
  params: Array<any> = [],
): Promise<T[]> {
  const results: T[] = await db.getAllSync(sql, ...params);
  return results;
}

/**
 * Execute a write statement (INSERT / UPDATE / DELETE) and return the last inserted rowID.
 */
export async function executeWrite(
  db: any,
  sql: string,
  params: Array<any> = [],
): Promise<number> {
  const result = await db.runSync(sql, ...params);
  return result.lastInsertRowId;
}

/**
 * Run a function inside a SQLite transaction.
 * If the callback throws, the transaction is rolled back and the error is re-thrown.
 */
export async function transaction<T>(
  db: any,
  fn: (tx: any) => Promise<T>,
): Promise<T> {
  await db.run("BEGIN IMMEDIATE");
  try {
    const result = await fn(db);
    await db.run("COMMIT");
    return result;
  } catch (error) {
    await db.run("ROLLBACK");
    throw error;
  }
}

/**
 * Expose the schema SQL strings externally so callers can build their own queries
 * without writing raw strings. Import { schema } from "@/database/schema".
 */
export { schema };