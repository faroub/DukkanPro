import { ThemedText, ThemedView } from "@/components";
import { BorderRadius, Spacing } from "@/constants/theme";
import i18n from "@/localization/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextStyle, TouchableOpacity, View } from "react-native";

/**
 * LanguageSelector - A language selection component for settings.
 * - Uses radio-style toggle buttons, not I18nManager
 * - Switching language applies immediately without reloading
 * - Layout direction remains LTR in all languages
 * - Arabic text may use right alignment inside individual text blocks
 * - Does not show Darija
 */
export function LanguageSelector({
  defaultLanguage = "fr",
  onLanguageChange,
}: {
  defaultLanguage?: string;
  onLanguageChange: (language: string) => void;
}) {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    // Sync i18n language state
    const syncLang = () => {
      setCurrentLanguage(i18n.language);
    };
    syncLang();
  }, [i18n]);

  const languages = [
    { code: "ar", label: "العربية", name: "Arabic" },
    { code: "fr", label: "Français", name: "French" },
    { code: "en", label: "English", name: "English" },
  ];

  const handleLanguageSelect = (language: string) => {
    onLanguageChange(language);
    // Apply language immediately using i18n.changeLanguage
    i18n.changeLanguage(language);
    // Do NOT enable global RTL layout or change direction
    // Keep app architecture LTR in all languages
    // Arabic text may use right alignment inside individual text components
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>
        {t("settings.languageTitle")}
      </ThemedText>
      <ThemedText style={styles.description}>
        {t("settings.languageDescription")}
      </ThemedText>

      {languages.map((lang) => {
        const isSelected = currentLanguage === lang.code;

        return (
          <TouchableOpacity
            key={lang.code}
            style={styles.languageOptionContainer}
            onPress={() => handleLanguageSelect(lang.code)}
            accessibilityRole="radio"
            accessibilityLabel={lang.label}
            accessibilityState={isSelected ? { checked: true } : undefined}
          >
            <View style={styles.optionInner}>
              <ThemedText style={optionLabelStyle(lang.code)}>
                {lang.label}
              </ThemedText>
            </View>
            {isSelected && (
              <View style={styles.optionCheck}>
                <ThemedText style={styles.optionCheckText}>
                  {t("settings.yes")}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ThemedView>
  );
}

const optionLabelStyle = (langCode: string): TextStyle => {
  if (langCode === "ar") {
    return { fontSize: 15, textAlign: "right" };
  }
  return { fontSize: 15 };
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "left",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: Spacing.md,
  },
  languageOptionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  optionInner: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#1B6B3A",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  optionCheckText: {
    fontSize: 12,
    color: "#1B6B3A",
    fontWeight: "bold",
  },
});

export type { LanguageSelectorProps };

interface LanguageSelectorProps {
  defaultLanguage?: string;
  onLanguageChange: (language: string) => void;
}
