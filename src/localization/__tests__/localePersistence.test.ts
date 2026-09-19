/**
 * Locale persistence — the selected locale must round-trip through a single
 * app_settings key. Before unification, onboarding wrote `selected_locale` while
 * the locale config read `selectedLocale`, so a merchant's onboarding choice was
 * silently dropped on reload.
 */
import { getDatabase } from "@/database/database";
import {
  readStoredLocaleFromAsyncStorage,
  storeLocaleInAsyncStorage,
} from "@/localization/localeConfig";
import { saveLocaleLocally } from "@/hooks/useOnboarding";

let db: any;

beforeAll(async () => {
  db = await getDatabase();
});

beforeEach(async () => {
  await db.runAsync("DELETE FROM app_settings");
});

describe("locale persistence", () => {
  it("round-trips the selected locale through the unified key", async () => {
    await storeLocaleInAsyncStorage("ar");
    expect(await readStoredLocaleFromAsyncStorage()).toBe("ar");
  });

  it("reads a locale written during onboarding", async () => {
    await saveLocaleLocally("en");
    expect(await readStoredLocaleFromAsyncStorage()).toBe("en");
  });

  it("defaults to French when nothing is stored", async () => {
    expect(await readStoredLocaleFromAsyncStorage()).toBe("fr");
  });
});
