/**
 * database.test.ts — singleton initialization recovery.
 *
 * When open/migrate rejects, the pending promise must be cleared so the next
 * getDatabase() call can retry instead of failing forever until restart.
 */
import * as expoSqlite from "expo-sqlite";

import { closeDatabase, getDatabase } from "../database";

describe("getDatabase failure recovery", () => {
  let openSpy: jest.SpyInstance;

  afterEach(async () => {
    openSpy?.mockRestore();
    await closeDatabase();
  });

  it("does not poison the next getDatabase() call when initialization fails", async () => {
    openSpy = jest
      .spyOn(expoSqlite, "openDatabaseAsync")
      .mockRejectedValueOnce(new Error("simulated open failure"));

    await expect(getDatabase()).rejects.toThrow("simulated open failure");

    // The failed promise was cleared: a later call re-opens from scratch.
    const db = await getDatabase();
    expect(openSpy).toHaveBeenCalledTimes(2);
    const rows: any[] = await db.getAllAsync(`SELECT 1 AS one`);
    expect(rows[0]?.one).toBe(1);
  });

  it("wraps non-Error rejections in a typed error the UI can show", async () => {
    openSpy = jest
      .spyOn(expoSqlite, "openDatabaseAsync")
      .mockRejectedValueOnce("boom");

    await expect(getDatabase()).rejects.toThrow(/DATABASE_INIT_FAILED/);
  });
});
