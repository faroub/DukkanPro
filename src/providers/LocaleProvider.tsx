import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

import i18n, { changeLocale as changeI18nLocale, updateLayoutDirection } from "@/localization/i18n";
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
 */
export function LocaleProvider({ children }: LocaleProviderProps) {
  // Initialize locale from storage or device locale on first mount
  useEffect(() => {
    async function initializeLocale() {
      // Read the stored locale from storage (merchant selection override)
      const storedLocale = await readStoredLocaleFromAsyncStorage();

      let locale: Locale;
      if (storedLocale && isSupportedLocale(storedLocale)) {
        locale = storedLocale;
      } else {
        const deviceLocale = getCurrentDeviceLocale();
        locale = deviceLocale;
      }

      changeI18nLocale(locale);
      await storeLocaleInAsyncStorage(locale);
    }

    initializeLocale();
  }, []);

  // Sync locale state & RTL direction with i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (isSupportedLocale(lng as Locale)) {
        updateLayoutDirection(lng);
      }
    };
    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );
}

