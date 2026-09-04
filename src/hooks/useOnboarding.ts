import type { Locale } from "@/localization/types";
import { dbAll, dbWrite } from "@/database/database";

/**
 * Onboarding profile shape
 * Saved to SQLite for the business profile and completion flag
 */
export type OnboardingProfile = {
  businessName: string;
  ownerName: string;
  businessType: string;
  locale: Locale;
  currency: string;
};

/**
 * Check if onboarding has been completed
 * Reads from SQLite table 'app_settings'
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const rows = await dbAll<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ?",
      ["onboarding_complete"],
    );
    return rows.length > 0 && rows[0].value === "true";
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to read onboarding completion from SQLite:", error);
    }
    return false;
  }
}

/**
 * Persist the onboarding completion flag to SQLite
 */
export async function saveOnboardingComplete(flag: boolean): Promise<void> {
  try {
    const value = flag ? "true" : "false";
    await dbWrite(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
      ["onboarding_complete", value],
    );
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to save onboarding completion to SQLite:", error);
    }
  }
}

/**
 * Persist the business profile to SQLite
 * and the selected locale to SQLite
 */
export async function saveProfileLocally(
  profile: OnboardingProfile,
): Promise<void> {
  // Save locale to SQLite
  await saveLocaleLocally(profile.locale);

  // Save business profile to SQLite
  try {
    await dbWrite(
      `INSERT OR REPLACE INTO business_profiles 
       (id, business_name, owner_name, business_type, selected_locale, currency, created_at, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        profile.businessName,
        profile.ownerName,
        profile.businessType,
        profile.locale,
        profile.currency,
      ],
    );
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to save business profile to SQLite:", error);
    }
    throw error;
  }
}

/**
 * Save the selected locale to SQLite
 */
export async function saveLocaleLocally(locale: Locale): Promise<void> {
  try {
    await dbWrite(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
      ["selected_locale", locale],
    );
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to save selected locale to SQLite:", error);
    }
  }
}

/**
 * Read the selected locale from SQLite
 * Returns French as default if nothing is stored
 */
export async function readStoredLocaleFromAsyncStorage(): Promise<Locale> {
  try {
    const rows = await dbAll<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ?",
      ["selected_locale"],
    );
    if (rows.length === 0) {
      return "fr";
    }
    const stored = rows[0].value;
    // Validate supported locale
    if (["ar", "fr", "en"].includes(stored)) {
      return stored as Locale;
    }
    return "fr";
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to read selected locale from SQLite:", error);
    }
    return "fr";
  }
}

/**
 * Complete the onboarding flow
 * - Saves the profile to SQLite
 * - Saves the onboarding completion flag to SQLite
 */
export async function completeOnboarding(
  profile: OnboardingProfile,
): Promise<void> {
  // Save profile to SQLite
  await saveProfileLocally(profile);

  // Save completion flag to SQLite
  await saveOnboardingComplete(true);

  if (__DEV__) {
    console.log("Onboarding completed successfully", profile);
  }
}

/**
 * Hook namespace providing onboarding utilities
 * Used by: import { useOnboarding } from '@/hooks/useOnboarding'
 */
export const useOnboarding = {
  isOnboardingComplete,
  completeOnboarding,
  saveProfileLocally,
  saveLocaleLocally,
  readStoredLocaleFromAsyncStorage,
};
