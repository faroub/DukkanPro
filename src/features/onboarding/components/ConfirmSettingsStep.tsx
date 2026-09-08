import { SymbolView } from "expo-symbols";
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

interface ConfirmSettingsStepProps {
  businessName: string;
  ownerName: string;
  businessType: string;
  currency?: string;
  onConfirm: () => void;
  onEditStep: (stepIndex: number) => void;
  onBack?: () => void;
  stepNumber?: number;
  totalSteps?: number;
}

const CATEGORY_NAMES: Record<string, string> = {
  grocery: "Grocery shop (Alimentation générale)",
  bakery: "Home bakery (Pâtisserie)",
  instagram_seller: "Instagram seller (Vente en ligne)",
  market_vendor: "Market vendor (Marché / Souk)",
  service_seller: "Service seller (Services)",
  other: "Other (Autre activité)",
};

export function ConfirmSettingsStep({
  businessName,
  ownerName,
  businessType,
  currency = "DZD",
  onConfirm,
  onEditStep,
  onBack,
  stepNumber = 3,
  totalSteps = 3,
}: ConfirmSettingsStepProps) {
  const { t } = useTranslation();

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
          <View style={[styles.bar, styles.barActive]} />
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
          {t("onboarding:confirmSettingsStep.title")}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {t("onboarding:confirmSettingsStep.subtitle")}
        </ThemedText>
      </View>

      {/* Central Summary Card */}
      <View style={styles.summaryCard}>
        {/* Row 1: Business Name */}
        <View style={styles.summaryRow}>
          <View style={styles.rowLeft}>
            <View style={styles.rowIcon}>
              <SymbolView
                name={{
                  ios: "storefront.fill" as any,
                  android: "storefront" as any,
                  web: "storefront" as any,
                }}
                size={20}
                tintColor={Colors.light.primary}
              />
            </View>
            <View style={styles.rowText}>
              <ThemedText style={styles.rowLabel}>
                {t("onboarding:confirmSettingsStep.businessNameLabel")}
              </ThemedText>
              <ThemedText style={styles.rowValue} numberOfLines={1}>
                {businessName || "My Store"}
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => onEditStep(1)}
            style={styles.editButton}
            accessibilityLabel={t("onboarding:confirmSettingsStep.editBusinessName")}
          >
            <SymbolView
              name={{
                ios: "pencil" as any,
                android: "edit" as any,
                web: "edit" as any,
              }}
              size={16}
              tintColor={Colors.light.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Row 2: Owner Name */}
        <View style={styles.summaryRow}>
          <View style={styles.rowLeft}>
            <View style={styles.rowIcon}>
              <SymbolView
                name={{
                  ios: "person.fill" as any,
                  android: "person" as any,
                  web: "person" as any,
                }}
                size={20}
                tintColor={Colors.light.primary}
              />
            </View>
            <View style={styles.rowText}>
              <ThemedText style={styles.rowLabel}>
                {t("onboarding:confirmSettingsStep.ownerNameLabel")}
              </ThemedText>
              <ThemedText style={styles.rowValue} numberOfLines={1}>
                {ownerName || businessName}
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => onEditStep(1)}
            style={styles.editButton}
            accessibilityLabel={t("onboarding:confirmSettingsStep.editOwnerName")}
          >
            <SymbolView
              name={{
                ios: "pencil" as any,
                android: "edit" as any,
                web: "edit" as any,
              }}
              size={16}
              tintColor={Colors.light.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Row 3: Business Type */}
        <View style={styles.summaryRow}>
          <View style={styles.rowLeft}>
            <View style={styles.rowIcon}>
              <SymbolView
                name={{
                  ios: "tag.fill" as any,
                  android: "category" as any,
                  web: "category" as any,
                }}
                size={20}
                tintColor={Colors.light.primary}
              />
            </View>
            <View style={styles.rowText}>
              <ThemedText style={styles.rowLabel}>
                {t("onboarding:confirmSettingsStep.businessTypeLabel")}
              </ThemedText>
              <ThemedText style={styles.rowValue} numberOfLines={1}>
                {CATEGORY_NAMES[businessType] || businessType}
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => onEditStep(2)}
            style={styles.editButton}
            accessibilityLabel={t("onboarding:confirmSettingsStep.editBusinessType")}
          >
            <SymbolView
              name={{
                ios: "pencil" as any,
                android: "edit" as any,
                web: "edit" as any,
              }}
              size={16}
              tintColor={Colors.light.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Row 4: Currency */}
        <View style={styles.summaryRow}>
          <View style={styles.rowLeft}>
            <View style={styles.rowIcon}>
              <SymbolView
                name={{
                  ios: "banknote.fill" as any,
                  android: "payments" as any,
                  web: "payments" as any,
                }}
                size={20}
                tintColor={Colors.light.primary}
              />
            </View>
            <View style={styles.rowText}>
              <ThemedText style={styles.rowLabel}>
                {t("onboarding:confirmSettingsStep.currencyLabel")}
              </ThemedText>
              <ThemedText style={styles.rowValue}>
                {currency} (Algerian Dinar)
              </ThemedText>
              <Text style={styles.currencyNote}>
                {t("onboarding:confirmSettingsStep.currencyNote")}
              </Text>
            </View>
          </View>
          <View style={styles.lockedBadge}>
            <SymbolView
              name={{
                ios: "lock.fill" as any,
                android: "lock" as any,
                web: "lock" as any,
              }}
              size={14}
              tintColor={Colors.light.textMuted}
            />
          </View>
        </View>
      </View>

      {/* Soft Informational Note Box */}
      <View style={styles.infoBox}>
        <SymbolView
          name={{
            ios: "info-circle" as any,
            android: "info" as any,
            web: "info" as any,
          }}
          size={16}
          tintColor={Colors.light.textSecondary}
        />
        <ThemedText style={styles.infoText}>
          {t("onboarding:confirmSettingsStep.infoText")}
        </ThemedText>
      </View>

      {/* Store Preview Vignette */}
      <View style={styles.storePreview}>
        <View style={styles.logoPlaceholder}>
          <SymbolView
            name={{
              ios: "storefront" as any,
              android: "storefront" as any,
              web: "storefront" as any,
            }}
            size={32}
            tintColor={Colors.light.primary}
          />
        </View>
        <View style={{ flexDirection: "column", minHeight: 0, marginTop: Spacing.xs }}>
          <ThemedText style={{ ...Typography.caption, color: Colors.light.textPrimary, fontWeight: "600", marginTop: Spacing.xs }}>Ready to launch</ThemedText>
          <ThemedText style={{ ...Typography.body, color: Colors.light.textPrimary, marginTop: Spacing.xs }}>Your digital ledger is prepared</ThemedText>
          <ThemedText style={{ ...Typography.caption, color: Colors.light.textSecondary, marginTop: Spacing.xs }}>Point of Sale, debts & inventory</ThemedText>
        </View>
      </View>

      {/* Action Section */}
      <View style={styles.actionSection}>
        <Pressable
          style={styles.startButton}
          onPress={() => onConfirm()}
          accessible
          accessibilityLabel={t("onboarding:confirmSettingsStep.startButton")}
        >
          <ThemedText style={{ ...Typography.body, color: Colors.light.surface }}>Start using Dukkan OS</ThemedText>
          <SymbolView
            name={{ ios: "arrow_forward" as any, android: "arrow_forward" as any, web: "arrow_forward" as any }}
            size={20}
            tintColor={Colors.light.surface}
          />
        </Pressable>
        <Pressable
          style={styles.backButton}
          onPress={() => { /* handle back */ }}
          accessible
          accessibilityLabel={t("common:back")}
        >
          <SymbolView
            name={{ ios: "arrow_back" as any, android: "arrow_back" as any, web: "arrow_back" as any }}
            size={18}
            tintColor={Colors.light.textSecondary}
          />
          <ThemedText style={{ ...Typography.label, color: Colors.light.textSecondary }}>Back to step 2</ThemedText>
        </Pressable>
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
  summaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    overflow: "hidden",
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  rowValue: {
    ...Typography.moneySmall,
    color: Colors.light.textPrimary,
  },
  currencyNote: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  lockedBadge: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  storePreview: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  actionSection: {
    marginTop: Spacing.lg,
  },
  backButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  startButton: {
    width: "100%",
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primary,
    color: Colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  backButtonText: {
    ...Typography.label,
    color: Colors.light.textSecondary,
  },
});