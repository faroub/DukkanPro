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
import { showToast } from "@/components/use-toast";
import {
  BorderRadius,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  ThemePreference,
  useThemePreference,
} from "@/providers/ThemeProvider";

/**
 * MoreScreen - Settings menu matching Stitch design `1._more_settings_menu`.
 * - Active store summary card with verified badge & offline status
 * - Quick metrics micro-strip (Today Cash, Pending Sync, Terminal)
 * - Navigation list items with 56px minimum touch targets and clean dividers
 * - Dedicated manual theme toggle overriding system color scheme (System / Light / Dark)
 * - Destructive Data Reset clearly highlighted with error token
 * - Support delight banner and footer signature
 * - Layout remains strictly LTR across all locales
 */
export function MoreScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { themePreference, systemColorScheme, setThemePreference } = useThemePreference();

  const handleNavigate = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  const handleThemeChange = useCallback(
    async (pref: ThemePreference) => {
      await setThemePreference(pref);
      const isAr = i18n.language?.startsWith("ar");
      const msg =
        pref === "dark"
          ? isAr
            ? "تم تفعيل الوضع الداكن"
            : "Mode sombre activé"
          : pref === "light"
            ? isAr
              ? "تم تفعيل الوضع الفاتح"
              : "Mode clair activé"
            : isAr
              ? "تم ضبط المظهر حسب إعدادات الجهاز"
              : "Apparence calquée sur le système";
      showToast(msg);
    },
    [setThemePreference, i18n.language]
  );

  const isArabic = i18n.language?.startsWith("ar");
  const currentLang = (i18n.language || "fr").substring(0, 2).toUpperCase();
  const currentLangDesc = isArabic
    ? "العربية (نشطة) • الفرنسية متوفرة"
    : i18n.language?.startsWith("en")
      ? "English (Active) • Arabic & French available"
      : "Français (Actif) • Arabe disponible";

  const textAlignStyle = isArabic ? styles.textRight : styles.textLeft;

  const currentThemeLabel =
    themePreference === "system"
      ? `${t("settings:themeSystem", { defaultValue: t("settings.themeSystem", { defaultValue: isArabic ? "تلقائي" : "Système" }) })} (${systemColorScheme === "dark" ? (isArabic ? "داكن" : "Sombre") : (isArabic ? "فاتح" : "Clair")})`
      : themePreference === "dark"
        ? t("settings:themeDark", { defaultValue: t("settings.themeDark", { defaultValue: isArabic ? "داكن" : "Sombre" }) })
        : t("settings:themeLight", { defaultValue: t("settings.themeLight", { defaultValue: isArabic ? "فاتح" : "Clair" }) });

  const currentThemeDesc =
    themePreference === "system"
      ? isArabic
        ? `مطابقة المظهر تلقائياً مع الجهاز (الجهاز حالياً: ${systemColorScheme === "dark" ? "داكن" : "فاتح"})`
        : `Mise en page calquée sur votre appareil (Actuellement : ${systemColorScheme === "dark" ? "Sombre" : "Clair"})`
      : themePreference === "dark"
        ? t("settings:themeDarkDesc", { defaultValue: t("settings.themeDarkDesc", { defaultValue: isArabic ? "مظهر ليلي داكن ومريح للعين" : "Mode sombre contrasté" }) })
        : t("settings:themeLightDesc", { defaultValue: t("settings.themeLightDesc", { defaultValue: isArabic ? "مظهر نهاري ناصع ومريح" : "Thème clair épuré" }) });

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        { backgroundColor: theme.background },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.container}>
        {/* Top Section Header */}
        <View style={styles.topHeader}>
          <View style={[styles.titleColumn, isArabic && styles.alignEnd]}>
            <ThemedText style={[styles.screenTitle, textAlignStyle, { color: theme.textPrimary }]}>
              {t("settings.title") || "More"}
            </ThemedText>
            <ThemedText style={[styles.screenSubtitle, textAlignStyle, { color: theme.textSecondary }]}>
              {t("onboarding.businessName.defaultShopName") || "Supérette El-Amel"} • {t("settings.subtitle") || "Paramètres"}
            </ThemedText>
          </View>
          <View style={[styles.syncBadge, { backgroundColor: theme.primaryLight }]}>
            <View style={[styles.syncDot, { backgroundColor: theme.primary }]} />
            <ThemedText style={[styles.syncBadgeText, { color: theme.primary }]}>
              {t("settings.localSyncOn") || "Local Sync On"}
            </ThemedText>
          </View>
        </View>

        {/* Active Store Summary Card */}
        <View style={[styles.storeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.storeIconContainer, { backgroundColor: theme.primaryLight }]}>
            <MaterialIcons name="storefront" size={28} color={theme.primary} />
          </View>
          <View style={[styles.storeInfo, isArabic && styles.alignEnd]}>
            <View style={[styles.storeNameRow, isArabic && styles.rowReverse]}>
              <ThemedText style={[styles.storeName, textAlignStyle, { color: theme.textPrimary }]}>
                {t("onboarding.businessName.defaultShopName") || "Supérette El-Amel"}
              </ThemedText>
              <MaterialIcons name="verified" size={18} color={theme.primary} />
            </View>
            <ThemedText style={[styles.storeCategory, textAlignStyle, { color: theme.textSecondary }]}>
              {t("onboarding.businessType.grocerySub") || "Alimentation Générale • Alger Centre"}
            </ThemedText>
            <View style={[styles.storeStatusPill, { backgroundColor: theme.surfaceAlt }, isArabic && styles.rowReverse, isArabic && styles.selfEnd]}>
              <MaterialIcons name="cloud-done" size={13} color={theme.primary} />
              <ThemedText style={[styles.storeStatusText, { color: theme.textSecondary }]}>
                <ThemedText style={{ fontWeight: "800" }}>Dukkan<ThemedText style={{ color: theme.primary, fontWeight: "800" }}>Pro</ThemedText></ThemedText> ({t("settings.offlineReady") || "Offline Ready"})
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Operational Quick Metrics Micro-Strip */}
        <View style={styles.metricsStrip}>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
              {t("settings.todayCash") || "Today Cash"}
            </ThemedText>
            <ThemedText style={[styles.metricValuePrimary, { color: theme.primary }]}>
              {isArabic ? "48 250 دج" : "48 250 DZD"}
            </ThemedText>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
              {t("settings.pendingSync") || "Pending Sync"}
            </ThemedText>
            <ThemedText style={[styles.metricValue, { color: theme.textPrimary }]}>
              {isArabic ? "0 عمليات" : "0 Ops"}
            </ThemedText>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
              {t("settings.terminal") || "Terminal"}
            </ThemedText>
            <ThemedText style={[styles.metricValue, { color: theme.textPrimary }]}>POS #01</ThemedText>
          </View>
        </View>

        {/* Settings Navigation List */}
        <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* 1. Business Profile */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/business")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.primaryLight }]}>
              <MaterialIcons name="store" size={22} color={theme.primary} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle, { color: theme.textPrimary }]}>
                {t("settings.businessProfile") || "Business Profile"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle, { color: theme.textSecondary }]} numberOfLines={1}>
                {t("settings.storeProfileSubtitle") || "Supérette El-Amel, Alger Centre"}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          {/* 2. Language */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/language")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="language" size={22} color={theme.textPrimary} />
            </View>
            <View style={styles.menuRowContent}>
              <View style={[styles.rowTitleWithBadge, isArabic && styles.justifyEnd]}>
                {isArabic && (
                  <View style={[styles.languagePill, { backgroundColor: theme.primaryLight }]}>
                    <ThemedText style={[styles.languagePillText, { color: theme.primary }]}>{currentLang}</ThemedText>
                  </View>
                )}
                <ThemedText style={[styles.menuRowTitle, textAlignStyle, { color: theme.textPrimary }]}>
                  {t("settings.language") || "Language"}
                </ThemedText>
                {!isArabic && (
                  <View style={[styles.languagePill, { backgroundColor: theme.primaryLight }]}>
                    <ThemedText style={[styles.languagePillText, { color: theme.primary }]}>{currentLang}</ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle, { color: theme.textSecondary }]} numberOfLines={1}>
                {currentLangDesc}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          {/* 3. Dedicated Appearance & Theme Manual Override */}
          <View style={styles.themeSectionWrapper}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => handleNavigate("/settings/theme")}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.primaryLight }]}>
                <MaterialIcons
                  name={
                    themePreference === "dark"
                      ? "dark-mode"
                      : themePreference === "light"
                        ? "light-mode"
                        : "brightness-auto"
                  }
                  size={22}
                  color={theme.primary}
                />
              </View>
              <View style={styles.menuRowContent}>
                <View style={[styles.rowTitleWithBadge, isArabic && styles.justifyEnd]}>
                  {isArabic && (
                    <View style={[styles.themePill, { backgroundColor: theme.primaryLight }]}>
                      <ThemedText style={[styles.themePillText, { color: theme.primary }]}>
                        {currentThemeLabel}
                      </ThemedText>
                    </View>
                  )}
                  <ThemedText style={[styles.menuRowTitle, textAlignStyle, { color: theme.textPrimary }]}>
                    {t("settings:theme", {
                      defaultValue: t("settings.theme", {
                        defaultValue: t("theme", { defaultValue: isArabic ? "المظهر" : "Thème" }),
                      }),
                    })}
                  </ThemedText>
                  {!isArabic && (
                    <View style={[styles.themePill, { backgroundColor: theme.primaryLight }]}>
                      <ThemedText style={[styles.themePillText, { color: theme.primary }]}>
                        {currentThemeLabel}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={[styles.menuRowSubtitle, textAlignStyle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {currentThemeDesc}
                </ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Manual 3-Segment Override Switcher */}
            <View
              style={[
                styles.themeSegmentContainer,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.themeSegmentButton,
                  themePreference === "system" && [
                    styles.themeSegmentButtonActive,
                    { backgroundColor: theme.surface },
                  ],
                ]}
                onPress={() => handleThemeChange("system")}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="brightness-auto"
                  size={15}
                  color={themePreference === "system" ? theme.primary : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.themeSegmentText,
                    { color: theme.textSecondary },
                    themePreference === "system" && [
                      styles.themeSegmentTextActive,
                      { color: theme.primary },
                    ],
                  ]}
                >
                  {t("settings:themeSystem", { defaultValue: t("settings.themeSystem", { defaultValue: isArabic ? "تلقائي" : "Système" }) })}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeSegmentButton,
                  themePreference === "light" && [
                    styles.themeSegmentButtonActive,
                    { backgroundColor: theme.surface },
                  ],
                ]}
                onPress={() => handleThemeChange("light")}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="light-mode"
                  size={15}
                  color={themePreference === "light" ? theme.primary : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.themeSegmentText,
                    { color: theme.textSecondary },
                    themePreference === "light" && [
                      styles.themeSegmentTextActive,
                      { color: theme.primary },
                    ],
                  ]}
                >
                  {t("settings:themeLight", { defaultValue: t("settings.themeLight", { defaultValue: isArabic ? "فاتح" : "Clair" }) })}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeSegmentButton,
                  themePreference === "dark" && [
                    styles.themeSegmentButtonActive,
                    { backgroundColor: theme.surface },
                  ],
                ]}
                onPress={() => handleThemeChange("dark")}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="dark-mode"
                  size={15}
                  color={themePreference === "dark" ? theme.primary : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.themeSegmentText,
                    { color: theme.textSecondary },
                    themePreference === "dark" && [
                      styles.themeSegmentTextActive,
                      { color: theme.primary },
                    ],
                  ]}
                >
                  {t("settings:themeDark", { defaultValue: t("settings.themeDark", { defaultValue: isArabic ? "داكن" : "Sombre" }) })}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          {/* 4. Catalogue */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/catalogue")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.primaryLight }]}>
              <MaterialIcons name="share" size={22} color={theme.primary} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle, { color: theme.textPrimary }]}>
                {t("settings.catalogue") || "Catalogue"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle, { color: theme.textSecondary }]} numberOfLines={1}>
                {t("settings.catalogueSubtitle") || "Online link, shareable product list"}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          {/* 6. Data Export */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/export")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="file-download" size={22} color={theme.textPrimary} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle, { color: theme.textPrimary }]}>
                {t("settings.dataExport") || t("exports.title") || "Data Export"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle, { color: theme.textSecondary }]} numberOfLines={1}>
                {t("settings.dataExportSubtitle") || "Backup sales, inventory, customers"}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          {/* 7. Data Reset (Destructive) */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleNavigate("/settings/data-reset")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.errorLight }]}>
              <MaterialIcons name="warning" size={22} color={theme.error} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle, { color: theme.error }]}>
                {t("settings.dataReset") || t("settings.resetApp") || "Data Reset"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle, { color: theme.error, opacity: 0.8 }]} numberOfLines={1}>
                {t("settings.dataResetSubtitle") || "Reset database or clear demo data"}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.error} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          {/* 8. About */}
          <View style={styles.menuRow}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="info" size={22} color={theme.textPrimary} />
            </View>
            <View style={styles.menuRowContent}>
              <ThemedText style={[styles.menuRowTitle, textAlignStyle, { color: theme.textPrimary }]}>
                {t("settings.about") || "About"}
              </ThemedText>
              <ThemedText style={[styles.menuRowSubtitle, textAlignStyle, { color: theme.textSecondary }]} numberOfLines={1}>
                <ThemedText style={{ fontWeight: "800" }}>Dukkan<ThemedText style={{ color: theme.primary, fontWeight: "800" }}>Pro</ThemedText></ThemedText>, retail software for Algerian merchants
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </View>
        </View>

        {/* Subtle Footer Signature */}
        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: theme.textMuted }]}>
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
  },
  screenSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  storeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
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
  },
  storeCategory: {
    ...Typography.caption,
    marginTop: 2,
  },
  storeStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  storeStatusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  metricsStrip: {
    flexDirection: "row",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    ...Shadows.sm,
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metricValuePrimary: {
    fontSize: 15,
    fontWeight: "700",
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  menuCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadows.sm,
  },
  themeSectionWrapper: {
    paddingBottom: Spacing.xs,
  },
  themeSegmentContainer: {
    flexDirection: "row",
    marginHorizontal: ComponentDimensions.cardPadding,
    marginBottom: Spacing.sm,
    padding: 3,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 4,
  },
  themeSegmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm - 2,
    gap: 5,
  },
  themeSegmentButtonActive: {
    ...Shadows.sm,
  },
  themeSegmentText: {
    fontSize: 12,
    fontWeight: "500",
  },
  themeSegmentTextActive: {
    fontWeight: "700",
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
    lineHeight: 18,
  },
  languagePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  languagePillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  themePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  menuRowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: ComponentDimensions.cardPadding,
  },
  supportBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  supportSubtitle: {
    fontSize: 12,
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

