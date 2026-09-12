import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { showToast } from "@/components/use-toast";
import {
  BorderRadius,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { changeLocale } from "@/localization/i18n";

interface LanguageOption {
  code: "ar" | "fr" | "en";
  shortLabel: string;
  name: string;
  subname: string;
  descriptionKey: string;
  toastMsgKey: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: "ar",
    shortLabel: "ع",
    name: "العربية",
    subname: "(Arabic)",
    descriptionKey: "settings.arabic",
    toastMsgKey: "common.success",
  },
  {
    code: "fr",
    shortLabel: "FR",
    name: "Français",
    subname: "(French)",
    descriptionKey: "settings.french",
    toastMsgKey: "common.success",
  },
  {
    code: "en",
    shortLabel: "EN",
    name: "English",
    subname: "(English)",
    descriptionKey: "settings.english",
    toastMsgKey: "common.success",
  },
];

/**
 * LanguageSettingsScreen - Screen for switching languages matching Stitch design `2._language_settings`.
 * - Immediate zero-downtime switch without app reload
 * - Layout strictly remains LTR in all languages
 * - Arabic text aligns naturally within components
 * - Respects active color scheme (Light / Dark) dynamically via useTheme()
 */
export function LanguageSettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || "fr");

  useEffect(() => {
    const onLangChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    i18n.on("languageChanged", onLangChange);
    return () => {
      i18n.off("languageChanged", onLangChange);
    };
  }, [i18n]);

  const handleSelectLanguage = useCallback(
    (lang: LanguageOption) => {
      changeLocale(lang.code);
      setCurrentLanguage(lang.code);
      const toastText =
        lang.code === "ar"
          ? "تم تغيير لغة العرض إلى العربية بنجاح"
          : lang.code === "fr"
            ? "Langue changée en français avec succès"
            : "Language changed to English successfully";
      showToast(toastText);
    },
    []
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      id="language-settings-screen"
    >
      <ThemedView style={styles.container}>
        {/* Breadcrumb Context */}
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => router.back()}
          activeOpacity={0.7}
          id="btn-language-back"
        >
          <MaterialIcons name="arrow-back" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.breadcrumbText, { color: theme.textSecondary }]}>
            {t("navigation.back") || t("common.back") || "Back"}
          </ThemedText>
        </TouchableOpacity>

        {/* Screen Heading */}
        <View style={styles.headerSection}>
          <View style={styles.badgeRow}>
            <MaterialIcons name="translate" size={18} color={theme.primary} />
            <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
              {t("settings.localeAndDisplay") || "Locale & Display"}
            </ThemedText>
          </View>
          <ThemedText style={[styles.headingTitle, { color: theme.textPrimary }]}>
            {t("settings.appLanguageTitle") || "App Language"}
          </ThemedText>
          <ThemedText style={[styles.headingSubtitle, { color: theme.textSecondary }]}>
            {t("settings.appLanguageSubtitle") ||
              "Choose the display language for DukkanPro interface, cash-register screens, and printed customer receipts."}
          </ThemedText>
        </View>

        {/* Cultural Visual Framing Card */}
        <View style={[styles.framingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.framingIconContainer, { backgroundColor: theme.surfaceAlt }]}>
            <MaterialIcons name="receipt-long" size={24} color={theme.primary} />
          </View>
          <View style={styles.framingContent}>
            <ThemedText style={[styles.framingTitle, { color: theme.textPrimary }]}>
              {t("settings.framingTitle") || "Fast Bilingual POS Sync"}
            </ThemedText>
            <ThemedText style={[styles.framingSubtitle, { color: theme.textSecondary }]}>
              {t("settings.framingSubtitle") ||
                "Thermal receipts render instant bilingual headers"}
            </ThemedText>
          </View>
          <View style={[styles.activePill, { backgroundColor: theme.primaryLight }]}>
            <ThemedText style={[styles.activePillText, { color: theme.primary }]}>
              {t("settings.active") || "Active"}
            </ThemedText>
          </View>
        </View>

        {/* Language Selection List */}
        <View style={styles.optionsList}>
          {LANGUAGES.map((item) => {
            const isSelected = currentLanguage.startsWith(item.code);
            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => handleSelectLanguage(item)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                id={`lang-option-${item.code}`}
              >
                {/* Active badge for currently selected language */}
                {isSelected && (
                  <View style={[styles.defaultBadge, { backgroundColor: theme.primary }]}>
                    <MaterialIcons name="check-circle" size={12} color="#FFFFFF" />
                    <ThemedText style={styles.defaultBadgeText}>
                      {t("settings.currentLanguageBadge") || "Active"}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.avatarCircle,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.surfaceAlt,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.avatarText,
                        {
                          color: isSelected ? theme.primary : theme.textSecondary,
                        },
                      ]}
                    >
                      {item.shortLabel}
                    </ThemedText>
                  </View>
                  <View style={styles.optionInfo}>
                    <View style={styles.optionTitleRow}>
                      <ThemedText style={[styles.optionName, { color: theme.textPrimary }]}>
                        {item.name}
                      </ThemedText>
                      <ThemedText style={[styles.optionSubname, { color: theme.textSecondary }]}>
                        {item.subname}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.optionDescription, { color: theme.textSecondary }]}>
                      {t(item.descriptionKey) || item.name}
                    </ThemedText>
                  </View>
                </View>

                {/* Radio Indicator */}
                <View
                  style={[
                    styles.radioIndicator,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surfaceAlt,
                    },
                  ]}
                >
                  {isSelected && (
                    <MaterialIcons name="check" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Zero Downtime Switch Banner */}
        <View style={[styles.featureBanner, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <View style={[styles.featureIconContainer, { backgroundColor: theme.surface }]}>
            <MaterialIcons name="bolt" size={18} color={theme.primary} />
          </View>
          <View style={styles.featureContent}>
            <ThemedText style={[styles.featureTitle, { color: theme.textPrimary }]}>
              {t("settings.zeroDowntimeTitle") || "Zero Downtime Switch"}
            </ThemedText>
            <ThemedText style={[styles.featureSubtitle, { color: theme.textSecondary }]}>
              {t("settings.zeroDowntimeSubtitle") ||
                "Swapping languages requires no app restart. POS quick-keys, category shortcuts, and price barcodes stay precisely where your fingers expect them."}
            </ThemedText>
          </View>
        </View>

        {/* Informational Usability Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: theme.primaryLight }]}>
            <MaterialIcons name="info" size={20} color={theme.primary} />
          </View>
          <View style={styles.infoContent}>
            <ThemedText style={[styles.infoTitle, { color: theme.textPrimary }]}>
              {t("settings.ergonomicTitle") || "Ergonomic Counter Usability (LTR)"}
            </ThemedText>
            <ThemedText style={[styles.infoSubtitle, { color: theme.textSecondary }]}>
              {t("settings.ergonomicSubtitle") ||
                "The app layout remains left-to-right (LTR) for all languages to ensure consistent counter usability. Text inside fields aligns naturally."}
            </ThemedText>
          </View>
        </View>

        {/* Decorative Store System Versioning */}
        <View style={styles.versionFooter}>
          <View style={styles.versionRow}>
            <MaterialIcons name="verified" size={16} color={theme.textMuted} />
            <ThemedText style={[styles.versionTitle, { color: theme.textMuted }]}>
              <ThemedText style={{ fontWeight: "800" }}>Dukkan<ThemedText style={{ color: theme.primary, fontWeight: "800" }}>Pro</ThemedText></ThemedText> v2.4.1 • Multi-language Engine
            </ThemedText>
          </View>
          <ThemedText style={[styles.versionSubtitle, { color: theme.textMuted }]}>
            {t("settings.versionCompliance") ||
              "Algerian Dinar (DZD) compliant localized registry"}
          </ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "transparent",
    gap: Spacing.md,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    alignSelf: "flex-start",
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerSection: {
    gap: Spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headingTitle: {
    ...Typography.heading2,
  },
  headingSubtitle: {
    ...Typography.caption,
    lineHeight: 20,
  },
  framingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  framingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  framingContent: {
    flex: 1,
    minWidth: 0,
  },
  framingTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  framingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  optionsList: {
    gap: ComponentDimensions.cardGap,
  },
  optionCard: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 64,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  defaultBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
    minWidth: 0,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionInfo: {
    flex: 1,
    minWidth: 0,
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optionName: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionSubname: {
    fontSize: 12,
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  radioIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  featureSubtitle: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoSubtitle: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  versionFooter: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: 2,
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  versionTitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  versionSubtitle: {
    fontSize: 11,
  },
});
