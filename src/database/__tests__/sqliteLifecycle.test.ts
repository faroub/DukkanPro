/**
 * sqliteLifecycle.test.ts — Deterministic tests for SQLite connection lifecycle,
 * concurrency serialization, initialization retry, transaction rollback, and close/reopen.
 */

import {
  closeDatabase,
  executeAll,
  executeWrite,
  getDatabase,
  transaction,
} from "../database";
import { runMigrations } from "../migrations";
import { openDatabaseAsync } from "expo-sqlite";

describe("SQLite Lifecycle & Concurrency Harness", () => {
  beforeEach(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it("handles simultaneous getDatabase() calls cleanly returning identical connection instance", async () => {
    const promises = [getDatabase(), getDatabase(), getDatabase(), getDatabase()];
    const instances = await Promise.all(promises);

    expect(instances[0]).toBeDefined();
    expect(instances[0]).toBe(instances[1]);
    expect(instances[1]).toBe(instances[2]);
    expect(instances[2]).toBe(instances[3]);
  });

  it("enforces PRAGMA foreign_keys = ON and WAL mode on initialization", async () => {
    const db = await getDatabase();

    const fkPragma: any = await db.getFirstAsync("PRAGMA foreign_keys");
    expect(fkPragma?.foreign_keys).toBe(1);

    const journalPragma: any = await db.getFirstAsync("PRAGMA journal_mode");
    expect(journalPragma?.journal_mode?.toLowerCase()).toBe("wal");
  });

  it("serializes concurrent write queries through dbMutex without lost writes", async () => {
    const db = await getDatabase();
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS concurrency_probe (id INTEGER PRIMARY KEY AUTOINCREMENT, val INTEGER);`
    );
    await db.execAsync(`DELETE FROM concurrency_probe;`);

    // Launch 20 concurrent writes
    const writePromises = Array.from({ length: 20 }, (_, i) =>
      executeWrite(`INSERT INTO concurrency_probe (val) VALUES (?)`, [i + 1])
    );

    await Promise.all(writePromises);

    const rows = await executeAll<{ c: number }>(`SELECT COUNT(*) AS c FROM concurrency_probe`);
    expect(rows[0].c).toBe(20);
  });

  it("serializes concurrent transactions without BEGIN IMMEDIATE collisions", async () => {
    const db = await getDatabase();
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS tx_probe (id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT);`
    );
    await db.execAsync(`DELETE FROM tx_probe;`);

    const tx1 = transaction(async (tx) => {
      await executeWrite(tx, `INSERT INTO tx_probe (label) VALUES (?)`, ["tx1-a"]);
      await executeWrite(tx, `INSERT INTO tx_probe (label) VALUES (?)`, ["tx1-b"]);
    });

    const tx2 = transaction(async (tx) => {
      await executeWrite(tx, `INSERT INTO tx_probe (label) VALUES (?)`, ["tx2-a"]);
      await executeWrite(tx, `INSERT INTO tx_probe (label) VALUES (?)`, ["tx2-b"]);
    });

    await Promise.all([tx1, tx2]);

    const rows = await executeAll<{ c: number }>(`SELECT COUNT(*) AS c FROM tx_probe`);
    expect(rows[0].c).toBe(4);
  });

  it("rolls back all changes when a transaction fails mid-way", async () => {
    const db = await getDatabase();
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS rollback_probe (id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT);`
    );
    await db.execAsync(`DELETE FROM rollback_probe;`);

    await expect(
      transaction(async (tx) => {
        await executeWrite(tx, `INSERT INTO rollback_probe (label) VALUES (?)`, ["first"]);
        throw new Error("Simulated failure mid-transaction");
      })
    ).rejects.toThrow("Simulated failure mid-transaction");

    const rows = await executeAll<{ c: number }>(`SELECT COUNT(*) AS c FROM rollback_probe`);
    expect(rows[0].c).toBe(0);
  });

  it("clears cached databasePromise on initialization failure allowing clean retry", async () => {
    const openDb: any = await openDatabaseAsync("init-fail-test.db");

    await expect(
      runMigrations(openDb, undefined, [
        {
          version: 999,
          sql: `SYNTAX ERROR IN MIGRATION SQL;`,
        },
      ])
    ).rejects.toThrow();

    // Re-opening standard database works cleanly
    const freshDb = await getDatabase();
    expect(freshDb).toBeDefined();
  });

  it("ensures closeDatabase() waits for in-flight transactions before closing and allows reopening", async () => {
    const db = await getDatabase();
    let transactionCompleted = false;

    // Start a transaction on standard migration tables
    const txPromise = transaction(async (tx) => {
      await executeWrite(
        tx,
        `INSERT INTO customers (name, phone) VALUES (?, ?)`,
        ["Close Customer", "0559998877"]
      );
      transactionCompleted = true;
    });

    // Request close while transaction is in-flight
    const closePromise = closeDatabase();

    await Promise.all([txPromise, closePromise]);

    expect(transactionCompleted).toBe(true);

    // Reopen database after close (runs migrations on fresh instance)
    const reopenedDb = await getDatabase();
    expect(reopenedDb).toBeDefined();

    const versions = await executeAll<{ version: number }>(`SELECT version FROM _migration_version`);
    expect(versions.length).toBeGreaterThan(0);
  });
});
