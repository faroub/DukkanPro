import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

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

interface BusinessNameStepProps {
  onContinue: (data: { businessName: string; ownerName: string }) => void;
  onBack?: () => void;
  initialBusinessName?: string;
  initialOwnerName?: string;
  stepNumber?: number;
  totalSteps?: number;
}

export function BusinessNameStep({
  onContinue,
  onBack,
  initialBusinessName = "",
  initialOwnerName = "",
  stepNumber = 1,
  totalSteps = 3,
}: BusinessNameStepProps) {
  const { t } = useTranslation();
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [ownerName, setOwnerName] = useState(initialOwnerName);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (!businessName.trim()) {
      setError("Business name is required");
      return;
    }
    setError(null);
    onContinue({
      businessName: businessName.trim(),
      ownerName: ownerName.trim() || businessName.trim(),
    });
  };

  const previewName = businessName.trim() || "Supérette El-Amel";
  const previewOwner = ownerName.trim()
    ? `Managed by ${ownerName.trim()}`
    : "Managed by owner";

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
          <View style={styles.bar} />
          <View style={styles.bar} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
          accessibilityLabel={t("common:back")}
        >
          <SymbolView
            name={{
              ios: "arrow_back" as any,
              android: "arrow_back" as any,
              web: "arrow_back" as any,
            }}
            size={24}
            tintColor={Colors.light.textSecondary}
          />
        </Pressable>
        <ThemedText style={styles.title}>
          {t("onboarding:businessNameStep.title")}
        </ThemedText>
      </View>

      {/* Visual Accent Tile */}
      <View style={styles.accentTile}>
        <View style={styles.accentIconBox}>
          <SymbolView
            name={{
              ios: "storefront.fill" as any,
              android: "storefront" as any,
              web: "storefront" as any,
            }}
            size={32}
            tintColor={Colors.light.primary}
          />
        </View>
        <View style={styles.accentContent}>
          <ThemedText style={styles.accentTitle} numberOfLines={1}>
            {previewName}
          </ThemedText>
          <ThemedText style={styles.accentSubtitle} numberOfLines={1}>
            {previewOwner}
          </ThemedText>
          <View style={styles.accentBadge}>
            <View style={styles.accentBadgeDot} />
            <ThemedText style={styles.accentBadgeText}>
              {t("onboarding:businessNameStep.previewBadgeText")}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Main Form Card */}
      <View style={styles.mainCard}>
        {/* Field 1: Business Name */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            {t("onboarding:businessNameStep.label")}
          </ThemedText>
          <ThemedText style={styles.requiredBadge}>Required</ThemedText>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <SymbolView
                name={{
                  ios: "cart" as any,
                  android: "shopping_bag" as any,
                  web: "shopping_bag" as any,
                }}
                size={18}
                tintColor={Colors.light.textSecondary}
              />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder={t("onboarding:businessNameStep.placeholder")}
              placeholderTextColor={Colors.light.textMuted}
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Field 2: Owner Name */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Your name</ThemedText>
          <ThemedText style={styles.optionalBadge}>Optional</ThemedText>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <SymbolView
                name={{
                  ios: "person" as any,
                  android: "person" as any,
                  web: "person" as any,
                }}
                size={18}
                tintColor={Colors.light.textSecondary}
              />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder={t("onboarding:businessNameStep.ownerPlaceholder")}
              placeholderTextColor={Colors.light.textMuted}
              value={ownerName}
              onChangeText={setOwnerName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      </View>

      {/* Reassurance Offline Banner */}
      <View style={styles.trustBanner}>
        <SymbolView
          name={{
            ios: "checkmark.shield.fill" as any,
            android: "verified_user" as any,
            web: "verified_user" as any,
          }}
          size={18}
          tintColor={Colors.light.primary}
        />
        <ThemedText style={styles.trustText}>
          {t("onboarding:businessNameStep.trustText")}
        </ThemedText>
      </View>

      {/* CTA Footer */}
      <View style={styles.footer}>
        <PrimaryButton
          title={t("common:primaryButton")}
          disabled={!businessName.trim()}
          onPress={handleContinue}
        />
        {onBack && (
          <Pressable onPress={onBack} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>
              {t("common:back")}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...Typography.heading1,
    color: Colors.light.textPrimary,
  },
  accentTile: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    overflow: "hidden",
  },
  accentIconBox: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  accentContent: {
    flex: 1,
  },
  accentTitle: {
    ...Typography.label,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  accentSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  accentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primaryLight,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  accentBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  accentBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  mainCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    padding: ComponentDimensions.cardPadding,
  },
  fieldGroup: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.light.textPrimary,
  },
  requiredBadge: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  optionalBadge: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    height: 48,
    paddingHorizontal: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.textPrimary,
    paddingVertical: 0,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.light.error,
  },
  trustBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  trustText: {
    flex: 1,
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  footer: {
    marginTop: "auto",
    gap: Spacing.sm,
  },
  backButton2: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    ...Typography.label,
    color: Colors.light.textSecondary,
  },
});