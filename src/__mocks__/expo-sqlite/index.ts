import type { SQLiteOpenOptions } from "expo-sqlite";

const initSqlJs: () => Promise<any> = require("sql.js");

function normalizeParams(params: any[]): any[] {
  return params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
}

/**
 * Mock for expo-sqlite used in Jest tests.
 *
 * This mock provides the NativeDatabase constructor that the actual
 * expo-sqlite code expects. The jest-expo preset mocks ExpoSQLite
 * but was missing NativeDatabase, causing:
 *   TypeError: _ExpoSQLite.default.NativeDatabase is not a constructor
 */


/**
 * Mock NativeDatabase class - mimics the interface used by ExpoSQLite.
 * The actual repository tests don't need full SQLite functionality,
 * just enough to prevent "NativeDatabase is not a constructor" errors.
 */
export class NativeDatabase {
  constructor(
    public databasePath: string,
    public options?: SQLiteOpenOptions,
  ) {}

  // Asynchronous API - mock implementations
  public initAsync(): Promise<void> {
    return Promise.resolve();
  }
  public isInTransactionAsync(): Promise<boolean> {
    return Promise.resolve(false);
  }
  public closeAsync(): Promise<void> {
    return Promise.resolve();
  }
  public execAsync(source: string): Promise<void> {
    return Promise.resolve();
  }
  public serializeAsync(databaseName: string): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array(0));
  }
  public prepareAsync(nativeStatement: any, source: string): Promise<any> {
    return Promise.resolve({ ...nativeStatement, source });
  }
  public createSessionAsync(nativeSession: any, dbName: string): Promise<any> {
    return Promise.resolve(nativeSession);
  }
  public loadExtensionAsync(
    libPath: string,
    entryPoint?: string,
  ): Promise<void> {
    return Promise.resolve();
  }

  // Synchronous API - mock implementations
  public initSync(): void {
    // No-op
  }
  public isInTransactionSync(): boolean {
    return false;
  }
  public closeSync(): void {
    // No-op
  }
  public execSync(source: string): void {
    // No-op
  }
  public serializeSync(databaseName: string): Uint8Array {
    return new Uint8Array(0);
  }
  public prepareSync(nativeStatement: any, source: string): any {
    return { ...nativeStatement, source };
  }
}

class MockSQLiteDatabase {
  constructor(private readonly database: any) {}

  async execAsync(source: string): Promise<void> {
    this.database.exec(source);
  }

  async getAllAsync<T = any>(source: string, ...params: any[]): Promise<T[]> {
    const statement = this.database.prepare(source);
    try {
      statement.bind(normalizeParams(params));
      const rows: T[] = [];
      while (statement.step()) {
        rows.push(statement.getAsObject() as T);
      }
      return rows;
    } finally {
      statement.free();
    }
  }

  async getFirstAsync<T = any>(
    source: string,
    ...params: any[]
  ): Promise<T | null> {
    const rows = await this.getAllAsync<T>(source, ...params);
    return rows[0] ?? null;
  }

  async runAsync(
    source: string,
    ...params: any[]
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const statement = this.database.prepare(source);
    try {
      statement.run(normalizeParams(params));
      const row = this.database.exec("SELECT last_insert_rowid() AS id")[0];
      return {
        lastInsertRowId: row?.values[0]?.[0] ?? 0,
        changes: this.database.getRowsModified(),
      };
    } finally {
      statement.free();
    }
  }

  async closeAsync(): Promise<void> {
    this.database.close();
  }
}

/**
 * Mock ExpoSQLite object - provides NativeDatabase constructor and other methods.
 * The actual code uses ExpoSQLite.NativeDatabase to create database instances.
 * This must be a named export matching the jest-expo module mock configuration.
 */
export const ExpoSQLite = {
  NativeDatabase,
  // Additional methods that the code might reference
  backupDatabaseAsync: async () => {},
  backupDatabaseSync: () => {},
  deleteDatabaseAsync: async () => {},
  deleteDatabaseSync: () => {},
  ensureDatabasePathExistsAsync: async () => {},
  ensureDatabasePathExistsSync: () => {},
  importAssetDatabaseAsync: async () => {},
  removeListeners: () => {},
  addListener: () => {},
  bundledExtensions: {},
  defaultDatabaseDirectory: "",
};

export async function openDatabaseAsync(): Promise<any> {
  const SQL = await initSqlJs();
  return new MockSQLiteDatabase(new SQL.Database());
}
