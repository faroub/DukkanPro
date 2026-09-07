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
});

describe('format14000Centimes', () => {
  it('should format 14000 centimes', () => {
    const result = format14000Centimes('fr-DZ');
    expect(result).toMatch(/\d+.*[A-Z]/);
  });
});