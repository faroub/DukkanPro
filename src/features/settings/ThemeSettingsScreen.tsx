import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { showToast } from "@/components/use-toast";
import {
    BorderRadius,
    Colors,
    ComponentDimensions,
    Shadows,
    Spacing,
    Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ThemePreference, useThemePreference } from "@/providers/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ThemeOptionItem {
  id: ThemePreference;
  titleKey: string;
  descKey: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  previewBg: string;
  previewCardBg: string;
  previewTextColor: string;
  previewPrimary: string;
}

const THEME_OPTIONS: ThemeOptionItem[] = [
  {
    id: "system",
    titleKey: "settings.themeSystem",
    descKey: "settings.themeSystemDesc",
    icon: "brightness-auto",
    previewBg: "#E5E7EB",
    previewCardBg: "#FFFFFF",
    previewTextColor: "#1A1A1A",
    previewPrimary: "#1B6B3A",
  },
  {
    id: "light",
    titleKey: "settings.themeLight",
    descKey: "settings.themeLightDesc",
    icon: "light-mode",
    previewBg: "#F8F7F4",
    previewCardBg: "#FFFFFF",
    previewTextColor: "#1A1A1A",
    previewPrimary: "#1B6B3A",
  },
  {
    id: "dark",
    titleKey: "settings.themeDark",
    descKey: "settings.themeDarkDesc",
    icon: "dark-mode",
    previewBg: "#121212",
    previewCardBg: "#1F2937",
    previewTextColor: "#F9FAFB",
    previewPrimary: "#1B6B3A",
  },
];

