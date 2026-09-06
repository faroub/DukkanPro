/**
 * Text Normalizer for Arabic, French, and English number words
 * Handles conversion of number words (zero to twenty) to integers
 * Also normalizes common sales-related phrases across languages
 */

// Arabic number words from 0 to 20
const arabicNumbers: Record<string, number> = {
  صفر: 0,
  واحد: 1,
  اثنان: 2,
  ثلاثة: 3,
  أربعة: 4,
  خمسة: 5,
  ستة: 6,
  سبعة: 7,
  ثمانية: 8,
  تسعة: 9,
  عشرة: 10,
  "أحد عشر": 11,
  "اثنا عشر": 12,
  "ثلاثة عشر": 13,
  "أربعة عشر": 14,
  "خمسة عشر": 15,
  "ستة عشر": 16,
  "سبعة عشر": 17,
  "ثمانية عشر": 18,
  "تسعة عشر": 19,
  عشرون: 20,
};

// French number words from 0 to 20
const frenchNumbers: Record<string, number> = {
  zéro: 0,
  un: 1,
  une: 1, // feminine form
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  "dix-sept": 17, // hyphenated form
  "dix-huit": 18, // hyphenated form
  "dix-neuf": 19, // hyphenated form
  vingt: 20,
};

// English number words from 0 to 20
const englishNumbers: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

/**
 * Normalizes a number word to an integer across supported languages
 * @param text - The text to normalize
 * @returns The parsed number, or -1 if not a number word
 */
export function normalizeNumberWord(text: string): number {
  const lower = text.toLowerCase().trim();

  // Check Arabic
  if (arabicNumbers[lower] !== undefined) {
    return arabicNumbers[lower];
  }

  // Check French
  if (frenchNumbers[lower] !== undefined) {
    return frenchNumbers[lower];
  }

  // Check English
  if (englishNumbers[lower] !== undefined) {
    return englishNumbers[lower];
  }

  return -1; // Not a recognized number word
}

/**
 * Normalizes a full sales command text for parsing
 * Extracts and normalizes number words, prepares text for parser
 * @param text - The raw command text
 * @returns Normalized text with numbers replaced by placeholder
 */
export function normalizeSalesText(text: string): {
  normalized: string;
  detectedQuantity?: number;
  language: "ar" | "fr" | "en";
} {
  const lower = text.toLowerCase().trim();
  let detectedQuantity: number | undefined = undefined;
  let language: "ar" | "fr" | "en" = "en";

  // Try to detect language and extract number
  // Arabic number words
  for (const [word, value] of Object.entries(arabicNumbers)) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lower)) {
      detectedQuantity = value;
      language = "ar";
      // Replace the word with a placeholder
      const normalized = lower.replace(regex, "<QUANTITY>");
      return { normalized, detectedQuantity, language };
    }
  }

  // French number words (including hyphenated forms)
  for (const [word, value] of Object.entries(frenchNumbers)) {
    const regex = new RegExp(`\\b${word.replace(/-/g, "\\-")}\\b`, "i");
    if (regex.test(lower)) {
      detectedQuantity = value;
      language = "fr";
      const normalized = lower.replace(regex, "<QUANTITY>");
      return { normalized, detectedQuantity, language };
    }
  }

  // English number words
  for (const [word, value] of Object.entries(englishNumbers)) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lower)) {
      detectedQuantity = value;
      language = "en";
      const normalized = lower.replace(regex, "<QUANTITY>");
      return { normalized, detectedQuantity, language };
    }
  }

  return { normalized: lower, language };
}

/**
 * Normalizes product name for matching
 * Removes number words and normalizes whitespace/casing
 * @param text - The product name text
 * @returns Normalized product name
 */
export function normalizeProductName(text: string): string {
  const lower = text.toLowerCase().trim();

  // Remove common number words across languages
  const arabicStop = [
    "صفر",
    "واحد",
    "اثنان",
    "ثلاثة",
    "أربعة",
    "خمسة",
    "ستة",
    "سبعة",
    "ثمانية",
    "تسعة",
    "عشرة",
    "أحد عشر",
    "اثنا عشر",
    "ثلاثة عشر",
    "أربعة عشر",
    "خمسة عشر",
    "ستة عشر",
    "سبعة عشر",
    "ثمانية عشر",
    "تسعة عشر",
    "عشرون",
  ];
  const frenchStop = [
    "zéro",
    "un",
    "une",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
    "vingt",
  ];
  const englishStop = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
  ];

  let result = lower;

  // Remove Arabic number words
  for (const word of arabicStop) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    result = result.replace(regex, "").replace(/\s+/g, " ");
  }

  // Remove French number words
  for (const word of frenchStop) {
    const regex = new RegExp(`\\b${word.replace(/-/g, "\\-")}\\b`, "i");
    result = result.replace(regex, "").replace(/\s+/g, " ");
  }

  // Remove English number words
  for (const word of englishStop) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    result = result.replace(regex, "").replace(/\s+/g, " ");
  }

  return result.replace(/\s+/g, " ").trim();
}

/**
 * Gets the translated "quantity" label for the current language
 * @param t - Translation function
 * @param language - Language code
 * @returns Translated quantity label
 */
export function getQuantityLabel(
  t: (key: string) => string,
  language: "ar" | "fr" | "en",
): string {
  const labels: Record<"ar" | "fr" | "en", string> = {
    ar: "الكمية",
    fr: "Quantité",
    en: "Quantity",
  };
  return labels[language];
}

/**
 * Gets the translated "product" label for the current language
 * @param t - Translation function
 * @param language - Language code
 * @returns Translated product label
 */
export function getProductLabel(
  t: (key: string) => string,
  language: "ar" | "fr" | "en",
): string {
  const labels: Record<"ar" | "fr" | "en", string> = {
    ar: "اسم المنتج",
    fr: "Nom du produit",
    en: "Product Name",
  };
  return labels[language];
}
