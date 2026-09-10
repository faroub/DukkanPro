import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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

interface BusinessTypeStepProps {
  onContinue: (data: { businessType: string }) => void;
  onBack?: () => void;
  selectedType?: string;
  stepNumber?: number;
  totalSteps?: number;
}

export function BusinessTypeStep({
  onContinue,
  onBack,
  selectedType = "grocery",
  stepNumber = 2,
  totalSteps = 3,
}: BusinessTypeStepProps) {
  const { t } = useTranslation();
  const [currentType, setCurrentType] = useState(selectedType);

  const businessCategories = [
    {
      id: "grocery",
      name: t("onboarding.businessType.grocery", {
        defaultValue: "Grocery shop",
      }),
      subtitle: t("onboarding.businessType.grocerySub", {
        defaultValue: "Alimentation générale / البقالة",
      }),
      iconIos: "cart.fill",
      iconAndroid: "storefront",
    },
    {
      id: "bakery",
      name: t("onboarding.businessType.bakery", {
        defaultValue: "Home bakery",
      }),
      subtitle: t("onboarding.businessType.bakerySub", {
        defaultValue: "Gâteaux & Pâtisserie maison / حلويات منزلية",
      }),
      iconIos: "birthday.cake.fill",
      iconAndroid: "bakery_dining",
    },
    {
      id: "instagram_seller",
      name: t("onboarding.businessType.instagram", {
        defaultValue: "Instagram seller",
      }),
      subtitle: t("onboarding.businessType.instagramSub", {
        defaultValue: "Vente en ligne & Réseaux / متجر إنستغرام",
      }),
      iconIos: "camera.fill",
      iconAndroid: "photo_camera",
    },
    {
      id: "market_vendor",
      name: t("onboarding.businessType.market", {
        defaultValue: "Market vendor",
      }),
      subtitle: t("onboarding.businessType.marketSub", {
        defaultValue: "Marché & Vendeur ambulant / بائع في السوق",
      }),
      iconIos: "bag.fill",
      iconAndroid: "store",
    },
    {
      id: "service_seller",
      name: t("onboarding.businessType.services", {
        defaultValue: "Service seller",
      }),
      subtitle: t("onboarding.businessType.servicesSub", {
        defaultValue: "Prestation de services / خدمات",
      }),
      iconIos: "wrench.and.screwdriver.fill",
      iconAndroid: "handyman",
    },
    {
      id: "other",
      name: t("onboarding.businessType.other", { defaultValue: "Other" }),
      subtitle: t("onboarding.businessType.otherSub", {
        defaultValue: "Autre activité / نشاط آخر",
      }),
      iconIos: "ellipsis.circle.fill",
      iconAndroid: "more_horiz",
    },
  ];

  const handleContinue = () => {
    onContinue({ businessType: currentType });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
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
              tintColor={Colors.light.textPrimary}
            />
          </Pressable>

          <ThemedText style={styles.headerTitle}>
            {t("onboarding.businessType.headerTitle", {
              defaultValue: "Business Type",
            })}
          </ThemedText>

          <View style={styles.avatarCircle}>
            <SymbolView
              name={{
                ios: "person.fill" as any,
                android: "person" as any,
                web: "person" as any,
              }}
              size={16}
              tintColor={Colors.light.surface}
            />
          </View>
        </View>

        {/* Step Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.stepPill}>
            <ThemedText style={styles.stepPillText}>
              {t("onboarding.businessType.stepBadge", {
                step: stepNumber,
                total: totalSteps,
                defaultValue: `Step ${stepNumber} of ${totalSteps}`,
              })}
            </ThemedText>
          </View>

          <View style={styles.progressBars}>
            <View style={[styles.bar, styles.barActive]} />
            <View style={[styles.bar, styles.barActive]} />
            <View style={styles.bar} />
          </View>
        </View>

        {/* Page Titles */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>
            {t("onboarding.businessType.title", {
              defaultValue: "What type of business?",
            })}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("onboarding.businessType.subtitle", {
              defaultValue:
                "Choose the category that best matches your daily activity",
            })}
          </ThemedText>
        </View>

        {/* 6 Category Cards matching Stitch */}
        <View style={styles.cardsGrid}>
          {businessCategories.map((cat) => {
            const isSelected = currentType === cat.id;

            return (
              <Pressable
                key={cat.id}
                onPress={() => setCurrentType(cat.id)}
                style={[
                  styles.categoryCard,
                  isSelected
                    ? styles.categoryCardSelected
                    : styles.categoryCardUnselected,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.iconBubble,
                      isSelected
                        ? styles.iconBubbleSelected
                        : styles.iconBubbleUnselected,
                    ]}
                  >
                    <SymbolView
                      name={{
                        ios: cat.iconIos as any,
                        android: cat.iconAndroid as any,
                        web: cat.iconAndroid as any,
                      }}
                      size={22}
                      tintColor={
                        isSelected
                          ? Colors.light.primary
                          : Colors.light.textSecondary
                      }
                    />
                  </View>

                  <View style={styles.textContainer}>
                    <ThemedText
                      style={[
                        styles.catName,
                        isSelected && styles.catNameSelected,
                      ]}
                    >
                      {cat.name}
                    </ThemedText>
                    <ThemedText style={styles.catSubtitle}>
                      {cat.subtitle}
                    </ThemedText>
                  </View>
                </View>

                {/* Right Selection Circle */}
                <View
                  style={[
                    styles.checkCircle,
                    isSelected
                      ? styles.checkCircleSelected
                      : styles.checkCircleUnselected,
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

        {/* Helper Note matching Stitch */}
        <View style={styles.helperMessage}>
          <SymbolView
            name={{
              ios: "info-circle" as any,
              android: "info" as any,
              web: "info" as any,
            }}
            size={18}
            tintColor={Colors.light.primary}
          />
          <ThemedText style={styles.helperText}>
            {t("onboarding.businessType.helperText", {
              defaultValue:
                "You can change your category or add custom products anytime in Settings.",
            })}
          </ThemedText>
        </View>
      </ScrollView>

      {/* CTA Footer matching Stitch */}
      <View style={styles.footer}>
        <Pressable
          style={styles.continueButton}
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
            tintColor={Colors.light.surface}
          />
        </Pressable>

        {onBack && (
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
          >
            <SymbolView
              name={{
                ios: "arrow.left" as any,
                android: "arrow_back" as any,
                web: "arrow_back" as any,
              }}
              size={16}
              tintColor={Colors.light.textSecondary}
            />
            <ThemedText style={styles.backButtonText}>
              {t("onboarding.businessType.back", { defaultValue: "Back" })}
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    color: Colors.light.textPrimary,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
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
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stepPillText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.border,
  },
  barActive: {
    width: 28,
    backgroundColor: Colors.light.primary,
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading1,
    color: Colors.light.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  cardsGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    minHeight: 70,
  },
  categoryCardUnselected: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryCardSelected: {
    backgroundColor: "#F4FAF6",
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBubbleUnselected: {
    backgroundColor: Colors.light.backgroundElement,
  },
  iconBubbleSelected: {
    backgroundColor: Colors.light.primaryLight,
  },
  textContainer: {
    flex: 1,
  },
  catName: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  catNameSelected: {
    color: Colors.light.primaryDark,
    fontWeight: "700",
  },
  catSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleUnselected: {
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  checkCircleSelected: {
    backgroundColor: Colors.light.primary,
  },
  helperMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  helperText: {
    flex: 1,
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
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
    color: Colors.light.textSecondary,
  },
});
