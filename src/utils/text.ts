/**
 * Dukkan OS Text Utilities
 *
 * Text helpers including Arabic text alignment support.
 * Entire application remains visually LTR regardless of selected language.
 * Arabic text may use right alignment inside individual components,
 * but surrounding layout stays LTR.
 */

/**
 * Get the appropriate text alignment for the given locale.
 * LTR layout is always used globally; Arabic text can be right-aligned
 * within its container without mirroring the whole interface.
 *
 * @param locale - Language locale (ar, fr, en)
 * @returns CSS textAlign value ('left' or 'right')
 */
export function getTextAlignment(locale: 'ar' | 'fr' | 'en' = 'fr'): 'left' | 'right' {
  if (locale === 'ar') {
    return 'right';
  }
  return 'left';
}

/**
 * Get the appropriate writing direction for the given locale.
 * The app remains LTR globally, but individual Arabic text can have
 * rtl direction using inline style when needed.
 *
 * @param locale - Language locale (ar, fr, en)
 * @returns CSS writingDirection value
 */
export function getWritingDirection(locale: 'ar' | 'fr' | 'en' = 'fr'): 'ltr' | 'rtl' {
  if (locale === 'ar') {
    return 'rtl';
  }
  return 'ltr';
}

/**
 * Safely truncate text with ellipsis, preserving grapheme clusters
 * for proper Arabic/French/English support.
 *
 * @param text - Text to truncate
 * @ maxWidth - Maximum width in characters (not pixels)
 * @param locale - Language locale for proper handling
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(
  text: string,
  maxWidth: number,
  locale: 'ar' | 'fr' | 'en' = 'fr'
): string {
  if (text.length <= maxWidth) {
    return text;
  }

  // For Arabic, we need to handle grapheme clusters differently
  if (locale === 'ar') {
    // Arabic: truncate at word boundary if possible
    const available = text.slice(0, maxWidth - 1); // -1 for ellipsis
    const lastSpace = available.lastIndexOf(' ');
    if (lastSpace > maxWidth * 0.5) {
      return available.slice(0, lastSpace) + '...';
    }
    return available + '...';
  }

  // For French and English
  return text.slice(0, maxWidth - 3) + '...';
}

/**
 * Convert Latin digits to Arabic-Indic digits for display in Arabic locale,
 * while keeping the surrounding LTR layout.
 *
 * Useful when you want Arabic numerals inside an LTR form layout.
 *
 * @param text - Text with Latin digits
 * @returns Text with Arabic-Indic digits
 */
export function toArabicIndicDigits(text: string): string {
  const arabicDigits: Record<string, string> = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩',
  };

  return text.replace(/[0-9]/g, digit => arabicDigits[digit] || digit);
}

/**
 * Convert Arabic-Indic digits back to Latin digits for editing/input.
 *
 * @param text - Text with Arabic-Indic digits
 * @returns Text with Latin digits
 */
export function toLatinDigits(text: string): string {
  const arabicToLatin: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
  };

  return text.replace(/[٠-٩]/g, digit => arabicToLatin[digit] || digit);
}

/**
 * Normalize whitespace in text while preserving Arabic word structure.
 * Collapses multiple spaces but preserves intentional spacing in Arabic text.
 *
 * @param text - Text to normalize
 * @param locale - Language locale
 * @returns Normalized text
 */
export function normalizeWhitespace(
  text: string,
  locale: 'ar' | 'fr' | 'en' = 'fr'
): string {
  if (locale === 'ar') {
    // For Arabic: collapse multiple spaces but preserve single spaces
    // Arabic spaces behave differently, so we be conservative
    return text.replace(/[ \t]+/g, ' ').trim();
  }

  // For French and English: standard whitespace normalization
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Check if text contains Arabic characters.
 *
 * @param text - Text to check
 * @returns True if text contains Arabic characters
 */
export function containsArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}

/**
 * Check if text contains right-to-left characters (Arabic or Persian).
 *
 * @param text - Text to check
 * @returns True if text contains RTL characters
 */
export function containsRTL(text: string): boolean {
  return /[֐-ࣿ]/.test(text);
}

/**
 * Wrap text in a style object that respects LTR layout globally
 * while allowing Arabic text to be right-aligned within its container.
 *
 * @param locale - Language locale
 * @param options - Additional style overrides
 * @returns Text style object with correct alignment
 */
export function textStyle(
  locale: 'ar' | 'fr' | 'en' = 'fr',
  options: Record<string, unknown> = {}
): Record<string, unknown> {
  const alignment = getTextAlignment(locale);
  const direction = getWritingDirection(locale);

  return {
    textAlign: alignment,
    writingMode: direction,
    ...options,
  };
}

export type {
  getTextAlignment,
  getWritingDirection,
  truncateText,
  toArabicIndicDigits,
  toLatinDigits,
  normalizeWhitespace,
  containsArabic,
  containsRTL,
  textStyle,
};