import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

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

interface BusinessTypeStepProps {
  onContinue: (data: { businessType: string }) => void;
  onBack?: () => void;
  selectedType?: string;
  stepNumber?: number;
  totalSteps?: number;
}

const PRESET_IDS = [
  "grocery",
  "bakery",
  "instagram_seller",
  "clothing",
  "cosmetics",
  "general_retail",
];

export function BusinessTypeStep({
  onContinue,
  onBack,
  selectedType = "grocery",
  stepNumber = 2,
  totalSteps = 3,
}: BusinessTypeStepProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const isPreset = PRESET_IDS.includes(selectedType);
  const [currentType, setCurrentType] = useState<string>(isPreset ? selectedType : "custom");
  const [customTypeName, setCustomTypeName] = useState<string>(isPreset ? "" : selectedType);

  const businessCategories = [
    {
      id: "grocery",
      name: t("onboarding.businessType.grocery", {
        defaultValue: "Grocery shop",
      }),
      subtitle: t("onboarding.businessType.grocerySub", {
        defaultValue: "Alimentation Générale • Fast barcode POS",
      }),
      icon: "storefront",
      popular: true,
    },
    {
      id: "bakery",
      name: t("onboarding.businessType.bakery", {
        defaultValue: "Home bakery",
      }),
      subtitle: t("onboarding.businessType.bakerySub", {
        defaultValue: "Boulangerie & Pâtisserie • Custom orders",
      }),
      icon: "shopping_bag",
      popular: false,
    },
    {
      id: "instagram_seller",
      name: t("onboarding.businessType.instagram", {
        defaultValue: "Instagram seller",
      }),
      subtitle: t("onboarding.businessType.instagramSub", {
        defaultValue: "Vente en ligne • Social commerce & delivery",
      }),
      icon: "share",
      popular: true,
    },
    {
      id: "clothing",
      name: t("onboarding.businessType.clothing", {
        defaultValue: "Clothing & Fashion",
      }),
      subtitle: t("onboarding.businessType.clothingSub", {
        defaultValue: "Habillement • Size & color variants",
      }),
      icon: "checkroom",
      popular: false,
    },
    {
      id: "cosmetics",
      name: t("onboarding.businessType.cosmetics", {
        defaultValue: "Cosmetics & Beauty",
      }),
      subtitle: t("onboarding.businessType.cosmeticsSub", {
        defaultValue: "Cosmétiques & Parfumerie",
      }),
      icon: "content_cut",
      popular: false,
    },
    {
      id: "general_retail",
      name: t("onboarding.businessType.general", {
        defaultValue: "General Retail",
      }),
      subtitle: t("onboarding.businessType.generalSub", {
        defaultValue: "Commerce général • Flexible ledger",
      }),
      icon: "category",
      popular: false,
    },
    {
      id: "custom",
      name: t("onboarding.businessType.custom", {
        defaultValue: "Custom Shop Activity / Other",
      }),
      subtitle: t("onboarding.businessType.customSub", {
        defaultValue: "Define your specific shop type (e.g., Quincaillerie, Kiosque, Mobile Shop)",
      }),
      icon: "edit",
      popular: false,
    },
  ];

  const handleContinue = () => {
    const finalType =
      currentType === "custom"
        ? customTypeName.trim() ||
          t("onboarding.businessType.customDefault", {
            defaultValue: "Custom Shop",
          })
        : currentType;

    onContinue({ businessType: finalType });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Bar Navigation matching Stitch */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.headerIconButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t("common.back", { defaultValue: "Back" })}
          >
            <SymbolView
              name={{
                ios: "arrow.left" as any,
                android: "arrow_back" as any,
                web: "arrow_back" as any,
              }}
              size={22}
              tintColor={theme.textPrimary}
            />
          </Pressable>

          <ThemedText style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {t("onboarding.businessType.headerTitle", {
              defaultValue: "Business Type",
            })}
          </ThemedText>

          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <SymbolView
              name={{
                ios: "person.fill" as any,
                android: "person" as any,
                web: "person" as any,
              }}
              size={16}
              tintColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Step Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={[styles.stepPill, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={[styles.stepPillText, { color: theme.textSecondary }]}>
              {t("onboarding.businessType.stepBadge", {
                step: stepNumber,
                total: totalSteps,
                defaultValue: `Step ${stepNumber} of ${totalSteps}`,
              })}
            </ThemedText>
          </View>

          <View style={styles.progressBars}>
            <View style={[styles.bar, { backgroundColor: theme.primary }]} />
            <View style={[styles.bar, styles.barActive, { backgroundColor: theme.primary }]} />
            <View style={[styles.bar, { backgroundColor: theme.border }]} />
          </View>
        </View>

        {/* Page Titles */}
        <View style={styles.titleSection}>
          <ThemedText style={[styles.title, { color: theme.textPrimary }]}>
            {t("onboarding.businessType.title", {
              defaultValue: "What type of shop do you run?",
            })}
          </ThemedText>

          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t("onboarding.businessType.subtitle", {
              defaultValue:
                "Select a preset or define a custom shop activity for your workspace",
            })}
          </ThemedText>
        </View>

        {/* Selection Grid Cards matching Stitch */}
        <View style={styles.cardsContainer}>
          {businessCategories.map((item) => {
            const isSelected = currentType === item.id;

            return (
              <Pressable
                key={item.id}
                style={[
                  styles.typeCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isSelected && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ]}
                onPress={() => setCurrentType(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.backgroundElement },
                    isSelected && { backgroundColor: theme.primaryLight },
                  ]}
                >
                  <SymbolView
                    name={{
                      ios: "storefront" as any,
                      android: item.icon as any,
                      web: item.icon as any,
                    }}
                    size={24}
                    tintColor={
                      isSelected ? theme.primary : theme.textPrimary
                    }
                  />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                      {item.name}
                    </Text>

                    {item.popular && (
                      <View style={[styles.popularBadge, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[styles.popularBadgeText, { color: theme.primary }]}>
                          {t("onboarding.businessType.popular", {
                            defaultValue: "Popular",
                          })}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                </View>

                {/* Radio Circle Indicator */}
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: theme.border, backgroundColor: theme.backgroundElement },
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

        {/* Custom Shop Type Entry Input Field */}
        {currentType === "custom" && (
          <View style={[styles.customInputCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.customInputLabel, { color: theme.textPrimary }]}>
              {t("onboarding.businessType.customInputLabel", {
                defaultValue: "Custom Shop Activity Name *",
              })}
            </Text>
            <View style={[styles.customInputWrapper, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <SymbolView
                name={{
                  ios: "pencil" as any,
                  android: "edit" as any,
                  web: "edit" as any,
                }}
                size={18}
                tintColor={theme.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.customTextInput, { color: theme.textPrimary }]}
                value={customTypeName}
                onChangeText={setCustomTypeName}
                placeholder={t("onboarding.businessType.customPlaceholder", {
                  defaultValue: "e.g., Quincaillerie, Kiosque, Mobile Repair...",
                })}
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        {/* Reassurance Micro Banner */}
        <View style={[styles.microBanner, { backgroundColor: theme.backgroundElement }]}>
          <SymbolView
            name={{
              ios: "info.circle.fill" as any,
              android: "info" as any,
              web: "info" as any,
            }}
            size={18}
            tintColor={theme.primary}
          />

          <Text style={[styles.microBannerText, { color: theme.textSecondary }]}>
            {t("onboarding.businessType.flexibleNote", {
              defaultValue:
                "Don't worry, you can easily change your shop activity or categories in Settings anytime.",
            })}
          </Text>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.continueButton, { backgroundColor: theme.primary }]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.businessType.continue", {
            defaultValue: "Continue",
          })}
        >
          <Text style={styles.continueButtonText}>
            {t("onboarding.businessType.continue", {
              defaultValue: "Continue",
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

        {onBack && (
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
          >
            <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>
              {t("common.back", { defaultValue: "Back" })}
            </Text>
            <Text style={[styles.backSubText, { color: theme.textMuted }]}>• Step {stepNumber}</Text>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    height: 48,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontWeight: "700",
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  progressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  stepPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stepPillText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
  },
  progressBars: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  bar: {
    width: 12,
    height: 6,
    borderRadius: 3,
  },
  barActive: {
    width: 28,
  },
  titleSection: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading1,
  },
  subtitle: {
    ...Typography.body,
    marginTop: 2,
  },
  cardsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    ...Typography.label,
    fontSize: 15,
  },
  popularBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardSub: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  customInputCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: 8,
    ...Shadows.sm,
  },
  customInputLabel: {
    ...Typography.label,
    fontSize: 13,
  },
  customInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  customTextInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 14,
  },
  microBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  microBannerText: {
    flex: 1,
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
  continueButton: {
    height: 48,
    borderRadius: BorderRadius.button,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  continueButtonText: {
    color: "#FFFFFF",
    ...Typography.body,
    fontWeight: "600",
  },
  backButton: {
    height: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  backButtonText: {
    ...Typography.label,
    fontSize: 14,
  },
  backSubText: {
    fontSize: 12,
  },
});
