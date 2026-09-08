import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";

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

export function EmptyDashboardScreen() {
  const { t } = useTranslation();

  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleContinueOnboarding = () => {
    setShowOnboarding(true);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
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
        <ThemedText style={styles.subtitle}>Empty Dashboard</ThemedText>

        <TouchableOpacity
          style={[
            styles.profileButton,
            { backgroundColor: Colors.light.surface },
          ]}
          onPress={handleContinueOnboarding}
        >
          <ThemedText style={styles.profileText}>Profile</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Today's Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <ThemedText style={styles.summaryTitle}>Today's Summary</ThemedText>
          <ThemedText style={styles.summarySubdate}>Just now</ThemedText>
        </View>

        <View style={styles.summaryGrid}>
          {/* Sales */}
          <View style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <SymbolView
                name={{
                  ios: "payments" as any,
                  android: "payments" as any,
                  web: "payments" as any,
                }}
                size={20}
                tintColor={Colors.light.primary}
              />
            </View>
            <View style={styles.summaryValueAndLabel}>
              <ThemedText style={styles.summaryValue}>0</ThemedText>
              <ThemedText style={styles.summaryLabel}>
                {t("dashboard.summary.revenue")}
              </ThemedText>
            </View>
          </View>

          {/* Receipts */}
          <View style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <SymbolView
                name={{
                  ios: "receipt_long" as any,
                  android: "receipt" as any,
                  web: "receipt" as any,
                }}
                size={20}
                tintColor={Colors.light.primary}
              />
            </View>
            <View style={styles.summaryValueAndLabel}>
              <ThemedText style={styles.summaryValue}>0</ThemedText>
              <ThemedText style={styles.summaryLabel}>
                {t("onboarding:confirmSettingsStep.receiptsLabel")}
              </ThemedText>
            </View>
          </View>

          {/* Buyers */}
          <View style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <SymbolView
                name={{
                  ios: "group" as any,
                  android: "people" as any,
                  web: "people" as any,
                }}
                size={20}
                tintColor={Colors.light.primary}
              />
            </View>
            <View style={styles.summaryValueAndLabel}>
              <ThemedText style={styles.summaryValue}>0</ThemedText>
              <ThemedText style={styles.summaryLabel}>
                {t("onboarding:confirmSettingsStep.buyersLabel")}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Empty State Hero Banner */}
      <View style={styles.emptyStateBanner}>
        <View style={styles.emptyStateIcon}>
          <SymbolView
            name={{
              ios: "inventory_2" as any,
              android: "inventory_2" as any,
              web: "inventory_2" as any,
            }}
            size={32}
            tintColor={Colors.light.primary}
          />
        </View>

        <ThemedText style={styles.emptyStateTitle}>
          {t("onboarding:emptyDashboard.startTitle")}
        </ThemedText>

        <ThemedText style={styles.emptyStateSubtitle}>
          {t("onboarding:emptyDashboard.startSubtitle")}
        </ThemedText>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <ThemedText style={styles.quickActionsTitle}>
          {t("onboarding:emptyDashboard.quickActionsTitle")}
        </ThemedText>

        <View style={styles.actionsGrid}>
          {/* New Sale */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: Colors.light.surface },
            ]}
            onPress={() => {}}
          >
            <View style={styles.actionIcon}>
              <SymbolView
                name={{
                  ios: "point_of_sale" as any,
                  android: "point_of_sale" as any,
                  web: "point_of_sale" as any,
                }}
                size={20}
                tintColor={Colors.light.primary}
              />
            </View>
            <ThemedText style={styles.actionLabel}>
              {t("quick:newSale")}
            </ThemedText>
            <ThemedText style={styles.actionSubLabel}>
              {t("onboarding:emptyDashboard.newSaleSub")}
            </ThemedText>
          </TouchableOpacity>

          {/* Add Product */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: Colors.light.surface },
            ]}
            onPress={() => {}}
          >
            <View style={styles.actionIcon}>
              <SymbolView
                name={{
                  ios: "barcode_scanner" as any,
                  android: "barcode_scanner" as any,
                  web: "barcode_scanner" as any,
                }}
                size={20}
                tintColor={Colors.light.primary}
              />
            </View>
            <ThemedText style={styles.actionLabel}>
              {t("quick:addProduct")}
            </ThemedText>
            <ThemedText style={styles.actionSubLabel}>
              {t("onboarding:emptyDashboard.addProductSub")}
            </ThemedText>
          </TouchableOpacity>

          {/* Add Customer */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: Colors.light.surface },
            ]}
            onPress={() => {}}
          >
            <View style={styles.actionIcon}>
              <SymbolView
                name={{
                  ios: "person_add" as any,
                  android: "person_add" as any,
                  web: "person_add" as any,
                }}
                size={20}
                tintColor={Colors.light.primary}
              />
            </View>
            <ThemedText style={styles.actionLabel}>
              {t("quick:addCustomer")}
            </ThemedText>
            <ThemedText style={styles.actionSubLabel}>
              {t("onboarding:emptyDashboard.addCustomerSub")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Onboarding Steps Pill */}
      <View style={styles.onboardingPill}>
        <View style={styles.pillLeft}>
          <SymbolView
            name={{
              ios: "lightbulb" as any,
              android: "lightbulb" as any,
              web: "lightbulb" as any,
            }}
            size={18}
            tintColor={Colors.light.primaryLight}
          />
        </View>

        <View style={styles.pillCenter}>
          <ThemedText style={styles.pillTitle}>
            {t("onboarding:emptyDashboard.gettingStarted")}
          </ThemedText>
          <ThemedText style={styles.pillSubtitle}>
            {t("onboarding:emptyDashboard.step1Of3")}
          </ThemedText>
        </View>

        <SymbolView
          name={{
            ios: "chevron_right" as any,
            android: "chevron_right" as any,
            web: "chevron_right" as any,
          }}
          size={20}
          tintColor={Colors.light.textMuted}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingVertical: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xxl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    ...Typography.heading1,
    color: Colors.light.textPrimary,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.light.textSecondary,
  },
  profileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundElement,
  },
  profileText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    marginBottom: Spacing.xxl,
    padding: ComponentDimensions.cardPadding,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  summarySubdate: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.xs,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    ...Typography.moneyDisplay,
    color: Colors.light.textPrimary,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  emptyStateBanner: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    padding: ComponentDimensions.cardPadding,
    marginBottom: Spacing.xxl,
    flexDirection: "column",
    alignItems: "center",
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  emptyStateSubtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  quickActions: {
    marginBottom: Spacing.xxl,
  },
  quickActionsTitle: {
    ...Typography.label,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionsGrid: {
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  actionButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    ...Typography.label,
    color: Colors.light.textPrimary,
    textAlign: "center",
    marginBottom: 2,
  },
  actionSubLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontSize: 12,
  },
  onboardingPill: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    padding: ComponentDimensions.cardPadding,
    marginTop: Spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pillLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pillCenter: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  pillTitle: {
    ...Typography.body,
    color: Colors.light.textPrimary,
    fontWeight: "600",
  },
  pillSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  summaryValueAndLabel: {
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.xs,
    textAlign: "center",
  },
});