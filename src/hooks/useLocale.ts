import { useEffect, useState } from "react";

import i18n from "@/localization/i18n";
import {
    getFormattedLocale,
    isSupportedLocale,
    readStoredLocaleFromAsyncStorage,
    storeLocaleInAsyncStorage
} from "@/localization/localeConfig";
import type { Locale } from "@/localization/types";

/**
 * Return type for the useLocale hook
 */
export interface UseLocaleReturn {
  /** Current selected locale */
  locale: Locale;
  /** Always false - the app remains LTR regardless of language */
  isRTL: false;
  /** Function to change the locale */
  changeLocale: (newLocale: Locale) => void;
  /** Function to get the formatted locale string for Intl formatting */
  getFormattedLocale: (locale: Locale) => string;
  /** Function to get the currency code for the locale */
  getCurrencyCode: (locale: Locale) => string;
}

/**
 * useLocale hook that provides locale information without calling I18nManager APIs
 *
 * Features:
 * - Returns current selected locale (persisted in AsyncStorage or device locale)
 * - Always returns isRTL as false - app remains LTR regardless of language
 * - changeLocale persists the selection and updates i18n
 * - Does NOT call global RTL APIs
 * - Language switching never triggers an RTL reload
 *
 * The entire application remains visually LTR regardless of selected language.
 * Arabic text may use right alignment inside individual text components or inputs
 * when appropriate, but the surrounding layout remains LTR.
 */
export function useLocale(): UseLocaleReturn {
  const [locale, setLocale] = useState<Locale>("fr");

  // Initialize locale from AsyncStorage or device locale on mount
  useEffect(() => {
    async function initializeLocale() {
      const storedLocale = await readStoredLocaleFromAsyncStorage();
      setLocale(storedLocale);
    }

    initializeLocale();
  }, []);

  /**
   * Change the application locale
   * - Persists the selection in SQLite
   * - Updates i18n next language dynamically
   * - Does NOT call global direction APIs (app stays LTR)
   */
  const changeLocale = (newLocale: Locale): void => {
    // Validate the locale is supported
    if (!isSupportedLocale(newLocale)) {
      __DEV__ && console.warn(`Unsupported locale: ${newLocale}`);
      return;
    }

    // Update i18n language (dynamic, no app reload)
    i18n.changeLanguage(newLocale);
    setLocale(newLocale);

    // Persist the selected locale in SQLite
    storeLocaleInAsyncStorage(newLocale).catch((error) => {
      if (__DEV__) {
        console.warn("Failed to store locale in SQLite:", error);
      }
    });
  };

  return {
    locale,
    isRTL: false,
    changeLocale,
    getFormattedLocale: (l: Locale) => getFormattedLocale(l),
    getCurrencyCode: (l: Locale) => {
      // All supported locales use DZD
      return "DZD";
    },
  };
}

/**
 * Read the selected locale from SQLite
 * Returns the default French locale if nothing is stored
 */
async function readStoredLocaleFromSQLite(): Promise<Locale> {
  return readStoredLocaleFromAsyncStorage();
}
