import * as SQLite from "expo-sqlite";
import React, { createContext, useEffect, useMemo, useState } from "react";

export type DB = SQLite.SQLiteDatabase | null;

export const DatabaseContext = createContext<{
  db: DB;
  init: () => Promise<void>;
} | null>(null);

export interface DatabaseProviderProps {
  children: React.ReactNode;
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync("dukkanos.db");
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      payment TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER REFERENCES sales(id),
      amount INTEGER NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  return database;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<DB>(null);
  const [isInit, setIsInit] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initDB = async () => {
      try {
        const dbInstance = await openDatabase();

        setDb(dbInstance);
      } catch (error) {
        console.error("Database initialization error:", error);
      } finally {
        setIsInit(false);
      }
    };

    initDB();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      db,
      init: async () => {
        if (!db) {
          const database = await openDatabase();
          setDb(database);
        }
      },
    }),
    [db],
  );

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}
