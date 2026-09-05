import { type SQLiteDatabase } from "expo-sqlite";

/**
 * Execute a read-only statement and return the first row.
 */
export async function executeRead<T>(
  db: SQLiteDatabase,
  sql: string,
  params: Array<any> = [],
): Promise<T[]> {
  const result = await db.getAllAsync(
    sql,
    ...params.map((param) => param ?? null),
  );
  return result as T[];
}

/**
 * Execute a statement and return all rows (array).
 */
export async function executeAll<T>(
  db: SQLiteDatabase,
  sql: string,
  params: Array<any> = [],
): Promise<T[]> {
  const results = await db.getAllAsync(
    sql,
    ...params.map((param) => param ?? null),
  );
  return results as T[];
}

/**
 * Execute a write statement (INSERT / UPDATE / DELETE) and return the last inserted rowID.
 */
export async function executeWrite(
  db: SQLiteDatabase,
  sql: string,
  params: Array<any> = [],
): Promise<number> {
  const result = await db.runAsync(
    sql,
    ...params.map((param) => param ?? null),
  );
  return result.lastInsertRowId;
}

/**
 * Run a function inside a SQLite transaction.
 */
export async function transaction<T>(
  db: SQLiteDatabase,
  fn: (db: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  await db.execAsync("BEGIN IMMEDIATE");
  try {
    const result = await fn(db);
    await db.execAsync("COMMIT");
    return result;
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
}
