import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "@/localization/ar";
import en from "@/localization/en";
import fr from "@/localization/fr";

function buildResourceNamespaces(bundle: any) {
  const namespaces: Record<string, any> = {
    translation: bundle,
  };
  for (const key of Object.keys(bundle)) {
    if (typeof bundle[key] === "object" && bundle[key] !== null) {
      namespaces[key] = bundle[key];
    }
  }
  return namespaces;
}

export function updateLayoutDirection(locale: string): void {
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.dir = "ltr";
    document.documentElement.lang = locale;
    if (document.body) {
      document.body.dir = "ltr";
    }
  }
}

let initialLanguage = "fr";
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const stored = window.localStorage.getItem("dukkan_locale");
    if (stored && ["ar", "fr", "en"].includes(stored)) {
      initialLanguage = stored;
    }
  } catch (e) {
    // Ignore localStorage access issues
  }
}

updateLayoutDirection(initialLanguage);

i18n.use(initReactI18next).init({
  fallbackLng: "fr",
  lng: initialLanguage,
  resources: {
    ar: buildResourceNamespaces(ar),
    en: buildResourceNamespaces(en),
    fr: buildResourceNamespaces(fr),
  },
  defaultNS: "translation",
  debug: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

// Export changeLocale utility for use by hooks and providers
export function changeLocale(newLocale: string): void {
  i18n.changeLanguage(newLocale);
  updateLayoutDirection(newLocale);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem("dukkan_locale", newLocale);
    } catch (e) {
      // Ignore
    }
  }
}
