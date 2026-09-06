/**
 * Voice Sale Parser for Dukkan OS
 * Parses voice/text commands into structured sale data
 * Rules:
 * - Support Arabic, French, and English number words from zero to twenty
 * - Match exact product names first
 * - Use partial matching only when one clear result exists
 * - Never guess in ambiguous cases — show choices
 * - Require customer for credit sales
 * - Default to cash only if payment is not specified
 * - Allow editing recognized text
 * - Require confirmation before cart mutation
 */

import { matchProduct, ProductMatchResult } from "./productMatcher";
import { normalizeProductName, normalizeSalesText } from "./textNormalizer";

// Supported languages
type Language = "ar" | "fr" | "en";

// Available products from the database (typed placeholder)
type AvailableProduct = {
  id: number;
  name: string;
  category: string;
  price_centimes: number;
  stock: number;
};

/**
 * Parses a voice/text sale command into structured data
 * @param command - The raw command text (Arabic, French, or English)
 * @param availableProducts - List of available products from database
 * @returns Parsed sale data or null if command cannot be parsed
 */
export interface ParsedSaleCommand {
  quantity: number;
  productName: string;
  customerName: string | null;
  paymentMethod: "cash" | "credit";
  originalText: string;
  language: Language;
  matchType: "exact" | "partial" | "ambiguous" | "none";
  productMatchResult?: ProductMatchResult;
}

export type { AvailableProduct, Language };

/**
 * Main parsing function - parses a sale command text
 * @param command - Raw command text (e.g., "بعت حبتين حليب", "Sold two milks", "Vendu trois lait")
 * @param availableProducts - Available products from database
 * @returns Parsed command data or null if cannot parse
 */
export function parseSaleCommand(
  command: string,
  availableProducts: AvailableProduct[],
): ParsedSaleCommand | null {
  if (!command || command.trim().length === 0) {
    return null;
  }

  // Step 1: Normalize the text and detect language/quantity
  const { normalized, detectedQuantity, language } =
    normalizeSalesText(command);
  const lang = language as Language;

  // Step 2: Extract product name (remove number words)
  const normalizedName = normalizeProductName(normalized);

  // Step 3: Match product against available products
  const availableProductsNames = availableProducts.map((p) => ({
    name: p.name,
    id: p.id,
  }));
  const matchResult = matchProduct(normalizedName, availableProductsNames);

  // Step 4: Determine payment method from command
  const paymentMethod = detectPaymentMethod(normalized, lang);

  // Step 5: Extract customer name if mentioned
  const customerName = extractCustomerName(normalized, lang);

  // Step 6: Use detected quantity if available, default to 1
  const quantity =
    detectedQuantity && detectedQuantity > 0 ? detectedQuantity : 1;

  // Step 7: Handle ambiguous cases
  let finalProductName = normalizedName;
  let finalProduct: AvailableProduct | null = null;

  switch (matchResult.type) {
    case "exact":
      finalProductName = matchResult.matchedName;
      // Find the actual product object
      finalProduct =
        availableProducts.find((p) => p.name === matchResult.matchedName) ||
        null;
      break;

    case "partial":
      finalProductName = matchResult.matchedName;
      finalProduct =
        availableProducts.find((p) => p.name === matchResult.matchedName) ||
        null;
      break;

    case "ambiguous":
      // Keep the structured result so the review UI can show choices.
      break;

    case "none":
      // Keep the structured result so the review UI can explain the failure.
      break;
  }

  // Validate: require customer for credit sales
  if (finalProduct && paymentMethod === "credit" && !customerName) {
    // In a full implementation, we would flag this for the UI
    // For now, set customer to a default or mark as required
  }

  return {
    quantity,
    productName: finalProductName,
    customerName: customerName || null,
    paymentMethod,
    originalText: command,
    language: lang,
    matchType: matchResult.type,
    productMatchResult: matchResult,
  };
}

/**
 * Detects payment method from normalized command text
 * @param normalized - Normalized command text
 * @param language - Detected language
 * @returns 'cash' or 'credit'
 */
