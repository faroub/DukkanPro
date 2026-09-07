/**
 * Dukkan OS Money Formatting
 *
 * Formats centimes to DZD (Algerian Dinar) display strings using
 * Intl.NumberFormat with locales ar-DZ, fr-DZ, en-DZ.
 *
 * Money is always stored as integer centimes. Never use floating-point
 * arithmetic for monetary values (see: money safety rules).
 */

// Centimes-to-dinars conversion factor
const CENTIMES_PER_DINAR = 100;

/**
 * Arabic-Indic digit mapping for number conversion
 */
const ArabicIndicDigits: Record<string, string> = {
  "0": "٠",
  "1": "١",
  "2": "٢",
  "3": "٣",
  "4": "٤",
  "5": "٥",
  "6": "٦",
  "7": "٧",
  "8": "٨",
  "9": "٩",
};

/**
 * Get Arabic-Indic digit from Western digit
 */
function toArabicIndicDigit(digit: string): string {
  return ArabicIndicDigits[digit] || digit;
}

/**
 * Convert Western numeral string to Arabic-Indic numerals
 */
function toArabicIndicNumerals(text: string): string {
  return text.replace(/[0-9]/g, (digit) => toArabicIndicDigit(digit));
}

/**
 * Format centimes amount to a DZD display string for the given locale.
 *
 * @param centimes - Amount in centimes (integer)
 * @param locale - Locale string (ar-DZ, fr-DZ, en-DZ)
 * @returns Formatted DZD string (e.g. "140 DZD", "١٤٠ دج")
 */
export function formatCentimes(
  centimes: number,
  localeInput: "ar-DZ" | "fr-DZ" | "en-DZ" | "ar" | "fr" | "en" = "fr-DZ",
): string {
  const dinars = centimes / CENTIMES_PER_DINAR;
  const locale =
    localeInput === "ar"
      ? "ar-DZ"
      : localeInput === "fr"
        ? "fr-DZ"
        : localeInput === "en"
          ? "en-DZ"
          : localeInput;

  switch (locale) {
    case "ar-DZ":
      // Arabic locale: Arabic-Indic numerals with "دج" suffix for Algerian Dinar
      // DESIGN.md shows "{amount} دج" (e.g., "١٤٠ دج") - format: Arabic-Indic numerals + " دج"
      const formatted = new Intl.NumberFormat("ar-DZ", {
        style: "currency",
        currency: "DZD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(dinars);
      // Convert Western numerals to Arabic-Indic, then replace Arabic currency symbol
      return formatted
        .replace(/[0-9]/g, (digit) => ArabicIndicDigits[digit] || digit)
        .replace("د.ج", "دج");

    case "fr-DZ":
      // French locale: Western numerals with space + " DZD" suffix
      // DESIGN.md shows "{amount} DZD" (e.g., "280 DZD") - format: Western numerals + " DZD"
      const formattedFr = new Intl.NumberFormat("fr-DZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
      }).format(dinars);
      return `${formattedFr} DZD`;

    case "en-DZ":
      // English locale: Western numerals with comma separator + " DZD" suffix
      // DESIGN.md shows "{amount} DZD" (e.g., "123 DZD") - format: Western numerals with comma + " DZD"
      const formattedEn = new Intl.NumberFormat("en-DZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
      }).format(dinars);
      return `${formattedEn} DZD`;

    default:
      // Fallback to French locale format
      const formattedDefault = new Intl.NumberFormat("fr-DZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
      }).format(dinars);
      return `${formattedDefault} DZD`;
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
  // Remove currency symbol and whitespace, replace Arabic "دج" with "DZD"
  const cleaned = formatted
    .replace("دج", "DZD")
    .replace("د.ج", "DZD")
    // Convert Arabic-Indic digits to Western digits for parsing
    .replace(/[٠-٩]/g, (digit) => {
      const reverseMap: Record<string, string> = {
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
      return reverseMap[digit] || digit;
    })
    .replace(/[^\d,.-]/g, "")
    .trim();

  const value = parseFloat(cleaned.replace(/,/g, "."));

  if (isNaN(value)) return 0;

  // Convert dinars to centimes (round to nearest integer)
  return Math.round(value * CENTIMES_PER_DINAR);
}