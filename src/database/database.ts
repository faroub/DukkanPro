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

import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { runMigrations } from "./migrations";
import { schema } from "./schema";
import { seed } from "./seed";
import { executeAll, executeRead, executeWrite, transaction } from "./query";

// Use a persistent database file in the app's document cache.
// On Android: /data/user/.../files/DukkanOS.db
// On iOS:     Library/DukkanOS.db
// On web:     expo-sqlite uses a relative path indexedDB-like store.
const DATABASE_NAME = "DukkanOS.db";
const DATABASE_DESCRIPTION = "Dukkan OS — offline-first business app";

let database: SQLiteDatabase | null = null;
let databasePromise: Promise<SQLiteDatabase> | null = null;

/**
 * Returns the singleton SQLite database instance, opening it if needed.
 */
export async function getDatabase() {
  if (database) {
    return database;
  }

  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = (async () => {
    const db = await openDatabaseAsync(DATABASE_NAME);

    // --- Setup pragmas on every fresh connection ---
    // Foreign keys must be set on every connection (SQLite does not persist across connections).
    // WAL mode improves concurrent read/write performance.
    await db.execAsync(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA cache_size = -64000; -- 64MB cache
    `);

    // --- Run migrations (idempotent, tracked in _migration_version) ---
    await runMigrations(db);

    // --- Development-only seed data ---
    if (__DEV__ && process.env.NODE_ENV !== "test" && !process.env.JEST_WORKER_ID) {
      await seed(db);
    }

    database = db;
    return db;
  })();

  return databasePromise;
}

/**
 * Closes the database connection.
 * Call on app unload (e.g., in an Effect cleanup).
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    await database.closeAsync();
    database = null;
    databasePromise = null;
  }
}

/**
 * Re-export query helpers for convenience, now binding them to the default database
 */
export async function dbAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDatabase();
  return executeAll<T>(db, sql, params);
}

export async function dbRead<T>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDatabase();
  return executeRead<T>(db, sql, params);
}

export async function dbWrite(sql: string, params: any[] = []): Promise<number> {
  const db = await getDatabase();
  return executeWrite(db, sql, params);
}

/**
 * Expose the schema SQL strings externally so callers can build their own queries
 * without writing raw strings. Import { schema } from "@/database/schema".
 */
export { schema, transaction };
export { dbAll as executeAll, dbRead as executeRead, dbWrite as executeWrite };
