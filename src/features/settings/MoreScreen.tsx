import React from "react";
import { ScrollView, View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedView, ThemedText, useToast } from "@/components";
import { useTranslation } from "react-i18next";
import i18n from "@/localization/i18n";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";

import { SettingsSection } from "@/features/settings/components/SettingsSection";
import { LanguageSelector } from "@/features/settings/components/LanguageSelector";

/**
 * MoreScreen - The "More" tab screen showing all settings sections.
 * - Shows: Business profile, Language, Inventory rules, Catalogue, Data export, Data reset, About
 * - Language switching works immediately without reload
 * - Layout remains LTR in all languages
 * - Arabic text may use right alignment inside individual text components
 */
export function MoreScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [showResetConfirmation, setShowResetConfirmation] = React.useState(false);

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
    [i18n]
  );

  const handleDataReset = useCallback(
    () => {
      setShowResetConfirmation(true);
    },
    []
  );

  const confirmDataReset = useCallback(
    () => {
      // TODO: Implement data reset logic
      // This would clear user data, sales, inventory, etc.
      setShowResetConfirmation(false);
    },
    []
  );

  const cancelDataReset = useCallback(
    () => {
      setShowResetConfirmation(false);
    },
    []
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.content}>
        {/* Business Profile Section */}
        <SettingsSection
          title={t("settings.businessProfile")}
          description={t("settings.currencyDZD", { currency: t("settings.currencyDisplayOnly") })}
        >
          {/* Business Name */}
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>
              {t("settings.businessName")}
            </ThemedText>
            <ThemedText style={styles.settingValue} numberOfLines={1}>
              DUKKAN OS
            </ThemedText>
          </View>

          {/* Owner Name */}
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>
              {t("settings.ownerName")}
            </ThemedText>
            <ThemedText style={styles.settingValue} numberOfLines={1}>
              --
            </ThemedText>
          </View>

          {/* Business Type */}
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>
              {t("settings.businessType")}
            </ThemedText>
            <ThemedText style={styles.settingValue} numberOfLines={1}>
              --
            </ThemedText>
          </View>

          {/* Currency display */}
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>
              {t("settings.currencyDZD")}
            </ThemedText>
            <ThemedText style={styles.settingValue}>
              {t("settings.currencyDisplayOnly")}
            </ThemedText>
          </View>
        </SettingsSection>

        {/* Language Section */}
        <SettingsSection
          title={t("settings.language")}
          description={t("settings.languageDescription")}
        >
          <LanguageSelector
            defaultLanguage={i18n.language}
            onLanguageChange={handleLanguageChange}
          />
        </SettingsSection>

        {/* Inventory Rules Section */}
        <SettingsSection
          title={t("settings.inventoryRules")}
        >
          {/* TODO: Add inventory rules settings items */}
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              {t("settings.inventoryRules")}
            </ThemedText>
          </View>
        </SettingsSection>

        {/* Catalogue Section */}
        <SettingsSection
          title={t("settings.catalogue")}
        >
          {/* TODO: Add catalogue settings items */}
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              {t("settings.catalogue")}
            </ThemedText>
          </View>
        </SettingsSection>

        {/* Data Export Section */}
        <SettingsSection
          title={t("settings.dataExport")}
        >
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              // TODO: Implement data export
            }}
          >
            <ThemedText style={styles.settingLabel}>
              {t("settings.dataExport")}
            </ThemedText>
            <ThemedText style={styles.settingValue} numberOfLines={1}>
              Exporter
            </ThemedText>
          </TouchableOpacity>
        </SettingsSection>

        {/* Data Reset Section */}
        <SettingsSection
          title={t("settings.dataReset")}
        >
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleDataReset}
          >
            <ThemedText style={styles.settingLabel}>
              {t("settings.dataReset")}
            </ThemedText>
            <ThemedText style={styles.settingValue} numberOfLines={1}>
              {t("settings.resetData")}
            </ThemedText>
          </TouchableOpacity>
        </SettingsSection>

        {/* About Section */}
        <SettingsSection
          title={t("settings.about")}
        >
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
    padding: 24,
    backgroundColor: "#F8F7F4",
  },
  content: {
    width: "100%",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: "#1A1A1A",
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyState: {
    padding: 16,
    alignItems: "center",
    color: "#6B7280",
  },
  emptyText: {
    fontSize: 14,
  },
});

export type { MoreScreenProps };