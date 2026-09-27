/**
 * Dukkan OS Money Formatting
 *
 * Formats centimes to DZD (Algerian Dinar), EUR (Euro), and USD (US Dollar)
 * display strings using Intl.NumberFormat with locales ar-DZ, fr-DZ, en-DZ.
 * Default currency is DZD (Algerian Dinar).
 *
 * Money is always stored as integer centimes. Never use floating-point
 * arithmetic for monetary values (see: money safety rules).
 */

import i18n from "@/localization/i18n";

// Centimes-to-main-unit conversion factor (100 centimes = 1 DZD / 1 EUR / 1 USD)
const CENTIMES_PER_DINAR = 100;

export type CurrencyCode = "DZD" | "EUR" | "USD";

/**
 * Returns currency symbol/suffix based on currency code and locale.
 */
export function getCurrencySymbol(
  currency: CurrencyCode | string = "DZD",
  locale?: string
): string {
  const code = (currency || "DZD").toUpperCase();
  const isArabic = locale?.startsWith("ar") || i18n?.language?.startsWith("ar");

  switch (code) {
    case "EUR":
      return "€";
    case "USD":
      return "$";
    case "DZD":
    default:
      return isArabic ? "د.ج" : "DZD";
  }
}

/**
 * Western Arabic numerals: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
 * (Algerian standard as requested by user)
 */
export function toArabicNumerals(text: string): string {
  const indicToWestern: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  return text.replace(/[٠-٩]/g, (digit) => indicToWestern[digit] || digit);
}

/**
 * Compatibility alias: Arabic numbers are: 0, 1, 2, 3, 4, ...
 */
export function toArabicIndicNumerals(text: string): string {
  return toArabicNumerals(text);
}

/**
 * Format centimes amount to a currency display string for the given locale.
 * Default currency is DZD.
 *
 * @param centimes - Amount in centimes (integer)
 * @param localeInput - Optional locale string (ar-DZ, fr-DZ, en-DZ, ar, fr, en)
 * @param currencyInput - Currency code ("DZD" | "EUR" | "USD")
 * @returns Formatted currency string (e.g. "140 DZD", "140 €", "$140")
 */
export function formatCentimes(
  centimes: number,
  localeInput?: "ar-DZ" | "fr-DZ" | "en-DZ" | "ar" | "fr" | "en" | string,
  currencyInput?: "DZD" | "EUR" | "USD" | string
): string {
  const amount = centimes / CENTIMES_PER_DINAR;
  const currencyCode = (currencyInput || "DZD").toUpperCase() as CurrencyCode;

  let targetLocale = localeInput;
  if (!targetLocale) {
    const currentLang = i18n?.language || "fr";
    targetLocale = currentLang.startsWith("ar")
      ? "ar-DZ"
      : currentLang.startsWith("en")
        ? "en-DZ"
        : "fr-DZ";
  }

  const locale =
    targetLocale === "ar"
      ? "ar-DZ"
      : targetLocale === "fr"
        ? "fr-DZ"
        : targetLocale === "en"
          ? "en-DZ"
          : targetLocale;

  const numFormatted = new Intl.NumberFormat(locale === "ar-DZ" ? "fr-DZ" : locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount);

  if (currencyCode === "USD") {
    return `$${numFormatted}`;
  } else if (currencyCode === "EUR") {
    return `${numFormatted} €`;
  } else {
    // DZD default
    return locale === "ar-DZ" ? `${numFormatted} د.ج` : `${numFormatted} DZD`;
  }
}

/**
 * Convenience wrapper for common use case: format 14000 centimes.
 */
export function format14000Centimes(
  locale: "ar-DZ" | "fr-DZ" | "en-DZ" = "fr-DZ",
  currency: CurrencyCode = "DZD"
): string {
  return formatCentimes(14000, locale, currency);
}

/**
 * Parse a formatted string back to centimes integer.
 * Accepts "140 DZD", "140 €", "$140", "140,00 DZD", "١٤٠ دج", etc.
 */
export function parseCentimes(
  formatted: string,
  localeInput?: "ar-DZ" | "fr-DZ" | "en-DZ" | "ar" | "fr" | "en" | string
): number {
  const cleaned = toArabicNumerals(formatted)
    .replace("دج", "")
    .replace("د.ج", "")
    .replace("DZD", "")
    .replace("EUR", "")
    .replace("USD", "")
    .replace("€", "")
    .replace("$", "")
    .replace(/[^\d,.-]/g, "")
    .trim();

  const lang = localeInput ?? "";
  const locale = lang.startsWith("en")
    ? "en-DZ"
    : lang.startsWith("ar")
      ? "ar-DZ"
      : lang.startsWith("fr")
        ? "fr-DZ"
        : null;

  let numeric: string;
  if (locale === "en-DZ") {
    numeric = cleaned.replace(/,/g, "");
  } else if (locale) {
    numeric = cleaned.replace(/\./g, "").replace(/,/g, ".");
  } else if (cleaned.includes(".") && cleaned.includes(",")) {
    numeric =
      cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",")
        ? cleaned.replace(/,/g, "")
        : cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    const isGrouping = parts.length > 2 || parts[1].length === 3;
    numeric = isGrouping ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".");
  } else {
    numeric = cleaned;
  }

  const value = parseFloat(numeric);

  if (isNaN(value)) return 0;

  return Math.round(value * CENTIMES_PER_DINAR);
}
