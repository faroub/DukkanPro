import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "@/locales/ar.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import { storeLocaleInAsyncStorage } from "@/localization/localeConfig";
import type { Locale } from "@/localization/types";

const LOCALSTORAGE_KEY = "dukkan_locale";

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
    const stored = window.localStorage.getItem(LOCALSTORAGE_KEY);
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
      window.localStorage.setItem(LOCALSTORAGE_KEY, newLocale);
    } catch (e) {
      // Ignore
    }
  }
  // Persist to the unified app_settings key so the choice survives on native,
  // where localStorage is unavailable.
  storeLocaleInAsyncStorage(newLocale as Locale).catch((error) => {
    if (__DEV__) {
      console.warn("Failed to persist locale:", error);
    }
  });
}
