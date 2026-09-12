import React, { useCallback } from "react";
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
import {
  BorderRadius,
  Colors,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";

/**
 * MoreScreen - Settings menu matching Stitch design `1._more_settings_menu`.
 * - Active store summary card with verified badge & offline status
 * - Quick metrics micro-strip (Today Cash, Pending Sync, Terminal)
 * - Navigation list items with 56px minimum touch targets and clean dividers
 * - Destructive Data Reset clearly highlighted with error token
 * - Support delight banner and footer signature
 * - Layout remains strictly LTR across all locales
 */
export function MoreScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const handleNavigate = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  const isArabic = i18n.language?.startsWith("ar");
  const currentLang = (i18n.language || "fr").substring(0, 2).toUpperCase();
  const currentLangDesc = isArabic
    ? "العربية (نشطة) • الفرنسية متوفرة"
    : i18n.language?.startsWith("en")
      ? "English (Active) • Arabic & French available"
      : "Français (Actif) • Arabe disponible";

  const textAlignStyle = isArabic ? styles.textRight : styles.textLeft;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.container}>
        {/* Top Section Header */}
        <View style={styles.topHeader}>
          <View style={[styles.titleColumn, isArabic && styles.alignEnd]}>
            <ThemedText style={[styles.screenTitle, textAlignStyle]}>
              {t("settings.title") || "More"}
            </ThemedText>
            <ThemedText style={[styles.screenSubtitle, textAlignStyle]}>
              {t("onboarding.businessName.defaultShopName") || "Supérette El-Amel"} • {t("settings.subtitle") || "Paramètres"}
            </ThemedText>
          </View>
          <View style={styles.syncBadge}>
            <View style={styles.syncDot} />
            <ThemedText style={styles.syncBadgeText}>
              {t("settings.localSyncOn") || "Local Sync On"}
            </ThemedText>
          </View>
        </View>

        {/* Active Store Summary Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeIconContainer}>
            <MaterialIcons name="storefront" size={28} color={Colors.light.primary} />
          </View>
          <View style={[styles.storeInfo, isArabic && styles.alignEnd]}>
            <View style={[styles.storeNameRow, isArabic && styles.rowReverse]}>
              <ThemedText style={[styles.storeName, textAlignStyle]}>
                {t("onboarding.businessName.defaultShopName") || "Supérette El-Amel"}
              </ThemedText>
              <MaterialIcons name="verified" size={18} color={Colors.light.primary} />
            </View>
            <ThemedText style={[styles.storeCategory, textAlignStyle]}>
              {t("onboarding.businessType.grocerySub") || "Alimentation Générale • Alger Centre"}
            </ThemedText>
            <View style={[styles.storeStatusPill, isArabic && styles.rowReverse, isArabic && styles.selfEnd]}>
              <MaterialIcons name="cloud-done" size={13} color={Colors.light.primary} />
              <ThemedText style={styles.storeStatusText}>
                {t("settings.versionTagline") || "Dukkan OS"} ({t("settings.offlineReady") || "Offline Ready"})
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Operational Quick Metrics Micro-Strip */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>
              {t("settings.todayCash") || "Today Cash"}
            </ThemedText>
            <ThemedText style={styles.metricValuePrimary}>
              {isArabic ? "48 250 دج" : "48 250 DZD"}
            </ThemedText>
          </View>
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>
              {t("settings.pendingSync") || "Pending Sync"}
            </ThemedText>
            <ThemedText style={styles.metricValue}>
              {isArabic ? "0 عمليات" : "0 Ops"}
            </ThemedText>
          </View>
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>
              {t("settings.terminal") || "Terminal"}
            </ThemedText>
            <ThemedText style={styles.metricValue}>POS #01</ThemedText>
          </View>
        </View>

        {/* Settings Navigation List */}
        <View style={styles.menuCard}>
          {/* 1. Business Profile */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/business")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: Colors.light.primaryLight }]}>
              <MaterialIcons name="store" size={22} color={Colors.light.primary} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle]}>
                {t("settings.businessProfile") || "Business Profile"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle]} numberOfLines={1}>
                {t("settings.storeProfileSubtitle") || "Supérette El-Amel, Alger Centre"}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.light.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 2. Language */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/language")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: Colors.light.surfaceAlt }]}>
              <MaterialIcons name="language" size={22} color={Colors.light.textPrimary} />
            </View>
            <View style={styles.menuRowContent}>
              <View style={[styles.rowTitleWithBadge, isArabic && styles.justifyEnd]}>
                {isArabic && (
                  <View style={styles.languagePill}>
                    <ThemedText style={styles.languagePillText}>{currentLang}</ThemedText>
                  </View>
                )}
                <ThemedText style={[styles.menuRowTitle, textAlignStyle]}>
                  {t("settings.language") || "Language"}
                </ThemedText>
                {!isArabic && (
                  <View style={styles.languagePill}>
                    <ThemedText style={styles.languagePillText}>{currentLang}</ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle]} numberOfLines={1}>
                {currentLangDesc}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.light.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 3. Inventory Rules */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/inventory")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: Colors.light.surfaceAlt }]}>
              <MaterialIcons name="inventory-2" size={22} color={Colors.light.textPrimary} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle]}>
                {t("settings.inventoryRules") || "Inventory Rules"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle]} numberOfLines={1}>
                {t("settings.inventoryRulesSubtitle") || "Alert thresholds, low stock alerts"}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.light.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 4. Catalogue */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/catalogue")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: Colors.light.primaryLight }]}>
              <MaterialIcons name="share" size={22} color={Colors.light.primary} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle]}>
                {t("settings.catalogue") || "Catalogue"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle]} numberOfLines={1}>
                {t("settings.catalogueSubtitle") || "Online link, shareable product list"}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.light.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 5. Data Export */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/export")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: Colors.light.surfaceAlt }]}>
              <MaterialIcons name="file-download" size={22} color={Colors.light.textPrimary} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle]}>
                {t("settings.dataExport") || t("exports.title") || "Data Export"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle]} numberOfLines={1}>
                {t("settings.dataExportSubtitle") || "Backup sales, inventory, customers"}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.light.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 6. Data Reset (Destructive) */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/data-reset")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: Colors.light.errorLight }]}>
              <MaterialIcons name="warning" size={22} color={Colors.light.error} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle, { color: Colors.light.error }]}>
                {t("settings.dataReset") || t("settings.resetApp") || "Data Reset"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle, { color: Colors.light.error, opacity: 0.8 }]} numberOfLines={1}>
                {t("settings.dataResetSubtitle") || "Reset database or clear demo data"}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.light.error} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 7. About */}
          <View style={styles.menuRow}>
            <View style={[styles.menuIconContainer, { backgroundColor: Colors.light.surfaceAlt }]}>
              <MaterialIcons name="info" size={22} color={Colors.light.textPrimary} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle]}>
                {t("settings.about") || "About"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle]} numberOfLines={1}>
                {t("settings.aboutSubtitle") || "Dukkan OS, open retail software for Algerian merchants"}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.light.textMuted} />
          </View>
        </View>

        {/* Community & Support Delight Banner */}
        <View style={styles.supportBanner}>
          <View style={styles.supportIconContainer}>
            <MaterialIcons name="headset-mic" size={22} color={Colors.light.primary} />
          </View>
          <View style={[styles.supportContent, isArabic && styles.alignEnd]}>
            <ThemedText style={[styles.supportTitle, textAlignStyle]}>
              {t("settings.supportTitle") || "Need merchant support?"}
            </ThemedText>
            <ThemedText style={[styles.supportSubtitle, textAlignStyle]}>
              {t("settings.supportSubtitle") || "Direct WhatsApp line open Sunday to Thursday 08:00 - 19:00."}
            </ThemedText>
          </View>
        </View>

        {/* Subtle Footer Signature */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            {t("settings.footerSignature") || "Conçu avec fierté pour le commerce de proximité • 2026"}
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.light.background,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "transparent",
    gap: Spacing.md,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.xs,
  },
  titleColumn: {
    flex: 1,
  },
  screenTitle: {
    ...Typography.heading2,
    color: Colors.light.textPrimary,
  },
  screenSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  syncBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  storeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  storeInfo: {
    flex: 1,
    minWidth: 0,
  },
  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  storeName: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  storeCategory: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  storeStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  storeStatusText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  metricsStrip: {
    flexDirection: "row",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  metricValuePrimary: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  menuCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
    ...Shadows.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: ComponentDimensions.cardPadding,
    paddingVertical: 14,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuRowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuRowTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    lineHeight: 18,
  },
  languagePill: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  languagePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  menuRowSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginHorizontal: ComponentDimensions.cardPadding,
  },
  supportBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.surfaceAlt,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  supportSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
  },
  footerText: {
    fontSize: 11,
    color: Colors.light.textMuted,
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },
  textLeft: {
    textAlign: "left",
  },
  alignEnd: {
    alignItems: "flex-end",
  },
  justifyEnd: {
    justifyContent: "flex-end",
  },
  selfEnd: {
    alignSelf: "flex-end",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
});