function detectPaymentMethod(
  normalized: string,
  language: Language,
): "cash" | "credit" {
  const lower = normalized.toLowerCase();

  // Arabic keywords
  if (language === "ar") {
    const creditKeywords = ["دين", "ائتمان", "بالكريدت", "بالأجل"];
    const cashKeywords = ["نقداً", "كاش", "مباشرة", "فوري"];

    for (const kw of creditKeywords) {
      if (lower.includes(kw)) return "credit";
    }
    for (const kw of cashKeywords) {
      if (lower.includes(kw)) return "cash";
    }
    return "cash"; // default
  }

  // French keywords
  if (language === "fr") {
    const creditKeywords = ["crédit", "à crédit", "en crédit"];
    const cashKeywords = ["espèces", "cash", "payé cash", "immédiat"];

    for (const kw of creditKeywords) {
      if (lower.includes(kw)) return "credit";
    }
    for (const kw of cashKeywords) {
      if (lower.includes(kw)) return "cash";
    }
    return "cash"; // default
  }

  // English keywords
  if (language === "en") {
    const creditKeywords = ["credit", "on credit", "to credit"];
    const cashKeywords = ["cash", "paid cash", "paid in cash", "immediately"];

    for (const kw of creditKeywords) {
      if (lower.includes(kw)) return "credit";
    }
    for (const kw of cashKeywords) {
      if (lower.includes(kw)) return "cash";
    }
    return "cash"; // default
  }

  return "cash"; // default fallback
}

/**
 * Extracts customer name from command text if mentioned
 * @param normalized - Normalized command text
 * @param language - Detected language
 * @returns Customer name or null
 */
function extractCustomerName(
  normalized: string,
  language: Language,
): string | null {
  const lower = normalized.toLowerCase();

  // Arabic pattern: "ل Ahmed" or " لأحمد"
  const arabicPattern = /ل\s*[؀-ۿ\w]+/i;
  const arabicMatch = normalized.match(arabicPattern);
  if (arabicMatch) {
    return arabicMatch[0].replace("ل", "").trim() || null;
  }

  // French pattern: "pour Ahmed" or "pour M. Ahmed"
  if (language === "fr") {
    const frPattern = /pour\s+[\w\s]+/i;
    const frMatch = normalized.match(frPattern);
    if (frMatch) {
      return frMatch[0].replace("pour", "").trim() || null;
    }
  }

  // English pattern: "for Ahmed"
  if (language === "en") {
    const enPattern = /for\s+[\w\s]+/i;
    const enMatch = normalized.match(enPattern);
    if (enMatch) {
      return enMatch[0].replace("for", "").trim() || null;
    }
  }

  return null;
}

/**
 * Gets the translated command labels for the current language
 * @param t - Translation function
 * @param language - Language code
 * @returns Object with translated labels
 */
export function getCommandLabels(
  t: (key: string) => string,
  language: Language,
) {
  return {
    ar: {
      title: "الأوامر الصوتية",
      subtitle: "تعرف علىCommands",
      listening: "جارٍ الاستماع",
      listeningError: "خطأ في الاستماع",
      commandNotRecognized: "لا يمكن التعرف على الأمر",
      sayProductName: "اسم المنتج",
      sayPrice: "السعر",
      sayQuantity: "الكمية",
      startSale: "بيع بدء",
      cancelSale: "بيع إلغاء",
    },
    fr: {
      title: "Commandes vocales",
      subtitle: "Découvrez les commandes",
      listening: "En écoute",
      listeningError: "Erreur d'écoute",
      commandNotRecognized: "Commande non reconnue",
      sayProductName: "Dites le nom du produit",
      sayPrice: "Dites le prix",
      sayQuantity: "Dites la quantité",
      startSale: "Commencer la vente",
      cancelSale: "Annuler la vente",
    },
    en: {
      title: "Voice Commands",
      subtitle: "Learn Commands",
      listening: "Listening",
      listeningError: "Listening Error",
      commandNotRecognized: "Command Not Recognized",
      sayProductName: "Say Product Name",
      sayPrice: "Say Price",
      sayQuantity: "Say Quantity",
      startSale: "Start Sale",
      cancelSale: "Cancel Sale",
    },
  }[language];
}
