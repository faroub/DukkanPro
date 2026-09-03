import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { useEffect } from "react";

import i18n from "@/localization/i18n";
import { changeLocale as changeI18nLocale } from "@/localization/i18n";
import type { Locale } from "@/localization/types";
import {
  getCurrentDeviceLocale,
  getFormattedLocale,
  isSupportedLocale,
  readStoredLocaleFromAsyncStorage,
  storeLocaleInAsyncStorage,
} from "@/localization/localeConfig";

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
  // Initialize locale from AsyncStorage or device locale on first mount
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
   * - Persists the selection in AsyncStorage
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

    // Persist the selected locale in AsyncStorage
    // This is the merchant's override of device locale
    AsyncStorage.setItem("selectedLocale", newLocale);
  };

  // Sync locale state with i18n language changes
  useEffect(() => {
    const listener = i18n.on("languageChanged", (lng: string) => {
      // Update locale state to match i18n, but keep isRTL as false
      // The app layout remains LTR regardless of language
      if (isSupportedLocale(lng as Locale)) {
        // Locale is informational only; layout direction is always LTR
        // We do NOT call I18nManager.forceRTL(true) or allowRTL(true)
      }
    });

    return () => {
      listener();
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
    <React.i18next.Provider i18n={i18n} locale={safeLocale}>
      {children}
    </React.i18next.Provider>
  );
}

/**
 * Types exported on the LocaleProvider for external use
 */
LocaleProvider.types = ["ar", "fr", "en"];
LocaleProvider.defaultType = "fr";
LocaleProvider.current = i18n;