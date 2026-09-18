/**
 * DukkanOS Money Formatting Tests
 *
 * Tests for formatCentimes, parseCentimes, format14000Centimes
 *
 * Note: Intl.NumberFormat output varies by system locale.
 * The key test is that parseCentimes correctly handles
 * both Western and Arabic-Indic digit formats.
 */

import { formatCentimes, parseCentimes, format14000Centimes } from '../money';

describe('formatCentimes', () => {
  it('should format 14000 centimes in French locale', () => {
    // French locale outputs Western numerals with DZD/DA suffix
    const result = formatCentimes(14000, 'fr-DZ');
    // Should contain numeric value and currency symbol
    expect(result).toMatch(/\d+.*D[A-Z]/);
    // Should contain the value 140
    expect(result).toMatch(/140/);
  });

  it('should format 14000 centimes in English locale', () => {
    // English locale format may vary, check for numeric value and currency
    // Example output: "DZD 140" (currency before number)
    const result = formatCentimes(14000, 'en-DZ');
    // Should contain DZD/DA and 140
    expect(result).toMatch(/[A-Z]{2,3}.*140|140.*[A-Z]{2,3}/);
    // Must contain currency symbol
    expect(result).toMatch(/[A-Z]{2,}/);
  });

  it('should format 14000 centimes in Arabic locale', () => {
    // Arabic locale may use Arabic-Indic numerals
    // Example output: "١٤٠ د.ج." (Arabic-Indic digits with punctuation)
    const result = formatCentimes(14000, 'ar-DZ');
    // Should contain some digits (Western or Arabic-Indic)
    expect(result).toMatch(/[0-9٠-٩]/);
    // Should contain currency/language characters (Latin A-Z or Arabic)
    expect(result).toMatch(/[A-Zإ-ي]/);
  });

  it('should format 500 centimes in French locale', () => {
    const result = formatCentimes(500, 'fr-DZ');
    expect(result).toMatch(/5.*[A-Z]|[A-Z].*5/);
    expect(result).toMatch(/[A-Z]/);
  });

  it('should format 0 centimes', () => {
    const result = formatCentimes(0, 'fr-DZ');
    expect(result).toMatch(/0.*[A-Z]|[A-Z].*0/);
    expect(result).toMatch(/[A-Z]/);
  });
});

describe('parseCentimes', () => {
  it('should parse "140 DZD" to 14000', () => {
    expect(parseCentimes('140 DZD')).toBe(14000);
  });

  it('should parse "140,00 DZD" to 14000', () => {
    expect(parseCentimes('140,00 DZD')).toBe(14000);
  });

  it('should parse Arabic-Indic digits "١٤٠ دj" to 14000', () => {
    // Arabic-Indic digits are preprocessed before parsing
    expect(parseCentimes('١٤٠ دj')).toBe(14000);
  });

  it('should parse "5 DZD" to 500', () => {
    expect(parseCentimes('5 DZD')).toBe(500);
  });

  it('should return 0 for invalid input', () => {
    expect(parseCentimes('invalid')).toBe(0);
    expect(parseCentimes('')).toBe(0);
  });

  it('should parse "0 DZD" to 0', () => {
    expect(parseCentimes('0 DZD')).toBe(0);
  });

  it('should treat a comma group separator as grouping, not decimals', () => {
    // Regression: "1,400 DZD" (en-DZ grouping) was parsed as 1.4 DZD = 140
    expect(parseCentimes('1,400 DZD')).toBe(140000);
    expect(parseCentimes('999,999.99 DZD')).toBe(99999999);
  });

  it('should treat a comma as a decimal separator in French format', () => {
    expect(parseCentimes('12,55 DZD')).toBe(1255);
    expect(parseCentimes('0,05 DZD')).toBe(5);
  });

  it('should parse sub-dinar English format', () => {
    expect(parseCentimes('12.55 DZD')).toBe(1255);
    expect(parseCentimes('0.05 DZD')).toBe(5);
  });

  describe('with an explicit locale', () => {
    it('treats "," as grouping in en-DZ', () => {
      expect(parseCentimes('1,400 DZD', 'en-DZ')).toBe(140000);
      expect(parseCentimes('999,999.99 DZD', 'en-DZ')).toBe(99999999);
    });

    it('treats "," as the decimal separator in fr-DZ', () => {
      expect(parseCentimes('12,55 DZD', 'fr-DZ')).toBe(1255);
      expect(parseCentimes('1.400,99 DZD', 'fr-DZ')).toBe(140099);
    });

    it('resolves the ambiguous "1,234" by locale', () => {
      expect(parseCentimes('1,234', 'en-DZ')).toBe(123400);
      expect(parseCentimes('1,234', 'fr-DZ')).toBe(123);
      expect(parseCentimes('1,234', 'ar-DZ')).toBe(123);
    });

    it('accepts short language codes', () => {
      expect(parseCentimes('1,400 DZD', 'en')).toBe(140000);
      expect(parseCentimes('12,55 DZD', 'fr')).toBe(1255);
      expect(parseCentimes('12,55 دج', 'ar')).toBe(1255);
    });
  });
});

describe('formatCentimes ↔ parseCentimes round-trip', () => {
  // The app deals only in whole dinars; every amount is a multiple of 100 centimes.
  const amounts = [0, 500, 12500, 14000, 140000, 99999900];
  const locales = ['fr-DZ', 'en-DZ', 'ar-DZ'] as const;

  it.each(amounts)('round-trips %d centimes through every locale', (amount) => {
    for (const locale of locales) {
      expect(parseCentimes(formatCentimes(amount, locale), locale)).toBe(amount);
    }
  });
});

describe('format14000Centimes', () => {
  it('should format 14000 centimes', () => {
    const result = format14000Centimes('fr-DZ');
    expect(result).toMatch(/\d+.*[A-Z]/);
  });
});