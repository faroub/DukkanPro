import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

import i18n, { changeLocale as changeI18nLocale } from "@/localization/i18n";
import {
    getCurrentDeviceLocale,
    isSupportedLocale,
    readStoredLocaleFromAsyncStorage,
    storeLocaleInAsyncStorage,
} from "@/localization/localeConfig";
import type { Locale } from "@/localization/types";

export type { Locale };

/**
 * LocaleProviderProps interface
 */
export interface LocaleProviderProps {
  children: React.ReactNode;
}

/**
 * LocaleProvider provides internationalization for the Dukkan OS application.
 *
 * Features:
 * - Initializes i18next with French as the default language
 * - Detects device locale on first launch using expo-localization
 * - Persists selected locale in AsyncStorage (merchant override)
 * - Language switching does NOT trigger RTL layout changes
 * - The entire application remains visually LTR regardless of selected language
 * - Arabic text may use right alignment inside individual components only
 */
export function LocaleProvider({ children }: LocaleProviderProps) {
  // Initialize locale from SQLite or device locale on first mount
  useEffect(() => {
    async function initializeLocale() {
      // Read the stored locale from AsyncStorage (merchant selection override)
      const storedLocale = await readStoredLocaleFromAsyncStorage();

      // If a merchant has selected a locale, use it; otherwise detect device locale
      let locale: Locale;
      if (storedLocale && isSupportedLocale(storedLocale)) {
        locale = storedLocale;
      } else {
        // Detect device locale and map to supported locale
        const deviceLocale = getCurrentDeviceLocale();
        locale = deviceLocale;
      }

      // Set the i18n language (does not reload the app, changes are dynamic)
      changeI18nLocale(locale);

      // Store the selected locale in AsyncStorage
      await storeLocaleInAsyncStorage(locale);
    }

    initializeLocale();
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  /**
   * Change the application locale
   * - Persists the selection in SQLite
   * - Updates i18n next language dynamically
   * - Does NOT call I18nManager APIs (app stays LTR)
   * - Language switching never triggers an RTL reload
   */
  const changeLocale = (newLocale: Locale): void => {
    // Validate the locale is supported
    if (!isSupportedLocale(newLocale)) {
      __DEV__ && console.warn(`Unsupported locale: ${newLocale}`);
      return;
    }

    // Update i18n language (dynamic, no app reload)
    changeI18nLocale(newLocale);

    // Store the selected locale in SQLite
    // This is the merchant's override of device locale
    storeLocaleInAsyncStorage(newLocale).catch((error) => {
      if (__DEV__) {
        console.warn("Failed to store locale in SQLite:", error);
      }
    });
  };

  // Sync locale state with i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      // Update locale state to match i18n, but keep isRTL as false
      // The app layout remains LTR regardless of language
      if (isSupportedLocale(lng as Locale)) {
        // Locale is informational only; layout direction is always LTR
        // We do NOT enable global RTL layout
      }
    };
    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  // Expose the current locale from i18n for use by children
  const locale = i18n.language as Locale | "fr";

  // Ensure French is the default if i18n is not yet initialized
  const safeLocale: Locale = isSupportedLocale(locale as Locale)
    ? (locale as Locale)
    : "fr";

  return (
    // Provide i18n context to the rest of the app via React context
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );
}

/**
 * Types exported on the LocaleProvider for external use
 */
LocaleProvider.types = ["ar", "fr", "en"];
LocaleProvider.defaultType = "fr";
LocaleProvider.current = i18n;
