import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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

interface BusinessTypeStepProps {
  onContinue: (data: { businessType: string }) => void;
  onBack?: () => void;
  selectedType?: string;
  stepNumber?: number;
  totalSteps?: number;
}

const BUSINESS_CATEGORIES = [
  {
    id: "grocery",
    name: "Grocery shop",
    subtitle: "Alimentation générale / البقالة",
    iconIos: "cart.fill",
    iconAndroid: "storefront",
  },
  {
    id: "bakery",
    name: "Home bakery",
    subtitle: "Gâteaux & Pâtisserie maison / حلويات منزلية",
    iconIos: "birthday.cake.fill",
    iconAndroid: "bakery_dining",
  },
  {
    id: "instagram_seller",
    name: "Instagram seller",
    subtitle: "Vente en ligne & Réseaux / متجر إنستغرام",
    iconIos: "camera.fill",
    iconAndroid: "photo_camera",
  },
  {
    id: "market_vendor",
    name: "Market vendor",
    subtitle: "Marché & Vendeur ambulant / بائع في السوق",
    iconIos: "bag.fill",
    iconAndroid: "store",
  },
  {
    id: "service_seller",
    name: "Service seller",
    subtitle: "Prestation de services / خدمات",
    iconIos: "wrench.and.screwdriver.fill",
    iconAndroid: "handyman",
  },
  {
    id: "other",
    name: "Other",
    subtitle: "Autre activité / نشاط آخر",
    iconIos: "ellipsis.circle.fill",
    iconAndroid: "more_horiz",
  },
];

export function BusinessTypeStep({
  onContinue,
  onBack,
  selectedType = "grocery",
  stepNumber = 2,
  totalSteps = 3,
}: BusinessTypeStepProps) {
  const { t } = useTranslation();
  const [currentType, setCurrentType] = useState(selectedType);

  const handleContinue = () => {
    onContinue({ businessType: currentType });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Step Progress Pill */}
      <View style={styles.progressRow}>
        <View style={styles.stepPill}>
          <ThemedText style={styles.stepPillText}>
            Step {stepNumber} of {totalSteps}
          </ThemedText>
        </View>
        <View style={styles.progressBars}>
          <View style={[styles.bar, styles.barActive]} />
          <View style={[styles.bar, styles.barActive]} />
          <View style={styles.bar} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>What type of business?</ThemedText>
        <ThemedText style={styles.subtitle}>
          Choose the category that best matches your daily activity
        </ThemedText>
      </View>

      {/* Categories List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {BUSINESS_CATEGORIES.map((cat) => {
          const isSelected = currentType === cat.id;

          return (
            <Pressable
              key={cat.id}
              onPress={() => setCurrentType(cat.id)}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardSelected,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.iconBubble,
                    isSelected && styles.iconBubbleSelected,
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
                      isSelected ? Colors.light.primary : Colors.light.textSecondary
                    }
                  />
                </View>

                <View style={styles.textContainer}>
                  <ThemedText style={styles.catName}>{cat.name}</ThemedText>
                  <ThemedText style={styles.catSubtitle}>
                    {cat.subtitle}
                  </ThemedText>
                </View>
              </View>

              <View
                style={[
                  styles.checkCircle,
                  isSelected && styles.checkCircleSelected,
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
      </ScrollView>

      {/* CTA Footer */}
      <View style={styles.footer}>
        <PrimaryButton title="Continue" onPress={handleContinue} />
        {onBack && (
          <Pressable onPress={onBack} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>Back / Retour</ThemedText>
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
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  progressRow: {
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
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.border,
  },
  barActive: {
    backgroundColor: Colors.light.primary,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading1,
    color: Colors.light.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  listContent: {
    gap: ComponentDimensions.cardGap,
    paddingBottom: Spacing.md,
  },
  categoryCard: {
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
  categoryCardSelected: {
    backgroundColor: Colors.light.surface,
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
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBubbleSelected: {
    backgroundColor: Colors.light.primaryLight,
  },
  textContainer: {
    flex: 1,
  },
  catName: {
    ...Typography.label,
    color: Colors.light.textPrimary,
  },
  catSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleSelected: {
    backgroundColor: Colors.light.primary,
  },
  footer: {
    marginTop: "auto",
    gap: Spacing.sm,
  },
  backButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    ...Typography.label,
    color: Colors.light.textSecondary,
  },
});
