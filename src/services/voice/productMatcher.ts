/**
 * Product Matcher for voice command parsing
 * Matches extracted product names against available products
 * Rules:
 * - Exact match first
 * - Partial match only when one clear result exists
 * - Never guess in ambiguous cases — show choices
 */

import { normalizeProductName } from './textNormalizer';

/**
 * Matches a product name against a list of available products
 * @param normalizedName - The normalized product name from command
 * @param availableProducts - List of available products from database
 * @returns Match result with type and product or choices
 */
export interface ProductMatchResult {
  type: 'exact' | 'partial' | 'ambiguous' | 'none';
  product?: any;
  choices: any[];
  matchedName: string;
}

/**
 * Matches a normalized product name against available products
 * @param normalizedName - Normalized product name (number words removed)
 * @param availableProducts - Available products from [name, ...]
 * @returns ProductMatchResult with match type and details
 */
export function matchProduct(
  normalizedName: string,
  availableProducts: Array<{ name: string; id: number }>
): ProductMatchResult {
  const lowerNormalized = normalizedName.toLowerCase().trim();
  const choices: any[] = [];
  let exactMatch: any | null = null;
  let partialMatches: any[] = [];

  for (const product of availableProducts) {
    const productNameLower = product.name.toLowerCase();

    // Check for exact match (normalized name is substring of product name, or vice versa)
    if (productNameLower.includes(lowerNormalized) || lowerNormalized.includes(productNameLower)) {
      // Check if it's a very close match (high similarity)
      const similarity = calculateSimilarity(normalizedName, product.name);
      if (similarity > 0.8) {
        exactMatch = product;
      } else {
        partialMatches.push(product);
      }
    }
  }

  // Determine match type
  if (exactMatch && partialMatches.length === 0) {
    return {
      type: 'exact',
      product: exactMatch,
      choices: [],
      matchedName: exactMatch.name,
    };
  }

  if (exactMatch && partialMatches.length > 0) {
    // Exact match exists but also partial matches - return exact and list choices
    return {
      type: 'exact',
      product: exactMatch,
      choices: partialMatches,
      matchedName: exactMatch.name,
    };
  }

  if (!exactMatch && partialMatches.length === 1) {
    // Only one partial match - use it
    return {
      type: 'partial',
      product: partialMatches[0],
      choices: [],
      matchedName: partialMatches[0].name,
    };
  }

  if (!exactMatch && partialMatches.length > 1) {
    // Multiple partial matches - ambiguous
    return {
      type: 'ambiguous',
      product: null,
      choices: partialMatches,
      matchedName: normalizedName,
    };
  }

  // No match found
  return {
    type: 'none',
    product: null,
    choices: [],
    matchedName: normalizedName,
  };
}

/**
 * Calculates simple string similarity between two strings
 * @param a - First string
 * @param b - Second string
 * @returns Similarity score between 0 and 1
 */
function calculateSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;

  const aWords = a.toLowerCase().split(/\s+/);
  const bWords = b.toLowerCase().split(/\s+/);

  const intersection = aWords.filter((w) => bWords.includes(w));
  const union = new Set([...aWords, ...bWords]).size;

  return intersection.length / union;
}

/**
 * Extracts product name from normalized command text
 * Removes quantity words and returns the product name portion
 * @param commandText - The full command text
 * @returns Normalized product name without quantity
 */
export function extractProductName(commandText: string): string {
  const normalized = normalizeProductName(commandText);
  return normalized;
}

/**
 * Gets the translated "product" label for the current language
 * @param t - Translation function
 * @param language - Language code
 * @returns Translated product label
 */
export function getProductLabel(t: (key: string) => string, language: 'ar' | 'fr' | 'en'): string {
  return {
    ar: 'اسم المنتج',
    fr: 'Nom du produit',
    en: 'Product Name',
  }[language];
}

/**
 * Gets the translated "choice" label for the current language
 * @param t - Translation function
 * @param language - Language code
 * @returns Translated choice label
 */
export function getChoiceLabel(t: (key: string) => string, language: 'ar' | 'fr' | 'en'): string {
  return {
    ar: 'خيارات',
    fr: 'Choix',
    en: 'Choices',
  }[language];
}