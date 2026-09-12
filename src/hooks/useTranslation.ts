import i18n, { changeLocale as changeI18nLocale } from "@/localization/i18n";
import type { Locale } from "@/localization/types";
import { useEffect, useState } from "react";
import { useTranslation as useReactTranslation } from "react-i18next";

/**
 * Options for interpolation in translated strings
 */
export interface InterpolationOptions {
  /** Interpolate a name/variable into the translated string */
  name?: string;
  /** Interpolate an amount (in centimes) */
  amount?: number;
  /** Interpolate a quantity */
  quantity?: number;
  /** Interpolate a count */
  count?: number;
  /** Interpolate a date */
  date?: Date | string | number;
}

/**
 * Typed return type for the useTranslation hook
 */
export interface UseTranslationReturn {
  /** Typed t function that accepts a translation key and returns the translated string */
  t: <Key extends string>(key: Key, options?: InterpolationOptions) => string;
  /** Current locale string */
  locale: Locale;
  /** Function to change the locale */
  changeLocale: (newLocale: Locale) => void;
  /** Current i18n instance for advanced usage */
  i18n: typeof i18n;
}

/**
 * useTranslation hook that wraps react-i18next's useTranslation
 * Provides a typed t function and locale management
 *
 * Features:
 * - Typed t function with interpolation support for names, amounts, quantities, counts, and dates
 * - Returns current locale
 * - Change locale without reloading the app
 * - Interpolation support using {{variable}} syntax in translation keys
 * - Never concatenates translated sentence fragments
 * - Uses complete sentence translations
 * - Does not call I18nManager APIs
 */
export function useTranslation(): UseTranslationReturn {
  const { t, i18n: reactI18n, ready } = useReactTranslation();

  const [locale, setLocale] = useState<Locale>(
    (i18n.language as Locale) || "fr"
  );

  // Update locale when i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLocale((lng as Locale) || "fr");
    };

    // Subscribe to locale changes from the i18n instance
    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  /**
   * Typed t function that accepts a translation key and optional interpolation
   * Supports interpolation for: names, amounts, quantities, counts, and dates
   * Uses {{variable}} syntax in translation keys
   */
  const typedT = <Key extends string>(
    key: Key,
    options?: InterpolationOptions,
  ): string => {
    // Build interpolation parameters if provided
    const interpolationParams: Record<string, unknown> = {};

    if (options) {
      if (options.name !== undefined) {
        interpolationParams.name = options.name;
      }
      if (options.amount !== undefined) {
        interpolationParams.amount = options.amount;
      }
      if (options.quantity !== undefined) {
        interpolationParams.quantity = options.quantity;
      }
      if (options.count !== undefined) {
        interpolationParams.count = options.count;
      }
      if (options.date !== undefined) {
        interpolationParams.date = options.date;
      }
    }

    // Call the underlying t function with interpolation parameters
    // The i18n instance uses ICU message format with {{variable}} syntax
    return t(key, interpolationParams);
  };

  return {
    t: typedT,
    locale,
    changeLocale: (newLocale: Locale) => {
      // Use the imported changeI18nLocale function
      changeI18nLocale(newLocale);
      setLocale(newLocale);
    },
    i18n,
  };
}

/**
 * Change the application locale
 * Does not reload the app - changes are applied dynamically
 * Arabic locale does not trigger RTL layout changes
 */
export function changeLocale(newLocale: Locale): void {
  changeI18nLocale(newLocale);
}
