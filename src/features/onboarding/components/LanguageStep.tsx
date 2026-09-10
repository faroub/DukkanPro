import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
    <ThemedView style={styles.container}>
      <View style={styles.innerWrapper}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <SymbolView
              name={{
                ios: "storefront.fill" as any,
                android: "storefront" as any,
                web: "storefront" as any,
              }}
              size={44}
              tintColor={Colors.light.primary}
            />
          </View>

          <ThemedText style={styles.title}>
            {t("onboarding.welcome.title", { defaultValue: "Dukkan OS" })}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("onboarding.welcome.subtitle", {
              defaultValue: "Your simple business companion",
            })}
          </ThemedText>

          <View style={styles.arabicPill}>
            <Text style={styles.arabicPillText}>
              {t("onboarding.welcome.arabicPill", {
                defaultValue: "رفيق أعمالك البسيط",
              })}
            </Text>
          </View>
        </View>

        {/* Language Selection Section */}
        <View style={styles.optionsSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              {t("onboarding.welcome.sectionTitle", {
                defaultValue: "Select Language • اختر اللغة",
              })}
            </ThemedText>
            <SymbolView
              name={{
                ios: "globe" as any,
                android: "language" as any,
                web: "language" as any,
              }}
              size={18}
              tintColor={Colors.light.textMuted}
            />
          </View>

          <View style={styles.cardsContainer}>
            {languages.map((lang) => {
              const isSelected = locale === lang.code;

              return (
                <Pressable
                  key={lang.code}
                  onPress={() => handleSelectLanguage(lang.code)}
                  style={[
                    styles.card,
                    isSelected ? styles.cardSelected : styles.cardUnselected,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.langBadge,
                        isSelected && styles.langBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.langBadgeText,
                          isSelected && styles.langBadgeTextSelected,
                        ]}
                      >
                        {lang.badge}
                      </Text>
                    </View>

                    <View style={styles.nameContainer}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.langName,
                            isSelected && styles.langNameSelected,
                            lang.isRtlText && styles.rtlAlign,
                          ]}
                        >
                          {lang.name}
                        </Text>
                        {lang.isDefault && (
                          <View style={styles.defaultTag}>
                            <Text style={styles.defaultTagText}>
                              {t("onboarding.welcome.defaultBadge", {
                                defaultValue: "DÉFAUT",
                              })}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.langSubtitle,
                          isSelected && styles.langSubtitleSelected,
                        ]}
                      >
                        {lang.subtitle}
                      </Text>
                    </View>
                  </View>

                  {/* Radio Indicator matching Stitch */}
                  <View
                    style={[
                      styles.radioIndicator,
                      isSelected && styles.radioIndicatorSelected,
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
                        tintColor={Colors.light.surface}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Reassurance Micro-Card matching Stitch */}
        <View style={styles.trustCard}>
          <View style={styles.trustIconWrapper}>
            <SymbolView
              name={{
                ios: "checkmark.shield.fill" as any,
                android: "verified_user" as any,
                web: "verified_user" as any,
              }}
              size={20}
              tintColor={Colors.light.primary}
            />
          </View>
          <View style={styles.trustContent}>
            <ThemedText style={styles.trustTitle}>
              {t("onboarding.welcome.offlineTitle", {
                defaultValue: "Offline-ready & Secure",
              })}
            </ThemedText>
            <ThemedText style={styles.trustSubtitle}>
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
          style={styles.continueButton}
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
            tintColor={Colors.light.surface}
          />
        </Pressable>

        <ThemedText style={styles.settingsNote}>
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
    backgroundColor: Colors.light.background,
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
    backgroundColor: Colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    ...Typography.heading1,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  arabicPill: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    ...Shadows.sm,
  },
  arabicPillText: {
    ...Typography.label,
    color: Colors.light.primaryDark,
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
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardsContainer: {
    gap: Spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    minHeight: 72,
  },
  cardUnselected: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardSelected: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  langBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  langBadgeSelected: {
    backgroundColor: Colors.light.primary,
  },
  langBadgeText: {
    ...Typography.label,
    fontWeight: "700",
    fontSize: 16,
    color: Colors.light.textPrimary,
  },
  langBadgeTextSelected: {
    color: Colors.light.surface,
  },
  nameContainer: {
    justifyContent: "center",
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  langName: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  langNameSelected: {
    color: Colors.light.primaryDark,
    fontWeight: "700",
  },
  rtlAlign: {
    textAlign: "left",
  },
  defaultTag: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  defaultTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.surface,
    letterSpacing: 0.5,
  },
  langSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  langSubtitleSelected: {
    color: Colors.light.primary,
  },
  radioIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  radioIndicatorSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  trustCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  trustIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  trustContent: {
    flex: 1,
  },
  trustTitle: {
    ...Typography.body,
    fontWeight: "600",
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  trustSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  continueButton: {
    backgroundColor: Colors.light.primary,
    height: 48,
    borderRadius: BorderRadius.button,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  continueButtonText: {
    color: Colors.light.surface,
    ...Typography.body,
    fontWeight: "600",
  },
  settingsNote: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
