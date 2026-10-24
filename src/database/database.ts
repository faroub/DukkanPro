/**
 * Database.ts — Database initialization and singleton connection for Dukkan OS.
 *
 * - Uses expo-sqlite (Expo SDK 57 compatible).
 * - Enables foreign keys and WAL mode on every connection.
 * - Exposes a single database instance via getDatabase().
 * - Serializes ALL reads, writes, and transactions through an AsyncMutex queue.
 * - Prevents concurrent transaction collision and silent data loss from interleaved writes.
 */

import { AsyncLocalStorage } from "async_hooks";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { runMigrations } from "./migrations";
import { schema } from "./schema";
import { seed } from "./seed";
import {
  dbMutex,
  rawExecuteAll,
  rawExecuteRead,
  rawExecuteWrite,
  rawTransaction,
} from "./query";

const DATABASE_NAME = "DukkanPro.db";

let database: SQLiteDatabase | null = null;
let databasePromise: Promise<SQLiteDatabase> | null = null;

export const transactionContext = new AsyncLocalStorage<SQLiteDatabase>();

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

function isSQLiteDatabase(obj: any): obj is SQLiteDatabase {
  return obj && typeof obj === "object" && typeof obj.runAsync === "function";
}

/**
 * Execute a read query returning all rows.
 * Re-entrant inside active transactions; serialized via dbMutex for standalone queries.
 */
export async function executeAll<T>(
  firstArg: SQLiteDatabase | string,
  secondArg?: string | any[],
  thirdArg: any[] = [],
): Promise<T[]> {
  if (isSQLiteDatabase(firstArg)) {
    return rawExecuteAll<T>(firstArg, secondArg as string, thirdArg);
  }

  const activeTxDb = transactionContext.getStore();
  if (activeTxDb) {
    return rawExecuteAll<T>(activeTxDb, firstArg as string, (secondArg as any[]) || []);
  }

  const sql = firstArg as string;
  const params = (secondArg as any[]) || [];
  return dbMutex.runExclusive(async () => {
    const db = await getDatabase();
    return rawExecuteAll<T>(db, sql, params);
  });
}

/**
 * Execute a read query returning first row.
 * Re-entrant inside active transactions; serialized via dbMutex for standalone queries.
 */
export async function executeRead<T>(
  firstArg: SQLiteDatabase | string,
  secondArg?: string | any[],
  thirdArg: any[] = [],
): Promise<T[]> {
  if (isSQLiteDatabase(firstArg)) {
    return rawExecuteRead<T>(firstArg, secondArg as string, thirdArg);
  }

  const activeTxDb = transactionContext.getStore();
  if (activeTxDb) {
    return rawExecuteRead<T>(activeTxDb, firstArg as string, (secondArg as any[]) || []);
  }

  const sql = firstArg as string;
  const params = (secondArg as any[]) || [];
  return dbMutex.runExclusive(async () => {
    const db = await getDatabase();
    return rawExecuteRead<T>(db, sql, params);
  });
}

/**
 * Execute a write query (INSERT / UPDATE / DELETE).
 * Re-entrant inside active transactions; serialized via dbMutex for standalone queries.
 */
export async function executeWrite(
  firstArg: SQLiteDatabase | string,
  secondArg?: string | any[],
  thirdArg: any[] = [],
): Promise<number> {
  if (isSQLiteDatabase(firstArg)) {
    return rawExecuteWrite(firstArg, secondArg as string, thirdArg);
  }

  const activeTxDb = transactionContext.getStore();
  if (activeTxDb) {
    return rawExecuteWrite(activeTxDb, firstArg as string, (secondArg as any[]) || []);
  }

  const sql = firstArg as string;
  const params = (secondArg as any[]) || [];
  return dbMutex.runExclusive(async () => {
    const db = await getDatabase();
    return rawExecuteWrite(db, sql, params);
  });
}

/**
 * Run a function inside a SQLite transaction, serialized via dbMutex.
 */
export async function transaction<T>(
  firstArg: SQLiteDatabase | ((db: SQLiteDatabase) => Promise<T>),
  secondArg?: (db: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const fn = isSQLiteDatabase(firstArg) ? secondArg! : firstArg;
  return dbMutex.runExclusive(async () => {
    const db = await getDatabase();
    return transactionContext.run(db, async () => {
      return rawTransaction(db, fn);
    });
  });
}

export { dbMutex, executeAll as dbAll, executeRead as dbRead, executeWrite as dbWrite, schema };
