import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "@/locales/ar.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

i18n.use(initReactI18next).init({
  fallbackLng: "fr",
  lng: "fr",
  resources: {
    ar: { translation: ar, onboarding: (ar as any).onboarding || ar },
    en: { translation: en, onboarding: (en as any).onboarding || en },
    fr: { translation: fr, onboarding: (fr as any).onboarding || fr },
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
}