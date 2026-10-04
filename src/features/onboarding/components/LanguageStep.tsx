import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "react-i18next";

interface LanguageStepProps {
  onContinue: (data: { locale: "ar" | "fr" | "en" }) => void;
  selectedLocale?: "ar" | "fr" | "en";
}

export function LanguageStep({
  onContinue,
  selectedLocale = "fr",
}: LanguageStepProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [locale, setLocale] = useState<"ar" | "fr" | "en">(selectedLocale);

  const handleSelectLanguage = (code: "ar" | "fr" | "en") => {
    setLocale(code);
    i18n.changeLanguage(code);
  };

  const handleContinue = () => {
    onContinue({ locale });
  };

  const languages = [
    {
      code: "ar" as const,
      badge: "ع",
      name: t("onboarding.welcome.arabic", { defaultValue: "العربية" }),
      subtitle: t("onboarding.welcome.arabicSub", { defaultValue: "Arabe" }),
      isRtlText: true,
      isDefault: false,
    },
    {
      code: "fr" as const,
      badge: "FR",
      name: t("onboarding.welcome.french", { defaultValue: "Français" }),
      subtitle: t("onboarding.welcome.frenchSub", { defaultValue: "French" }),
      isRtlText: false,
      isDefault: true,
    },
    {
      code: "en" as const,
      badge: "EN",
      name: t("onboarding.welcome.english", { defaultValue: "English" }),
      subtitle: t("onboarding.welcome.englishSub", { defaultValue: "Anglais" }),
      isRtlText: false,
      isDefault: false,
    },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.innerWrapper}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <SymbolView
              name={{
                ios: "storefront.fill" as any,
                android: "storefront" as any,
                web: "storefront" as any,
              }}
              size={48}
              tintColor={theme.primary}
            />
          </View>

          <ThemedText style={[styles.title, { color: theme.textPrimary }]}>
            Dukkan<ThemedText style={[styles.title, { color: theme.primary }]}>Pro</ThemedText>
          </ThemedText>

          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t("onboarding.welcome.subtitle", {
              defaultValue: "Choose your primary operating language",
            })}
          </ThemedText>

          {/* Quick Arabic Callout Pill */}
          <View style={[styles.arabicPill, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
            <Text style={[styles.arabicPillText, { color: theme.primary }]}>
              {t("onboarding.welcome.arabicPill", {
                defaultValue: "يدعم العربية والفرنسية والإنجليزية بالكامل",
              })}
            </Text>
          </View>
        </View>

        {/* Language Selection List matching Stitch */}
        <View style={styles.optionsSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {t("onboarding.welcome.selectLanguage", {
                defaultValue: "OPERATING LANGUAGE / لغة التشغيل",
              })}
            </ThemedText>
          </View>

          <View style={styles.cardsContainer}>
            {languages.map((lang) => {
              const isSelected = locale === lang.code;

              return (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.langCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelected && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.langLeft}>
                    <View
                      style={[
                        styles.badgeCircle,
                        { backgroundColor: theme.backgroundElement },
                        isSelected && { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: theme.textPrimary },
                          isSelected && { color: "#FFFFFF" },
                        ]}
                      >
                        {lang.badge}
                      </Text>
                    </View>

                    <View style={styles.langTextWrapper}>
                      <Text
                        style={[
                          styles.langName,
                          { color: theme.textPrimary },
                          lang.isRtlText && styles.rtlText,
                        ]}
                      >
                        {lang.name}
                      </Text>
                      <Text style={[styles.langSub, { color: theme.textSecondary }]}>{lang.subtitle}</Text>
                    </View>
                  </View>

                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioIndicator,
                      { borderColor: theme.border },
                      isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                  >
                    {isSelected && (
                      <SymbolView
                        name={{
                          ios: "checkmark" as any,
                          android: "check" as any,
                          web: "check" as any,
                        }}
                        size={14}
                        tintColor="#FFFFFF"
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Reassurance Micro-Card */}
        <View style={[styles.trustCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.trustIconWrapper, { backgroundColor: theme.primaryLight }]}>
            <SymbolView
              name={{
                ios: "checkmark.shield.fill" as any,
                android: "verified_user" as any,
                web: "verified_user" as any,
              }}
              size={20}
              tintColor={theme.primary}
            />
          </View>
          <View style={styles.trustContent}>
            <ThemedText style={[styles.trustTitle, { color: theme.textPrimary }]}>
              {t("onboarding.welcome.offlineTitle", {
                defaultValue: "Offline-ready & Secure",
              })}
            </ThemedText>
            <ThemedText style={[styles.trustSubtitle, { color: theme.textSecondary }]}>
              {t("onboarding.welcome.offlineDesc", {
                defaultValue:
                  "Work seamlessly with or without internet connection",
              })}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Continue CTA */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.continueButton, { backgroundColor: theme.primary }]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.welcome.continue", {
            defaultValue: "Continue",
          })}
        >
          <Text style={styles.continueButtonText}>
            {t("onboarding.welcome.continue", {
              defaultValue:
                locale === "fr"
                  ? "Continuer"
                  : locale === "ar"
                  ? "متابعة"
                  : "Continue",
            })}
          </Text>
          <SymbolView
            name={{
              ios: "arrow.right" as any,
              android: "arrow_forward" as any,
              web: "arrow_forward" as any,
            }}
            size={18}
            tintColor="#FFFFFF"
          />
        </Pressable>

        <ThemedText style={[styles.settingsNote, { color: theme.textMuted }]}>
          {t("onboarding.welcome.changeLanguageNote", {
            defaultValue: "You can change your language anytime in Settings",
          })}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  innerWrapper: {
    flex: 1,
    justifyContent: "flex-start",
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadows.md,
    borderWidth: 1,
  },
  title: {
    ...Typography.heading1,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.bodyLarge,
    marginTop: 4,
    textAlign: "center",
  },
  arabicPill: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    ...Shadows.sm,
  },
  arabicPillText: {
    ...Typography.label,
    textAlign: "center",
  },
  optionsSection: {
    marginVertical: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...Typography.label,
    fontSize: 12,
  },
  cardsContainer: {
    gap: Spacing.sm,
  },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  langLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  badgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 15,
    fontWeight: "700",
  },
  langTextWrapper: {
    flex: 1,
  },
  langName: {
    ...Typography.bodyLarge,
    fontWeight: "600",
  },
  rtlText: {
    textAlign: "left",
  },
  langSub: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  trustCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  trustIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  trustContent: {
    flex: 1,
  },
  trustTitle: {
    ...Typography.label,
  },
  trustSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    gap: Spacing.sm,
  },
  continueButton: {
    height: ComponentDimensions.primaryButtonHeight,
    borderRadius: BorderRadius.button,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.md,
  },
  continueButtonText: {
    color: "#FFFFFF",
    ...Typography.label,
    fontSize: 16,
  },
  settingsNote: {
    ...Typography.caption,
    fontSize: 12,
    textAlign: "center",
  },
});
