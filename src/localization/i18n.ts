import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "@/locales/ar.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

i18n.use(initReactI18next).init({
  fallbackLng: "fr",
  lng: "fr",
  resources: {
    ar: { translation: ar },
    en: { translation: en },
    fr: { translation: fr },
  },
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