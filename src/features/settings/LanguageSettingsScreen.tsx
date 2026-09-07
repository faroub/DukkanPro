import { ThemedText, ThemedView } from "@/components";
import i18n from "@/localization/i18n";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

/**
 * LanguageSettingsScreen - Screen for managing application language settings.
 * - Shows language options: العربية, Français, English
 * - Switching language applies immediately without reload
 * - Layout direction remains LTR in all languages
 * - Arabic text may use right alignment inside individual text components
 * - Does not show Darija (not available in MVP)
 */
export function LanguageSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleLanguageChange = React.useCallback(
    (language: string) => {
      // Apply language immediately using i18n.changeLanguage
      i18n.changeLanguage(language);
      // Do NOT reload the app
      // Do NOT change layout direction
      // Keep app architecture LTR in all languages
      // Arabic text may use right alignment inside individual text components
      // Do not show Darija
    },
    [i18n],
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>
            {t("settings.languageTitle")}
          </ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>{t("back")}</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.settingsSection}>
          <ThemedText style={styles.settingsTitle}>
            {t("settings.languageDescription")}
          </ThemedText>

          <ThemedView style={styles.languageOption}>
            {t("settings.arabic") === "العربية" && (
              <TouchableOpacity
                style={styles.languageOptionItem}
                onPress={() => handleLanguageChange("ar")}
                accessibilityRole="radio"
                accessibilityState={
                  i18n.language === "ar" ? { checked: true } : undefined
                }
              >
                <ThemedText style={styles.languageOptionLabel}>
                  {t("settings.arabic")}
                </ThemedText>
              </TouchableOpacity>
            )}

            {t("settings.french") === "Français" && (
              <TouchableOpacity
                style={styles.languageOptionItem}
                onPress={() => handleLanguageChange("fr")}
                accessibilityRole="radio"
                accessibilityState={
                  i18n.language === "fr" ? { checked: true } : undefined
                }
              >
                <ThemedText style={styles.languageOptionLabel}>
                  {t("settings.french")}
                </ThemedText>
              </TouchableOpacity>
            )}

            {t("settings.english") === "English" && (
              <TouchableOpacity
                style={styles.languageOptionItem}
                onPress={() => handleLanguageChange("en")}
                accessibilityRole="radio"
                accessibilityState={
                  i18n.language === "en" ? { checked: true } : undefined
                }
              >
                <ThemedText style={styles.languageOptionLabel}>
                  {t("settings.english")}
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.light.background,
  },
  content: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: Spacing.md,
  },
  backButton: {
    padding: Spacing.md,
  },
  backButtonText: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  settingsSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  settingsTitle: {
    fontSize: 16,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.md,
  },
  languageOption: {
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  languageOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  languageOptionLabel: {
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
});
