/**
 * Locale configuration for Dukkan OS
 *
 * - Detects device locale using expo-localization
 * - Suggests Arabic, French, or English during onboarding
 * - Defaults to French if locale is unsupported
 * - Merchant selection can override device locale
 * - Selected locale is persisted in AsyncStorage
 * - Locale is loaded before rendering the main app
 *
 * Formatting rules:
 * - Arabic: ar-DZ (Algerian Arabic)
 * - French: fr-DZ (Algerian French)
 * - English: en-DZ (Algerian English)
 * - Currency: DZD (Algerian Dinar)
 *
 * The entire application remains visually LTR regardless of selected language.
 * Arabic text may use right alignment inside individual components, but the
 * surrounding layout is always LTR.
 */

import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Locale } from "@/localization/types";

const PREFERRED_LOCALES = ["ar", "fr", "en"] as const;

/**
 * Map an Expo language code to a Dukkan OS locale
 * Returns the locale if supported, otherwise undefined
 */
function mapExpoLocaleToDukkanLocale(
  expoLocale: ReturnType<typeof getLocales>[0] | undefined,
): Locale | undefined {
  if (!expoLocale?.languageCode) {
    return undefined;
  }

  const languageCode = expoLocale.languageCode;

  // Map language codes to supported locales
  const localeMap: Record<string, Locale> = {
    ar: "ar",
    "ar-AE": "ar",
    "ar-DZ": "ar",
    "ar-QA": "ar",
    "ar-SA": "ar",
    "ar-EG": "ar",
    fr: "fr",
    "fr-CA": "fr",
    "fr-DZ": "fr",
    "fr-BE": "fr",
    "fr-CH": "fr",
    "fr-LU": "fr",
    en: "en",
    "en-US": "en",
    "en-GB": "en",
    "en-CA": "en",
    "en-AU": "en",
    "en-NZ": "en",
  };

  return localeMap[languageCode];
}

/**
 * Get the current device locale, mapped to a Dukkan OS locale
 * Defaults to French if the device locale is unsupported
 */
export function getCurrentDeviceLocale(): Locale {
  const expoLocales = getLocales();
  const primaryLocale = expoLocales[0];

  const mappedLocale = mapExpoLocaleToDukkanLocale(primaryLocale);

  // Default to French if locale is unsupported or not mapped
  return mappedLocale ?? "fr";
}

/**
 * Get the formatted locale string for Intl formatting
 * e.g., "ar-DZ", "fr-DZ", "en-DZ"
 */
export function getFormattedLocale(locale: Locale): string {
  const mapping: Record<Locale, string> = {
    ar: "ar-DZ",
    fr: "fr-DZ",
    en: "en-DZ",
  };
  return mapping[locale];
}

/**
 * Get the currency code for the given locale
 * All supported locales use DZD (Algerian Dinar)
 */
export function getCurrencyCode(locale: Locale): string {
  return "DZD";
}

/**
 * Check if a locale string is a supported Dukkan OS locale
 */
export function isSupportedLocale(locale: string): locale is Locale {
  return ["ar", "fr", "en"].includes(locale);
}

/**
 * Get locale display name in the locale itself
 * e.g., Arabic returns "العربية", French returns "Français", English returns "English"
 */
export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    ar: "العربية",
    fr: "Français",
    en: "English",
  };
  return names[locale];
}

/**
 * Parse a locale from a stored AsyncStorage value
 * Returns the default locale if the value is invalid
 */
export function parseStoredLocale(
  storedValue: string | null,
): Locale {
  if (!storedValue || !isSupportedLocale(storedValue)) {
    return "fr";
  }
  return storedValue as Locale;
}

/**
 * Store the selected locale in AsyncStorage
 * Used by the merchant to override device locale
 */
export async function storeLocaleInAsyncStorage(
  locale: Locale,
): Promise<void> {
  try {
    await AsyncStorage.setItem("selectedLocale", locale);
  } catch (error) {
    // AsyncStorage may not be available in all environments (e.g., web)
    // Silently ignore storage errors - the app will use the default locale
    if (__DEV__) {
      console.warn("Failed to store locale in AsyncStorage:", error);
    }
  }
}

/**
 * Read the selected locale from AsyncStorage
 * Used by the merchant to override device locale
 * Returns the default French locale if nothing is stored
 */
export async function readStoredLocaleFromAsyncStorage(): Promise<Locale> {
  try {
    const stored = await AsyncStorage.getItem("selectedLocale");
    return parseStoredLocale(stored);
  } catch (error) {
    // AsyncStorage may not be available in all environments (e.g., web)
    // Default to French if storage fails
    return "fr";
  }
}

/**
 * Configuration object for locale-aware formatting
 */
export interface LocaleFormattingConfig {
  locale: Locale;
  numberOptions?: Intl.NumberFormatOptions;
  dateOptions?: Intl.DateTimeFormatOptions;
}

/**
 * Format a number using the locale-specific Intl.NumberFormat
 * All amounts in Dukkan OS are stored as integer centimes
 */
export function formatCurrency(
  amountCentimes: number,
  config: LocaleFormattingConfig,
): string {
  const { locale, numberOptions = {} } = config;
  const displayAmount = amountCentimes / 100; // Convert centimes to main currency unit

  return new Intl.NumberFormat(getFormattedLocale(locale), {
    style: "currency",
    currency: getCurrencyCode(locale),
    ...numberOptions,
  }).format(displayAmount);
}

/**
 * Format a number (integer) using the locale-specific Intl.NumberFormat
 * Used for quantities, counts, and stock levels
 */
export function formatNumber(
  value: number,
  config: LocaleFormattingConfig,
): string {
  const { locale, numberOptions = {} } = config;

  return new Intl.NumberFormat(getFormattedLocale(locale), {
    ...numberOptions,
  }).format(value);
}

/**
 * Format a date using the locale-specific Intl.DateTimeFormat
 */
export function formatDate(
  date: Date | string | number,
  config: LocaleFormattingConfig,
): string {
  const { locale, dateOptions = {} } = config;

  return new Intl.DateTimeFormat(getFormattedLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...dateOptions,
  }).format(new Date(date));
}

/**
 * Format a date relative (e.g., "il y a 2 jours") - requires ICU formatting
 * This is a placeholder for future relative date formatting
 */
export function formatRelativeDate(
  date: Date | string | number,
  locale: Locale,
): string {
  // TODO: Implement relative date formatting with Intl.DateTimeFormat
  // or use a library like dayjs/plugin/relativeTime
  const day = new Date(date).getDate();
  const month = new Date(date).toLocaleString(locale, { month: "short" });
  return `${day} ${month}`;
}