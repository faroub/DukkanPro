import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { useEffect } from "react";
import { initReactI18next } from "react-i18next";

import ar from "@/locales/ar.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

export type Locale = "ar" | "fr" | "en";

export interface LocaleProviderProps {
  children: React.ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  useEffect(() => {
    let locale: Locale = "fr";
    const languageCode = getLocales()[0]?.languageCode;

    switch (languageCode) {
      case "ar":
        locale = "ar";
        break;
      case "fr":
      case "en":
        locale = languageCode as Locale;
        break;
      default:
        locale = "fr";
    }

    i18n.use(initReactI18next).init({
      fallbackLng: "fr",
      lng: locale,
      resources: {
        ar: { translation: ar },
        fr: { translation: fr },
        en: { translation: en },
      },
      debug: false,
      interpolation: {
        escapeValue: false,
      },
    });

    // Store preferred locale - DO NOT force RTL via I18nManager
    // Arabic text will use right alignment at component level only
    try {
      void AsyncStorage.setItem("locale", locale);
    } catch (e) {
      // AsyncStorage not available in web, ignore
    }
  }, []);

  const changeLocale = (newLocale: Locale) => {
    i18n.changeLanguage(newLocale);
  };

  return children;
}

LocaleProvider.types = ["ar", "fr", "en"];
LocaleProvider.defaultType = "fr";
