import { type SQLiteDatabase } from "expo-sqlite";

/**
 * Single-threaded promise-chain Async Mutex.
 * Serializes all SQLite database reads, writes, and transactions on the singleton connection.
 * Prevents:
 * 1. Concurrent transaction collision (BEGIN IMMEDIATE throwing when a transaction is already active).
 * 2. Silent data loss from non-transactional writes executing inside an unrelated open transaction.
 */
export class AsyncMutex {
  private queue: Promise<any> = Promise.resolve();
  private isLocked: boolean = false;

  public runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let resolveOuter!: (val: T) => void;
    let rejectOuter!: (err: any) => void;

    const resultPromise = new Promise<T>((res, rej) => {
      resolveOuter = res;
      rejectOuter = rej;
    });

    const task = async () => {
      this.isLocked = true;
      try {
        const res = await fn();
        resolveOuter(res);
      } catch (err) {
        rejectOuter(err);
      } finally {
        this.isLocked = false;
      }
    };

    this.queue = this.queue.then(task, task);
    return resultPromise;
  }

  public get locked(): boolean {
    return this.isLocked;
  }
}

export const dbMutex = new AsyncMutex();

/**
 * Low-level un-mutexed prepared statement runners.
 * Only raw* functions are exported here to ensure callers outside database initialization
 * cannot accidentally import non-mutexed helpers.
 */
export async function rawExecuteRead<T = any>(
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

export const rawExecuteAll = rawExecuteRead;

/**
 * Escapes special characters (%, _, \) for SQLite LIKE wildcard queries.
 */
export function escapeLike(query: string): string {
  return query.replace(/[%_\\]/g, "\\$&");
}

export async function rawExecuteWrite(
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

export async function rawTransaction<T>(
  db: SQLiteDatabase,
  fn: (db: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  await db.execAsync("BEGIN IMMEDIATE");
  try {
    const result = await fn(db);
    await db.execAsync("COMMIT");
    return result;
  } catch (error) {
    try {
      await db.execAsync("ROLLBACK");
    } catch {}
    throw error;
  }
}
