import { useEffect, useState } from "react";

import i18n, { changeLocale as changeI18nLocale } from "@/localization/i18n";
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
  /** True when Arabic locale is selected */
  isRTL: boolean;
  /** Function to change the locale */
  changeLocale: (newLocale: Locale) => void;
  /** Function to get the formatted locale string for Intl formatting */
  getFormattedLocale: (locale: Locale) => string;
  /** Function to get the currency code for the locale */
  getCurrencyCode: (locale: Locale) => string;
}

/**
 * useLocale hook that provides locale and RTL layout information
 */
export function useLocale(): UseLocaleReturn {
  const [locale, setLocale] = useState<Locale>(
    (i18n.language as Locale) || "fr"
  );

  // Initialize locale from AsyncStorage or device locale on mount
  useEffect(() => {
    async function initializeLocale() {
      const storedLocale = await readStoredLocaleFromAsyncStorage();
      if (storedLocale && isSupportedLocale(storedLocale)) {
        setLocale(storedLocale);
      }
    }

    initializeLocale();

    const handleLangChange = (lng: string) => {
      if (isSupportedLocale(lng)) {
        setLocale(lng);
      }
    };
    i18n.on("languageChanged", handleLangChange);
    return () => {
      i18n.off("languageChanged", handleLangChange);
    };
  }, []);

  /**
   * Change the application locale
   */
  const changeLocale = (newLocale: Locale): void => {
    // Validate the locale is supported
    if (!isSupportedLocale(newLocale)) {
      __DEV__ && console.warn(`Unsupported locale: ${newLocale}`);
      return;
    }

    // Update i18n language & direction
    changeI18nLocale(newLocale);
    setLocale(newLocale);

    // Persist the selected locale in storage
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
    getCurrencyCode: () => "DZD",
  };
}

