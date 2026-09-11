import { ThemedText, ThemedView, showToast } from "@/components";
import i18n from "@/localization/i18n";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Colors, Spacing, BorderRadius, ComponentDimensions } from "@/constants/theme";

/**
 * MoreScreen - The "More" tab screen showing all settings sections.
 * - Shows: Business profile, Language, Inventory rules, Catalogue,
 *   Data export, Data reset, About
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
    router.push("/settings/data-reset" as any);
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

        {/* Quick Metrics Strip */}
        <ThemedView style={styles.metricsStrip}>
          <ThemedView style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>{t("settings.todayCash")}</ThemedText>
            <ThemedText style={styles.metricValue}>48 250 DA</ThemedText>
          </ThemedView>
          <ThemedView style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>{t("settings.pendingSync")}</ThemedText>
            <ThemedText style={styles.metricValue}>0 Ops</ThemedText>
          </ThemedView>
          <ThemedView style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>{t("settings.terminal")}</ThemedText>
            <ThemedText style={styles.metricValue}>POS #01</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.settingsSection}>
          <ThemedText style={styles.settingsTitle}>
            {t("settings.languageDescription")}
          </ThemedText>

          {/* Language option inside settings section */}
          <ThemedView style={styles.languageOption}>
            <TouchableOpacity
              style={styles.languageOptionItem}
              onPress={() => handleLanguageChange("ar")}
              accessibilityRole="radio"
              accessibilityState={i18n.language === "ar" ? { checked: true } : undefined}
            >
              <ThemedText style={styles.languageOptionLabel}>
                {t("settings.arabic")}
              </ThemedText>
            </TouchableOpacity>

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

        {/* Business Profile */}
        <a className="group flex items-center min-h-[56px] px-card-padding py-3.5 transition-colors active:bg-surface-alt" href="#">
          <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0 mr-3.5 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">store</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-label text-text-primary leading-tight">{t("settings.businessProfile")}</p>
            <p className="font-caption text-caption text-text-secondary truncate mt-0.5">Supérette El-Amel, Alger Centre</p>
          </div>
          <span className="material-symbols-outlined text-text-muted text-[20px] ml-2 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </a>
        <div className="h-[1px] bg-divider mx-card-padding"></div>

        {/* Language */}
        <a className="group flex items-center min-h-[56px] px-card-padding py-3.5 transition-colors active:bg-surface-alt" href="#">
          <div className="w-10 h-10 rounded-lg bg-surface-alt text-text-primary flex items-center justify-center flex-shrink-0 mr-3.5 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">language</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-label text-label text-text-primary leading-tight">Language</p>
            <span className="bg-primary-light text-primary text-[11px] font-semibold px-2 py-0.2 rounded">FR</span>
          </div>
          <p className="font-caption text-caption text-text-secondary truncate mt-0.5">Français (Actif) • Arabe disponible</p>
          <span className="material-symbols-outlined text-text-muted text-[20px] ml-2 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </a>
        <div className="h-[1px] bg-divider mx-card-padding"></div>

        {/* Inventory Rules */}
        <a className="group flex items-center min-h-[56px] px-card-padding py-3.5 transition-colors active:bg-surface-alt" href="#">
          <div className="w-10 h-10 rounded-lg bg-surface-alt text-text-primary flex items-center justify-center flex-shrink-0 mr-3.5 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-label text-text-primary leading-tight">Inventory Rules</p>
            <p className="font-caption text-caption text-text-secondary truncate mt-0.5">Alert thresholds, low stock alerts</p>
          </div>
          <span className="material-symbols-outlined text-text-muted text-[20px] ml-2 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </a>
        <div className="h-[1px] bg-divider mx-card-padding"></div>

        {/* Catalogue */}
        <a className="group flex items-center min-h-[56px] px-card-padding py-3.5 transition-colors active:bg-surface-alt" href="#">
          <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0 mr-3.5 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">share</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-label text-text-primary leading-tight">Catalogue</p>
            <p className="font-caption text-caption text-text-secondary truncate mt-0.5">Online link, shareable product list</p>
          </div>
          <span className="material-symbols-outlined text-text-muted text-[20px] ml-2 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </a>
        <div className="h-[1px] bg-divider mx-card-padding"></div>

        {/* Data Export */}
        <a className="group flex items-center min-h-[56px] px-card-padding py-3.5 transition-colors active:bg-surface-alt" href="#">
          <div className="w-10 h-10 rounded-lg bg-surface-alt text-text-primary flex items-center justify-center flex-shrink-0 mr-3.5 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">file_download</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-label text-text-primary leading-tight">Data Export</p>
            <p className="font-caption text-caption text-text-secondary truncate mt-0.5">Backup sales, inventory, customers</p>
          </div>
          <span className="material-symbols-outlined text-text-muted text-[20px] ml-2 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </a>
        <div className="h-[1px] bg-divider mx-card-padding"></div>

        {/* Data Reset (Destructive) */}
        <a className="group flex items-center min-h-[56px] px-card-padding py-3.5 transition-colors active:bg-error-light" href="#">
          <div className="w-10 h-10 rounded-lg bg-error-light text-tertiary flex items-center justify-center flex-shrink-0 mr-3.5 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px] text-tertiary">warning</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-label text-tertiary leading-tight">Data Reset</p>
            <p className="font-caption text-caption text-tertiary/80 truncate mt-0.5">Reset database or clear demo data</p>
          </div>
          <span className="material-symbols-outlined text-tertiary/60 text-[20px] ml-2 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </a>
        <div className="h-[1px] bg-divider mx-card-padding"></div>

        {/* About */}
        <a className="group flex items-center min-h-[56px] px-card-padding py-3.5 transition-colors active:bg-surface-alt" href="#">
          <div className="w-10 h-10 rounded-lg bg-surface-alt text-text-primary flex items-center justify-center flex-shrink-0 mr-3.5 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">info</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-label text-text-primary leading-tight">About</p>
            <p className="font-caption text-caption text-text-secondary truncate mt-0.5">Dukkan OS, open retail software for Algerian merchants</p>
          </div>
          <span className="material-symbols-outlined text-text-muted text-[20px] ml-2 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </a>
        <div className="h-[1px] bg-divider mx-card-padding"></div>

        {/* Community & Support Delight Banner */}
        <ThemedView style={styles.communityBanner}>
          <ThemedView style={styles.communityBannerInner}>
            <ThemedView style={styles.communityBannerIcon}>
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </ThemedView>
            <ThemedView style={styles.communityBannerContent}>
              <ThemedText style={styles.communityBannerTitle}>Need merchant support?</ThemedText>
              <ThemedText style={styles.communityBannerSubtitle}>Direct WhatsApp line open Sunday to Thursday 08:00 - 19:00.</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Warm Community & Support Delight Banner (Stitch version) */}
        <ThemedView style={styles.communityBannerStitch}>
          <ThemedView style={styles.communityBannerStitchInner}>
            <ThemedView style={styles.communityBannerStitchIcon}>
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </ThemedView>
            <ThemedView style={styles.communityBannerStitchContent}>
              <ThemedText style={styles.communityBannerStitchTitle}>Need merchant support?</ThemedText>
              <ThemedText style={styles.communityBannerStitchSubtitle}>Direct WhatsApp line open Sunday to Thursday 08:00 - 19:00.</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Subtle Footer Signature */}
        <ThemedView style={styles.footerSignature}>
          <ThemedText style={styles.footerText}>
            Conçu avec fierté pour le commerce de proximité • 2025
          </ThemedText>
        </ThemedView>
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
  metricsStrip: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  metricItem: {
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 18,
    color: Colors.light.primary,
    fontWeight: "600",
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
  communityBanner: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  communityBannerInner: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  communityBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primaryLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 4,
  },
  communityBannerContent: {
    flex: 1,
  },
  communityBannerTitle: {
    fontSize: 15,
    color: Colors.light.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },
  communityBannerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  communityBannerStitch: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  communityBannerStitchIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primaryLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 4,
    flexShrink: 0,
  },
  communityBannerStitchContent: {
    flex: 1,
  },
  communityBannerStitchTitle: {
    fontSize: 15,
    color: Colors.light.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },
  communityBannerStitchSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  footerSignature: {
    padding: Spacing.md,
    alignItems: "center",
    color: Colors.light.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
});