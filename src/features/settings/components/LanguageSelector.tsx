import { ThemedText, ThemedView } from "@/components";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { changeLocale } from "@/localization/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextStyle, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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
  onLanguageChange?: (language: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || defaultLanguage);

  useEffect(() => {
    const onLangChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    setCurrentLanguage(i18n.language || defaultLanguage);
    i18n.on("languageChanged", onLangChange);
    return () => {
      i18n.off("languageChanged", onLangChange);
    };
  }, [i18n, defaultLanguage]);

  const languages = [
    { code: "ar", label: "العربية", name: "Arabic" },
    { code: "fr", label: "Français", name: "French" },
    { code: "en", label: "English", name: "English" },
  ];

  const handleLanguageSelect = (language: string) => {
    changeLocale(language);
    setCurrentLanguage(language);
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>
        {t("settings.languageTitle") || t("settings.language") || "Language"}
      </ThemedText>
      <ThemedText style={styles.description}>
        {t("settings.languageDescription") ||
          "Sélectionnez votre langue d'affichage préférée"}
      </ThemedText>

      {languages.map((lang) => {
        const isSelected = currentLanguage?.startsWith(lang.code);

        return (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageOptionContainer,
              isSelected && styles.languageOptionSelected,
            ]}
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
            <View
              style={[
                styles.optionCheck,
                isSelected && styles.optionCheckActive,
              ]}
            >
              {isSelected && (
                <MaterialIcons name="check" size={16} color="#FFFFFF" />
              )}
            </View>
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
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  languageOptionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    minHeight: 48,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  languageOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
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
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  optionCheckActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  optionCheckText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export type { LanguageSelectorProps };

interface LanguageSelectorProps {
  defaultLanguage?: string;
  onLanguageChange: (language: string) => void;
}
