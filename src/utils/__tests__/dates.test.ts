/**
 * DukkanOS Date Formatting Tests
 *
 * Tests for formatDate, formatRelativeDate, formatTime, formatDateTime
 *
 * Note: formatRelativeDate uses the current date for relative calculations,
 * so "today" and "yesterday" are relative to when the test runs.
 * formatDateTime output varies by system locale.
 */

import { formatDate, formatRelativeDate, formatTime, formatDateTime } from '../dates';

const testDate = new Date('2026-09-04T14:30:00Z');
const yesterday = new Date('2026-09-03T14:30:00Z');
const dayBeforeYesterday = new Date('2026-09-02T14:30:00Z');

describe('formatDate', () => {
  it('should format date in French locale', () => {
    const result = formatDate(testDate, 'fr-DZ');
    expect(result).toContain('2026');
    expect(typeof result).toBe('string');
  });

  it('should format date in English locale', () => {
    const result = formatDate(testDate, 'en-DZ');
    expect(result).toContain('2026');
    expect(typeof result).toBe('string');
  });

  it('should format date in Arabic locale', () => {
    const result = formatDate(testDate, 'ar-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle invalid date string', () => {
    const result = formatDate('not-a-date', 'fr-DZ');
    expect(result).toBe('Date introuvable');
  });

  it('should handle invalid date object', () => {
    const result = formatDate(new Date('NaT'), 'fr-DZ');
    expect(result).toBe('Date introuvable');
  });
});

describe('formatRelativeDate', () => {
  it('should return a relative date string in French', () => {
    const result = formatRelativeDate(testDate, 'fr-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return a relative date string in English', () => {
    const result = formatRelativeDate(testDate, 'en-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return a relative date string in Arabic', () => {
    const result = formatRelativeDate(testDate, 'ar-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle same-day date as today-like', () => {
    const result = formatRelativeDate(testDate, 'fr-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return relative date for past date', () => {
    const result = formatRelativeDate(yesterday, 'fr-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return relative date for older date', () => {
    const result = formatRelativeDate(dayBeforeYesterday, 'fr-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatTime', () => {
  it('should format time in French locale', () => {
    const result = formatTime(testDate, 'fr-DZ');
    expect(result).toContain(':');
    expect(typeof result).toBe('string');
  });

  it('should format time in English locale', () => {
    const result = formatTime(testDate, 'en-DZ');
    expect(result).toContain(':');
    expect(typeof result).toBe('string');
  });

  it('should format time in Arabic locale', () => {
    const result = formatTime(testDate, 'ar-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDateTime', () => {
  it('should format date and time in French locale', () => {
    const result = formatDateTime(testDate, 'fr-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/:/);
  });

  it('should format date and time in English locale', () => {
    const result = formatDateTime(testDate, 'en-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/:/);
  });

  it('should format date and time in Arabic locale', () => {
    const result = formatDateTime(testDate, 'ar-DZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
