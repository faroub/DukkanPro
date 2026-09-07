import { ThemedText, ThemedView } from "@/components";
import i18n from "@/localization/i18n";
import { type Href, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ExportButton } from "@/features/settings/components/ExportButton";
import { LanguageSelector } from "@/features/settings/components/LanguageSelector";
import { SettingsSection } from "@/features/settings/components/SettingsSection";

/**
 * MoreScreen - The "More" tab screen showing all settings sections.
 * - Shows: Business profile, Language, Inventory rules, Catalogue, Data export, Data reset, About
 * - Language switching works immediately without reload
 * - Layout remains LTR in all languages
 * - Arabic text may use right alignment inside individual text components
 * - Does not show Darija (not available in MVP)
 */
export function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showResetConfirmation, setShowResetConfirmation] =
    React.useState(false);

  const handleLanguageChange = useCallback(
    (language: string) => {
      // Apply language immediately using changeLocale
      i18n.changeLanguage(language);
      // Do NOT reload the app
      // Do NOT change layout direction
      // Keep app architecture LTR in all languages
      // Arabic text may use right alignment inside individual text components
      // Do not show Darija
    },
    [i18n],
  );

  const handleDataReset = useCallback(() => {
    setShowResetConfirmation(true);
  }, []);

  const confirmDataReset = useCallback(async () => {
    // TODO: Implement data reset logic
    // This would clear user data, sales, inventory, etc.
    // For now, just navigate to the data reset screen
    router.push("/settings/data-reset" as Href);
    setShowResetConfirmation(false);
  }, [router]);

  const cancelDataReset = useCallback(() => {
    setShowResetConfirmation(false);
  }, []);

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

          <LanguageSelector
            defaultLanguage={i18n.language}
            onLanguageChange={handleLanguageChange}
          />
        </ThemedView>

        {/* Inventory Rules Section */}
        <SettingsSection title={t("settings.inventoryRules")}>
          <ExportButton
            t={t}
            onExportTypeSelect={(type) => {
              // Handle export type selection
              console.log("Export type selected:", type);
            }}
            onPerformExport={() => {
              // Handle perform export
              console.log("Perform export");
            }}
          />
          {/* TODO: Add inventory rules settings items */}
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              {t("settings.inventoryRules")}
            </ThemedText>
          </View>
        </SettingsSection>

        {/* Catalogue Section */}
        <SettingsSection title={t("settings.catalogue")}>
          {/* TODO: Add catalogue settings items */}
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              {t("settings.catalogue")}
            </ThemedText>
          </View>
        </SettingsSection>

        {/* Data Export Section */}
        <SettingsSection title={t("settings.dataExport")}>
          <ExportButton
            t={t}
            onExportTypeSelect={(type) => {
              // Handle export type selection
            }}
            onPerformExport={() => {
              // Handle perform export
            }}
          />
        </SettingsSection>

        {/* Data Reset Section */}
        <SettingsSection title={t("settings.dataReset")}>
          <TouchableOpacity style={styles.settingRow} onPress={handleDataReset}>
            <ThemedText style={styles.settingLabel}>
              {t("settings.dataReset")}
            </ThemedText>
            <ThemedText style={styles.settingValue} numberOfLines={1}>
              {t("settings.resetData")}
            </ThemedText>
          </TouchableOpacity>
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title={t("settings.about")}>
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>
              {t("settings.version")}
            </ThemedText>
            <ThemedText style={styles.settingValue} numberOfLines={1}>
              1.0.0
            </ThemedText>
          </View>
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>
              {t("settings.copyright")}
            </ThemedText>
            <ThemedText style={styles.settingValue} numberOfLines={1}>
              Copyright © 2026 Dukkan OS. Tous droits réservés.
            </ThemedText>
          </View>
        </SettingsSection>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
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
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  settingLabel: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  emptyState: {
    padding: Spacing.md,
    alignItems: "center",
    color: Colors.light.textSecondary,
  },
  emptyText: {
    fontSize: 14,
  },
});
