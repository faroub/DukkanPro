/**
 * Dukkan OS Money Formatting
 *
 * Formats centimes to DZD (Algerian Dinar) display strings using
 * Intl.NumberFormat with locales ar-DZ, fr-DZ, en-DZ.
 *
 * Money is always stored as integer centimes. Never use floating-point
 * arithmetic for monetary values (see: money safety rules).
 */

import i18n from "@/localization/i18n";

// Centimes-to-dinars conversion factor
const CENTIMES_PER_DINAR = 100;

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
 * Format centimes amount to a DZD display string for the given locale.
 * If locale is omitted, defaults to the active i18n language.
 *
 * Arabic numbers are: 0, 1, 2, 3, 4, ... (e.g. "140 دج")
 *
 * @param centimes - Amount in centimes (integer)
 * @param localeInput - Optional locale string (ar-DZ, fr-DZ, en-DZ, ar, fr, en)
 * @returns Formatted DZD string (e.g. "140 DZD", "140 دج")
 */
export function formatCentimes(
  centimes: number,
  localeInput?: "ar-DZ" | "fr-DZ" | "en-DZ" | "ar" | "fr" | "en" | string,
): string {
  const dinars = centimes / CENTIMES_PER_DINAR;
  
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

  switch (locale) {
    case "ar-DZ": {
      // Arabic numbers are: 0, 1, 2, 3, 4, ... with "دج" suffix for Algerian Dinar
      const formattedAr = new Intl.NumberFormat("fr-DZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(dinars);
      return `${formattedAr} دج`;
    }

    case "fr-DZ": {
      // French locale: Western numerals with space + " DZD" suffix
      const formattedFr = new Intl.NumberFormat("fr-DZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(dinars);
      return `${formattedFr} DZD`;
    }

    case "en-DZ": {
      // English locale: Western numerals with comma separator + " DZD" suffix
      const formattedEn = new Intl.NumberFormat("en-DZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(dinars);
      return `${formattedEn} DZD`;
    }

    default: {
      // Fallback to French locale format
      const formattedDefault = new Intl.NumberFormat("fr-DZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(dinars);
      return `${formattedDefault} DZD`;
    }
  }
}

/**
 * Convenience wrapper for common use case: format 14000 centimes.
 *
 * @param locale - Locale string (ar-DZ, fr-DZ, en-DZ)
 * @returns Formatted string, e.g. "140 DZD", "١٤٠ دج"
 */
export function format14000Centimes(
  locale: "ar-DZ" | "fr-DZ" | "en-DZ" = "fr-DZ",
): string {
  return formatCentimes(14000, locale);
}

/**
 * Parse a DZD formatted string back to centimes integer.
 * Accepts "140 DZD", "140,00 DZD", "١٤٠ دj", etc.
 *
 * @param formatted - The formatted DZD string
 * @returns Amount in centimes (integer), or 0 if parsing fails
 */
export function parseCentimes(formatted: string): number {
  const cleaned = toArabicNumerals(formatted)
    .replace("دج", "DZD")
    .replace("د.ج", "DZD")
    .replace(/[^\d,.-]/g, "")
    .trim();

  // Separators are locale-dependent: fr-DZ uses "," as the decimal ("12,55")
  // while en-DZ uses it for grouping ("1,400"). The app never formats more
  // than 2 fraction digits, so a lone separator followed by exactly 3 digits
  // is a group separator; anything else is a decimal separator.
  let numeric = cleaned;
  if (cleaned.includes(".") && cleaned.includes(",")) {
    // Both present: the last one is the decimal separator, the other groups.
    numeric =
      cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",")
        ? cleaned.replace(/,/g, "")
        : cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    const isGrouping = parts.length > 2 || parts[1].length === 3;
    numeric = isGrouping ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".");
  }

  const value = parseFloat(numeric);

  if (isNaN(value)) return 0;

  // Convert dinars to centimes (round to nearest integer)
  return Math.round(value * CENTIMES_PER_DINAR);
}