import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
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

const LANGUAGES = [
  {
    code: "ar" as const,
    badge: "ع",
    name: "العربية",
    subtitle: "Arabe",
    isRtlText: true,
  },
  {
    code: "fr" as const,
    badge: "FR",
    name: "Français",
    subtitle: "French",
    isRtlText: false,
  },
  {
    code: "en" as const,
    badge: "EN",
    name: "English",
    subtitle: "Anglais",
    isRtlText: false,
  },
];

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

  return (
    <ThemedView style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <SymbolView
            name={{
              ios: "storefront.fill" as any,
              android: "storefront" as any,
              web: "storefront" as any,
            }}
            size={40}
            tintColor={Colors.light.primary}
          />
        </View>

        <ThemedText style={styles.title}>Dukkan OS</ThemedText>
        <ThemedText style={styles.subtitle}>
          Your simple business companion
        </ThemedText>

        <View style={styles.arabicPill}>
          <Text style={styles.arabicPillText}>رفيق أعمالك البسيط</Text>
        </View>
      </View>

      {/* Language Options Section */}
      <View style={styles.optionsSection}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>
            {t("onboarding:languageStep.sectionTitle")}
          </ThemedText>
        </View>

        <View style={styles.cardsContainer}>
          {LANGUAGES.map((lang) => {
            const isSelected = locale === lang.code;

            return (
              <Pressable
                key={lang.code}
                onPress={() => handleSelectLanguage(lang.code)}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
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
                    <Text
                      style={[
                        styles.langName,
                        lang.isRtlText && styles.rtlAlign,
                      ]}
                    >
                      {lang.name}
                    </Text>
                    <Text style={styles.langSubtitle}>{lang.subtitle}</Text>
                  </View>
                </View>

                {/* Radio Indicator */}
                <View
                  style={[
                    styles.radioIndicator,
                    isSelected && styles.radioIndicatorSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Continue CTA */}
      <View style={styles.footer}>
        <PrimaryButton
          title={
            locale === "fr"
              ? t("common:primaryButton")
              : locale === "ar"
              ? "متابعة"
              : "Continue"
          }
          onPress={handleContinue}
        />
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
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 80,
    height: 80,
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
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  arabicPill: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    ...Shadows.sm,
  },
  arabicPillText: {
    ...Typography.label,
    color: Colors.light.primaryDark,
    textAlign: "center",
  },
  optionsSection: {
    flex: 1,
    justifyContent: "center",
    marginVertical: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardsContainer: {
    gap: ComponentDimensions.cardGap,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
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
    color: Colors.light.textPrimary,
  },
  langBadgeTextSelected: {
    color: Colors.light.textPrimary,
  },
  nameContainer: {
    justifyContent: "center",
  },
  langName: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  rtlAlign: {
    textAlign: "right",
  },
  langSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioIndicatorSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surface,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  footer: {
    marginTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
});