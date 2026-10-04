import ar from "@/locales/ar.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

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
 * Recursively flattens all nested keys in a dictionary into dot-separated paths.
 * e.g., { onboarding: { welcome: { title: "..." } } } => ["onboarding.welcome.title"]
 */
function getDeepKeys(obj: Record<string, any>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getDeepKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

/**
 * Verifies that all three translation dictionaries (ar, fr, en) have identical keys
 * across all required sections and all nested paths.
 */
export function validateTranslationDictionaries(): void {
  const arKeys = Object.keys(ar).sort();
  const frKeys = Object.keys(fr).sort();
  const enKeys = Object.keys(en).sort();

  if (arKeys.length !== frKeys.length || arKeys.length !== enKeys.length) {
    throw new Error(
      `Top-level key count mismatch: ar=${arKeys.length}, fr=${frKeys.length}, en=${enKeys.length}`,
    );
  }

  for (let i = 0; i < arKeys.length; i++) {
    if (arKeys[i] !== frKeys[i] || arKeys[i] !== enKeys[i]) {
      throw new Error(
        `Top-level key ${i} mismatch: ar="${arKeys[i]}", fr="${frKeys[i]}", en="${enKeys[i]}"`,
      );
    }
  }

  // Verify all 1-to-1 deep keys match across ar, fr, en
  const deepAr = getDeepKeys(ar);
  const deepFr = getDeepKeys(fr);
  const deepEn = getDeepKeys(en);

  const missingInAr = deepFr.filter((k) => !deepAr.includes(k));
  const missingInEn = deepFr.filter((k) => !deepEn.includes(k));
  const extraInAr = deepAr.filter((k) => !deepFr.includes(k));
  const extraInEn = deepEn.filter((k) => !deepFr.includes(k));

  if (missingInAr.length > 0 || missingInEn.length > 0 || extraInAr.length > 0 || extraInEn.length > 0) {
    throw new Error(
      `Deep translation key mismatch:\n` +
      `Missing in AR: ${missingInAr.join(", ") || "none"}\n` +
      `Missing in EN: ${missingInEn.join(", ") || "none"}\n` +
      `Extra in AR: ${extraInAr.join(", ") || "none"}\n` +
      `Extra in EN: ${extraInEn.join(", ") || "none"}`
    );
  }
}

// Run the validation on module import
validateTranslationDictionaries();

export default validateTranslationDictionaries;

describe("translation dictionaries validation", () => {
  test("all translation keys match 1-to-1 recursively across French, English, and Arabic", () => {
    expect(() => validateTranslationDictionaries()).not.toThrow();
  });

  test("deep key count is identical across all three locale files", () => {
    const deepAr = getDeepKeys(ar);
    const deepFr = getDeepKeys(fr);
    const deepEn = getDeepKeys(en);

    expect(deepAr.length).toEqual(deepFr.length);
    expect(deepEn.length).toEqual(deepFr.length);
    expect(deepAr).toEqual(deepFr);
    expect(deepEn).toEqual(deepFr);
  });
});
