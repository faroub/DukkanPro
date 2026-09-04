/**
 * DukkanOS Text Utilities Tests
 *
 * Tests for getTextAlignment, getWritingDirection, truncateText,
 * toArabicIndicDigits, toLatinDigits, containsArabic, containsRTL, textStyle
 */

import { getTextAlignment, getWritingDirection, truncateText, toArabicIndicDigits, toLatinDigits, containsArabic, containsRTL, textStyle } from '../text';

describe('getTextAlignment', () => {
  it('should return "right" for Arabic locale', () => {
    expect(getTextAlignment('ar')).toBe('right');
  });

  it('should return "left" for French locale', () => {
    expect(getTextAlignment('fr')).toBe('left');
  });

  it('should return "left" for English locale', () => {
    expect(getTextAlignment('en')).toBe('left');
  });
});

describe('getWritingDirection', () => {
  it('should return "rtl" for Arabic locale', () => {
    expect(getWritingDirection('ar')).toBe('rtl');
  });

  it('should return "ltr" for French locale', () => {
    expect(getWritingDirection('fr')).toBe('ltr');
  });

  it('should return "ltr" for English locale', () => {
    expect(getWritingDirection('en')).toBe('ltr');
  });
});

describe('truncateText', () => {
  it('should return text unchanged when shorter than maxWidth', () => {
    expect(truncateText('Hello', 100, 'fr')).toBe('Hello');
  });

  it('should truncate text with ellipsis', () => {
    expect(truncateText('This is a long text that should be truncated', 10, 'fr')).toBe('This is...');
  });

  it('should handle Arabic text truncation', () => {
    const arabicText = 'هذا نص عربي طويل يجب تصغيره';
    const result = truncateText(arabicText, 10, 'ar');
    expect(result.length).toBeLessThanOrEqual(13);
  });

  it('should return truncated English text', () => {
    expect(truncateText('The quick brown fox jumps over', 10, 'en')).toBe('The quick...');
  });

  it('should handle edge case of exact maxWidth', () => {
    expect(truncateText('Hello world', 11, 'en')).toBe('Hello world');
  });
});

describe('toArabicIndicDigits', () => {
  it('should convert Latin digits to Arabic-Indic digits', () => {
    expect(toArabicIndicDigits('Hello 123 world')).toBe('Hello ١٢٣ world');
  });

  it('should preserve non-digit characters', () => {
    expect(toArabicIndicDigits('abcdef')).toBe('abcdef');
  });

  it('should handle empty string', () => {
    expect(toArabicIndicDigits('')).toBe('');
  });
});

describe('toLatinDigits', () => {
  it('should convert Arabic-Indic digits to Latin digits', () => {
    expect(toLatinDigits('Hello ١٢٣ world')).toBe('Hello 123 world');
  });

  it('should preserve non-digit characters', () => {
    expect(toLatinDigits('abcdef')).toBe('abcdef');
  });

  it('should handle empty string', () => {
    expect(toLatinDigits('')).toBe('');
  });
});

describe('containsArabic', () => {
  it('should return true for Arabic text', () => {
    expect(containsArabic('هذا نص عربي')).toBe(true);
  });

  it('should return false for French text', () => {
    expect(containsArabic('Bonjour le monde')).toBe(false);
  });

  it('should return false for English text', () => {
    expect(containsArabic('Hello world')).toBe(false);
  });

  it('should return true for mixed text', () => {
    expect(containsArabic('Hello هذا')).toBe(true);
  });
});

describe('containsRTL', () => {
  it('should return true for Arabic text', () => {
    expect(containsRTL('هذا نص عربي')).toBe(true);
  });

  it('should return false for French text', () => {
    expect(containsRTL('Bonjour le monde')).toBe(false);
  });

  it('should return false for English text', () => {
    expect(containsRTL('Hello world')).toBe(false);
  });
});

describe('textStyle', () => {
  it('should return style with right alignment for Arabic', () => {
    const style = textStyle('ar');
    expect(style.textAlign).toBe('right');
    expect(style.writingMode).toBe('rtl');
  });

  it('should return style with left alignment for French', () => {
    const style = textStyle('fr');
    expect(style.textAlign).toBe('left');
    expect(style.writingMode).toBe('ltr');
  });

  it('should allow option overrides', () => {
    const style = textStyle('fr', { fontSize: 14 });
    expect(style.textAlign).toBe('left');
    expect(style.writingMode).toBe('ltr');
    expect(style.fontSize).toBe(14);
  });
});