export function ThemeSettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    themePreference,
    colorScheme,
    systemColorScheme,
    setThemePreference,
  } = useThemePreference();

  const isArabic = i18n.language?.startsWith("ar");
  const textAlignStyle = isArabic ? styles.textRight : styles.textLeft;

  const handleSelectTheme = useCallback(
    async (pref: ThemePreference) => {
      await setThemePreference(pref);
      const msg =
        pref === "dark"
          ? isArabic
            ? "تم تفعيل الوضع الداكن"
            : "Mode sombre activé"
          : pref === "light"
            ? isArabic
              ? "تم تفعيل الوضع الفاتح"
              : "Mode clair activé"
            : isArabic
              ? "تم ضبط المظهر حسب إعدادات الجهاز"
              : "Apparence calquée sur le système";
      showToast(msg);
    },
    [setThemePreference, isArabic],
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        {
          backgroundColor: theme.background,
          paddingTop: Math.max(insets.top, Spacing.lg),
          paddingBottom: insets.bottom + Spacing.xxl,
          paddingLeft: insets.left + Spacing.lg,
          paddingRight: insets.right + Spacing.lg,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.container}>
        {/* Top Header Navigation */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={theme.textPrimary}
            />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <ThemedText style={[styles.screenTitle, styles.textLeft]}>
              {t("settings:theme", {
                defaultValue: t("settings.theme", {
                  defaultValue: t("theme", {
                    defaultValue: isArabic ? "المظهر" : "Thème",
                  }),
                }),
              })}
            </ThemedText>
            <ThemedText style={[styles.screenSubtitle, textAlignStyle]}>
              {t("settings:themeSubtitle", {
                defaultValue: t("settings.themeSubtitle", {
                  defaultValue: isArabic
                    ? "الوضع الفاتح، الداكن، أو حسب إعدادات الجهاز"
                    : "Mode clair, sombre ou système",
                }),
              })}
            </ThemedText>
          </View>
        </View>

        {/* Active Mode Banner */}
        <View
          style={[
            styles.activeBanner,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.activeBannerIconContainer,
              { backgroundColor: theme.primaryLight },
            ]}
          >
            <MaterialIcons
              name={
                themePreference === "dark"
                  ? "dark-mode"
                  : themePreference === "light"
                    ? "light-mode"
                    : "brightness-auto"
              }
              size={24}
              color={theme.primary}
            />
          </View>
          <View
            style={[styles.activeBannerContent, isArabic && styles.alignEnd]}
          >
            <ThemedText style={[styles.activeBannerTitle, textAlignStyle]}>
              {themePreference === "system"
                ? `${t("settings.themeSystem") || "System"} (${isArabic ? "الجهاز: " : "Appareil : "}${systemColorScheme === "dark" ? (isArabic ? "داكن" : "Sombre") : isArabic ? "فاتح" : "Clair"})`
                : themePreference === "dark"
                  ? `${t("settings.themeDark") || "Dark"} (${isArabic ? "مفروض" : "Forcé"})`
                  : `${t("settings.themeLight") || "Light"} (${isArabic ? "مفروض" : "Forcé"})`}
            </ThemedText>
            <ThemedText style={[styles.activeBannerSubtitle, textAlignStyle]}>
              {themePreference === "system"
                ? isArabic
                  ? `يتبع النظام تلقائياً. المظهر المكتشف حالياً: ${systemColorScheme === "dark" ? "داكن" : "فاتح"}`
                  : `Suit la configuration du système. Actuellement détecté : ${systemColorScheme === "dark" ? "Sombre" : "Clair"}`
                : themePreference === "dark"
                  ? t("settings.themeDarkDesc") ||
                    "Moteur داكن ثابت بغض النظر عن الجهاز"
                  : t("settings.themeLightDesc") ||
                    "Mode clair ثابت بغض النظر عن الجهاز"}
            </ThemedText>
          </View>
        </View>

        {/* Theme Options Card */}
        <View
          style={[
            styles.optionsCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {THEME_OPTIONS.map((opt, index) => {
            const isSelected = themePreference === opt.id;
            let optionSubtext = t(opt.descKey);
            if (opt.id === "system") {
              optionSubtext = isArabic
                ? `تطبيق مظهر النظام تلقائياً (الجهاز حالياً: ${systemColorScheme === "dark" ? "داكن" : "فاتح"})`
                : `Synchroniser avec votre appareil (Actuellement : ${systemColorScheme === "dark" ? "Sombre" : "Clair"})`;
            } else if (opt.id === "light") {
              optionSubtext = isArabic
                ? "فرض الوضع الفاتح دائماً"
                : "Conserver le mode clair en permanence";
            } else if (opt.id === "dark") {
              optionSubtext = isArabic
                ? "فرض الوضع الداكن دائماً"
                : "Conserver le mode sombre en permanence";
            }

            return (
              <React.Fragment key={opt.id}>
                {index > 0 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.borderLight },
                    ]}
                  />
                )}
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    isSelected && {
                      backgroundColor: theme.surfaceAlt,
                    },
                  ]}
                  onPress={() => handleSelectTheme(opt.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      {
                        backgroundColor: isSelected
                          ? theme.primaryLight
                          : theme.surfaceAlt,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={opt.icon}
                      size={22}
                      color={isSelected ? theme.primary : theme.textPrimary}
                    />
                  </View>

                  <View style={styles.optionContent}>
                    <View style={styles.optionTitleRow}>
                      <ThemedText
                        style={[
                          styles.optionTitle,
                          textAlignStyle,
                          isSelected && {
                            color: theme.primary,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {t(opt.titleKey)}
                        {opt.id === "system"
                          ? ` (${systemColorScheme === "dark" ? (isArabic ? "داكن" : "Sombre") : isArabic ? "فاتح" : "Clair"})`
                          : ""}
                      </ThemedText>
                      {isSelected && (
                        <View
                          style={[
                            styles.activeBadge,
                            { backgroundColor: theme.primaryLight },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.activeBadgeText,
                              { color: theme.primary },
                            ]}
                          >
                            {isArabic ? "نشط" : "Actif"}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText
                      style={[styles.optionDesc, textAlignStyle]}
                      numberOfLines={2}
                    >
                      {optionSubtext}
                    </ThemedText>
                  </View>

                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInnerCircle,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* Live Visual Palette Preview */}
        <View
          style={[
            styles.previewSection,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ThemedText style={[styles.previewSectionTitle, textAlignStyle]}>
            {isArabic ? "معاينة عناصر الواجهة" : "Aperçu des composants"}
          </ThemedText>
          <ThemedText style={[styles.previewSectionSubtitle, textAlignStyle]}>
            {isArabic
              ? "استجابة فورية لعناصر البيع والمخزون والإعدادات"
              : "Mise à jour en temps réel des boutons, cartes et textes"}
          </ThemedText>

          <View style={styles.previewComponentsGrid}>
            <View
              style={[
                styles.previewMiniCard,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText style={styles.previewMiniLabel}>
                {isArabic ? "زر الإجراء الرئيسي" : "Bouton Principal"}
              </ThemedText>
              <View
                style={[
                  styles.previewButtonPrimary,
                  { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText style={styles.previewButtonText}>
                  {isArabic ? "تأكيد العملية" : "Valider"}
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.previewMiniCard,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText style={styles.previewMiniLabel}>
                {isArabic ? "بطاقة السعر والعملة" : "Badge Monétaire"}
              </ThemedText>
              <View
                style={[
                  styles.previewPill,
                  { backgroundColor: theme.primaryLight },
                ]}
              >
                <ThemedText
                  style={[styles.previewPillText, { color: theme.primary }]}
                >
                  {isArabic ? "1 500 دج" : "1 500 DZD"}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Footer Trademark */}
        <FooterTrademark />
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
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  headerTitles: {
    flex: 1,
  },
  screenTitle: {
    ...Typography.heading2,
    fontSize: 20,
    fontWeight: "700",
  },
  screenSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  activeBannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  activeBannerContent: {
    flex: 1,
  },
  activeBannerTitle: {
    ...Typography.heading3,
  },
  activeBannerSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  optionsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadows.sm,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 68,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  optionTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  activeBadgeText: {
    ...Typography.caption,
    fontWeight: "700",
    fontSize: 11,
  },
  optionDesc: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  previewSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  previewSectionTitle: {
    ...Typography.heading3,
  },
  previewSectionSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  previewComponentsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  previewMiniCard: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  previewMiniLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  previewButtonPrimary: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.sm,
  },
  previewButtonText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  previewPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  previewPillText: {
    ...Typography.caption,
    fontWeight: "700",
  },
  textLeft: {
    textAlign: "left",
  },
  textRight: {
    textAlign: "right",
  },
  alignEnd: {
    alignItems: "flex-end",
  },
});
