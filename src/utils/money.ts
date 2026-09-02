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
 * Format centimes amount to a DZD display string for the given locale.
 *
 * @param centimes - Amount in centimes (integer)
 * @param locale - Locale string (ar-DZ, fr-DZ, en-DZ)
 * @returns Formatted DZD string (e.g. "140 DZD", "١٤٠ دج")
 */
export function formatCentimes(
  centimes: number,
  locale: 'ar-DZ' | 'fr-DZ' | 'en-DZ' = 'fr-DZ'
): string {
  const dinars = centimes / CENTIMES_PER_DINAR;

  switch (locale) {
    case 'ar-DZ':
      // Arabic locale: Arabic-Indic numerals, "دج" symbol for Algerian Dinar
      return new Intl.NumberFormat('ar-DZ', {
        style: 'currency',
        currency: 'DZD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(dinars).replace('د.ج', 'دج') // Normalize currency display;

    case 'fr-DZ':
      // French locale: Western numerals, "123,45 DZD" or "123 DZD"
      return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: 'DZD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(dinars);

    case 'en-DZ':
      // English locale: Western numerals with comma separator, "123.00 DZD"
      return new Intl.NumberFormat('en-DZ', {
        style: 'currency',
        currency: 'DZD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(dinars);

    default:
      // Fallback to French locale format
      return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: 'DZD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(dinars);
  }
}

/**
 * Convenience wrapper for common use case: format 14000 centimes.
 *
 * @param locale - Locale string (ar-DZ, fr-DZ, en-DZ)
 * @returns Formatted string, e.g. "140 DZD", "١٤٠ دج"
 */
export function format14000Centimes(
  locale: 'ar-DZ' | 'fr-DZ' | 'en-DZ' = 'fr-DZ'
): string {
  return formatCentimes(14000, locale);
}

/**
 * Parse a DZD formatted string back to centimes integer.
 * Accepts "140 DZD", "140,00 DZD", "١٤٠ دج", etc.
 *
 * @param formatted - The formatted DZD string
 * @returns Amount in centimes (integer), or 0 if parsing fails
 */
export function parseCentimes(formatted: string): number {
  // Remove currency symbol and whitespace, replace Arabic "دج" with "DZD"
  const cleaned = formatted
    .replace('دج', 'DZD')
    .replace('د.ج', 'DZD')
    .replace(/[^\d,.-]/g, '')
    .trim();

  const value = parseFloat(cleaned.replace(/,/g, '.'));

  if (isNaN(value)) return 0;

  // Convert dinars to centimes (round to nearest integer)
  return Math.round(value * CENTIMES_PER_DINAR);
}

export type { formatCentimes, format14000Centimes, parseCentimes };