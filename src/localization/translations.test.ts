import ar from "./ar";
import en from "./en";
import fr from "./fr";

const REQUIRED_SECTIONS = [
  "common",
  "onboarding",
  "navigation",
  "dashboard",
  "products",
  "inventory",
  "sales",
  "customers",
  "payments",
  "catalogue",
  "receipts",
  "exports",
  "settings",
  "voice",
  "errors",
  "confirmations",
  "emptyStates",
  "permissions",
] as const;

type RequiredSections = (typeof REQUIRED_SECTIONS)[number];

/**
 * Verifies that all three translation dictionaries have identical keys
 * across all 18 required sections.
 *
 * Tests:
 * 1. All three dictionaries have the same set of top-level keys
 * 2. Each required section exists in all three languages
 * 3. Each section has the same keys in all three languages
 * 4. No keys are missing in any language
 *
 * @throws {Error} If any key is missing or keys don't match across languages
 */
export function validateTranslationDictionaries(): void {
  const languages = { ar, fr, en };

  // 1. Verify all three dictionaries have the same top-level keys
  const arKeys = Object.keys(ar).sort();
  const frKeys = Object.keys(fr).sort();
  const enKeys = Object.keys(en).sort();

  if (arKeys.length !== frKeys.length || arKeys.length !== enKeys.length) {
    throw new Error(
      `Top-level key count mismatch: ar=${arKeys.length}, fr=${frKeys.length}, en=${enKeys.length}`,
    );
  }

  if (
    arKeys[0] !== frKeys[0] ||
    arKeys[arKeys.length - 1] !== frKeys[frKeys.length - 1]
  ) {
    throw new Error(
      "Top-level keys do not match across languages. " +
        `ar: ${arKeys.join(", ")}, fr: ${frKeys.join(", ")}, en: ${enKeys.join(", ")}`,
    );
  }

  // Verify all three have identical top-level keys
  for (let i = 0; i < arKeys.length; i++) {
    if (arKeys[i] !== frKeys[i] || arKeys[i] !== enKeys[i]) {
      throw new Error(
        `Top-level key ${i} mismatch: ar="${arKeys[i]}", fr="${frKeys[i]}", en="${enKeys[i]}"`,
      );
    }
  }

  const topLevelKeys: string[] = arKeys;

  // 2. Verify each required section exists in all three languages
  for (const section of REQUIRED_SECTIONS) {
    if (!(section in ar) || !(section in fr) || !(section in en)) {
      throw new Error(
        `Missing section "${section}" in one or more languages. ` +
          `ar: ${section in ar}, fr: ${section in fr}, en: ${section in en}`,
      );
    }
  }

  // 3. Verify each section has the same keys in all three languages
  for (const section of REQUIRED_SECTIONS) {
    const arSectionKeys = Object.keys(ar[section as RequiredSections]).sort();
    const frSectionKeys = Object.keys(fr[section as RequiredSections]).sort();
    const enSectionKeys = Object.keys(en[section as RequiredSections]).sort();

    // Check count matches
    if (
      arSectionKeys.length !== frSectionKeys.length ||
      arSectionKeys.length !== enSectionKeys.length
    ) {
      throw new Error(
        `Section "${section}" key count mismatch: ar=${arSectionKeys.length}, fr=${frSectionKeys.length}, en=${enSectionKeys.length}`,
      );
    }

    // Check each key matches
    for (let i = 0; i < arSectionKeys.length; i++) {
      if (
        arSectionKeys[i] !== frSectionKeys[i] ||
        arSectionKeys[i] !== enSectionKeys[i]
      ) {
        throw new Error(
          `Section "${section}" key ${i} mismatch: ar="${arSectionKeys[i]}", fr="${frSectionKeys[i]}", en="${enSectionKeys[i]}"`,
        );
      }
    }
  }

  // 4. Verify no keys are missing - all section keys exist in all languages
  for (const section of REQUIRED_SECTIONS) {
    const sectionObj = ar[section as RequiredSections];
    const sectionKeys = Object.keys(sectionObj);

    for (const key of sectionKeys) {
      if (
        !(key in fr[section as RequiredSections]) ||
        !(key in en[section as RequiredSections])
      ) {
        throw new Error(
          `Key "${key}" missing in section "${section}" in one or more languages`,
        );
      }
    }
  }
}

// Run the validation on module import
validateTranslationDictionaries();

export default validateTranslationDictionaries;

test("translation dictionaries have identical keys", () => {
  expect(() => validateTranslationDictionaries()).not.toThrow();
});
