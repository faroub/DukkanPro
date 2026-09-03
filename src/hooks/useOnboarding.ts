import * as AsyncStorage from '@react-native-async-storage/async-storage';
import type { Locale } from '@/localization/types';

declare global {
  interface AsyncStorage {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
  }
}

/**
 * Onboarding profile shape
 * Saved to SQLite for the business profile and AsyncStorage for completion flag
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
 * Reads from AsyncStorage
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const stored = (AsyncStorage as any).getItem('onboardingComplete');
    if (stored === 'true') {
      return true;
    }
    if (stored === 'false') {
      return false;
    }
    // No stored value — default to false (need onboarding)
    return false;
  } catch (error) {
    // AsyncStorage may not be available (e.g., web)
    if (__DEV__) {
      console.warn('Failed to read onboarding completion from AsyncStorage:', error);
    }
    return false;
  }
}

/**
 * Persist the onboarding completion flag to AsyncStorage
 */
export async function saveOnboardingComplete(flag: boolean): Promise<void> {
  try {
    ;(AsyncStorage as any).setItem('onboardingComplete', flag ? 'true' : 'false');
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to save onboarding completion to AsyncStorage:', error);
    }
  }
}

/**
 * Persist the business profile to SQLite
 * and the selected locale to AsyncStorage
 */
export async function saveProfileLocally(profile: OnboardingProfile): Promise<void> {
  // Save locale to AsyncStorage
  await saveLocaleLocally(profile.locale);

  // Save business profile to SQLite
  // SQLite is available via expo-sqlite
  try {
    const db = await require('expo-sqlite').openDatabaseAsync('dukkanos.db');

    // Create onboarding table if not exists
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS onboarding_profiles (
        id INTEGER PRIMARY KEY DEFAULT 1,
        business_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        business_type TEXT NOT NULL,
        locale TEXT NOT NULL,
        currency TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    const now = Date.now();

    await db.execAsync(`
      INSERT OR REPLACE INTO onboarding_profiles (id, business_name, owner_name, business_type, locale, currency, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?)
    `, [profile.businessName, profile.ownerName, profile.businessType, profile.locale, profile.currency, now]);
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to save business profile to SQLite:', error);
    }
    throw error;
  }
}

/**
 * Save the selected locale to AsyncStorage
 */
export async function saveLocaleLocally(locale: Locale): Promise<void> {
  try {
    ;(AsyncStorage as any).setItem('selectedLocale', locale);
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to save selected locale to AsyncStorage:', error);
    }
  }
}

/**
 * Read the selected locale from AsyncStorage
 * Returns French as default if nothing is stored
 */
export async function readStoredLocaleFromAsyncStorage(): Promise<Locale> {
  try {
    const stored = (AsyncStorage as any).getItem('selectedLocale');
    if (!stored) {
      return 'fr';
    }
    // Validate supported locale
    if (['ar', 'fr', 'en'].includes(stored)) {
      return stored as Locale;
    }
    return 'fr';
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to read selected locale from AsyncStorage:', error);
    }
    return 'fr';
  }
}

/**
 * Complete the onboarding flow
 * - Saves the profile to SQLite
 * - Saves the onboarding completion flag to AsyncStorage
 * - Does NOT change the language direction (remains LTR)
 */
export async function completeOnboarding(profile: OnboardingProfile): Promise<void> {
  // Save profile to SQLite
  await saveProfileLocally(profile);

  // Save completion flag to AsyncStorage
  await saveOnboardingComplete(true);

  if (__DEV__) {
    console.log('Onboarding completed successfully', profile);
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