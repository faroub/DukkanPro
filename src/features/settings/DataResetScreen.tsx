import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { showToast } from "@/components/use-toast";
import {
  BorderRadius,
  Colors,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";

const expectedBusinessName = "Supérette El-Amel";

/**
 * DataResetScreen - Screen for resetting all application data.
 * Sourced directly from Stitch design `5._data_reset`.
 * - Critical precaution warning callout
 * - Soft reset (Clear demo data only)
 * - Hard reset (Factory wipe) protected by typing the exact business name
 * - Confirmation alert before destructive execution
 * - Strictly LTR layout across all languages
 */
export function DataResetScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [businessNameInput, setBusinessNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isMatched = businessNameInput.trim() === expectedBusinessName;

  const handleSoftReset = useCallback(() => {
    Alert.alert(
      "Clear Demo Data",
      "This will remove the 48 sample items and 12 demo sales, while keeping your business profile and settings intact.",
      [
        { text: t("common.cancel") || "Cancel", style: "cancel" },
        {
          text: "Clear Demo Data",
          onPress: () => {
            showToast("Demo data cleared successfully! / Données démo effacées");
          },
        },
      ]
    );
  }, [t]);

  const handleHardReset = useCallback(() => {
    if (businessNameInput.trim() !== expectedBusinessName) {
      showToast("Veuillez saisir le nom exact du commerce pour confirmer");
      return;
    }

    Alert.alert(
      "Final Verification / Confirmation Définitive",
      "Supérette El-Amel will be completely purged from this terminal. All sales, customers, debt balances, and inventory will be permanently deleted. This action CANNOT be undone.",
      [
        { text: t("common.cancel") || "Cancel", style: "cancel" },
        {
          text: "Delete All Data",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              showToast("Database wiped. Returning to onboarding...");
              setTimeout(() => {
                setIsLoading(false);
                router.replace("/onboarding" as any);
              }, 600);
            } catch (error) {
              console.error("Data reset error:", error);
              setIsLoading(false);
              showToast("Error during data reset");
            }
          },
        },
      ]
    );
  }, [businessNameInput, router, t]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView style={styles.container}>
        {/* Breadcrumb Context */}
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={18} color={Colors.light.textSecondary} />
          <ThemedText style={styles.breadcrumbText}>
            {t("navigation.back") || "Back to More"}
          </ThemedText>
        </TouchableOpacity>

        {/* Screen Header */}
        <View style={styles.headerSection}>
          <ThemedText style={styles.headingTitle}>
            {t("settings.resetApp") || "Data Reset & Factory Wipe"}
          </ThemedText>
          <ThemedText style={styles.headingSubtitle}>
            Supérette El-Amel • Dukkan OS
          </ThemedText>
        </View>

        {/* Critical Warning Callout */}
        <View style={styles.criticalCallout}>
          <View style={styles.criticalIconContainer}>
            <MaterialIcons name="warning" size={24} color={Colors.light.error} />
          </View>
          <View style={styles.criticalContent}>
            <View style={styles.criticalHeaderRow}>
              <ThemedText style={styles.criticalBadgeText}>Critical Precaution</ThemedText>
              <View style={styles.criticalPulseDot} />
            </View>
            <ThemedText style={styles.criticalMessage}>
              Permanent Action: This will permanently delete ALL business data including products, customers, sales, and payments. This action CANNOT be undone.
            </ThemedText>
          </View>
        </View>

        {/* Section 1: Soft Reset (Demo Scrub) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.softIconContainer}>
                <MaterialIcons name="cleaning-services" size={20} color={Colors.light.primary} />
              </View>
              <View>
                <ThemedText style={styles.sectionTitle}>Clear Demo Data</ThemedText>
                <ThemedText style={styles.sectionSubtitle}>Selective catalog reset</ThemedText>
              </View>
            </View>
            <View style={styles.safePill}>
              <ThemedText style={styles.safePillText}>Safe Option</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.sectionDescription}>
            Removes pre-loaded demo catalog, fictional transactions, and sample ledger entries while preserving your store settings, receipt headers, and staff accounts.
          </ThemedText>

          {/* Data Impact Chips */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <MaterialIcons name="inventory-2" size={14} color={Colors.light.textSecondary} />
              <ThemedText style={styles.chipText}>48 Demo Items</ThemedText>
            </View>
            <View style={styles.chip}>
              <MaterialIcons name="receipt-long" size={14} color={Colors.light.textSecondary} />
              <ThemedText style={styles.chipText}>12 Sample Orders</ThemedText>
            </View>
            <View style={styles.chip}>
              <MaterialIcons name="tune" size={14} color={Colors.light.primary} />
              <ThemedText style={[styles.chipText, { color: Colors.light.primary }]}>
                Keep Store Setup
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            style={styles.softResetButton}
            onPress={handleSoftReset}
            activeOpacity={0.8}
          >
            <MaterialIcons name="auto-fix-high" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.softResetButtonText}>Clear Demo Data Only</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Divider / Zone Break */}
        <View style={styles.zoneDivider}>
          <View style={styles.dividerLine} />
          <View style={styles.dangerZonePill}>
            <MaterialIcons name="dangerous" size={16} color={Colors.light.error} />
            <ThemedText style={styles.dangerZoneText}>OR / DANGER ZONE</ThemedText>
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* Section 2: Hard Reset / Factory Wipe */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.hardIconContainer}>
              <MaterialIcons name="delete-forever" size={20} color={Colors.light.error} />
            </View>
            <View>
              <ThemedText style={styles.sectionTitle}>
                Delete All Data & Factory Reset
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: Colors.light.error }]}>
                Irreversible database erasure
              </ThemedText>
            </View>
          </View>

          {/* Target Phrase Box */}
          <View style={styles.targetPhraseBox}>
            <ThemedText style={styles.targetPhrasePrompt}>
              To prevent accidental erasure, type the exact business name below to confirm:
            </ThemedText>
            <View style={styles.targetCodeRow}>
              <ThemedText style={styles.targetLabel}>Target phrase:</ThemedText>
              <View style={styles.codeBadge}>
                <ThemedText style={styles.codeText}>{expectedBusinessName}</ThemedText>
              </View>
            </View>
          </View>

          {/* Verification Input */}
          <View style={styles.verificationContainer}>
            <View style={styles.matchStatusRow}>
              <ThemedText style={styles.inputLabel}>Confirmation Match</ThemedText>
              {isMatched ? (
                <View style={styles.statusRow}>
                  <MaterialIcons name="check-circle" size={16} color={Colors.light.primary} />
                  <ThemedText style={styles.matchedText}>Phrase matched</ThemedText>
                </View>
              ) : businessNameInput.length > 0 ? (
                <View style={styles.statusRow}>
                  <MaterialIcons name="cancel" size={16} color={Colors.light.error} />
                  <ThemedText style={styles.unmatchedText}>Does not match</ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={businessNameInput}
                onChangeText={setBusinessNameInput}
                placeholder={`Type '${expectedBusinessName}'`}
                placeholderTextColor={Colors.light.textMuted}
                autoCapitalize="none"
              />
              {isMatched && (
                <MaterialIcons name="check-circle" size={20} color={Colors.light.primary} />
              )}
            </View>
          </View>

          {/* Danger Checklist Snapshot */}
          <View style={styles.checklistGrid}>
            <View style={styles.checklistItem}>
              <MaterialIcons name="remove-circle" size={16} color={Colors.light.error} />
              <ThemedText style={styles.checklistText}>All Customers & Debts</ThemedText>
            </View>
            <View style={styles.checklistItem}>
              <MaterialIcons name="remove-circle" size={16} color={Colors.light.error} />
              <ThemedText style={styles.checklistText}>Inventory & Barcodes</ThemedText>
            </View>
            <View style={styles.checklistItem}>
              <MaterialIcons name="remove-circle" size={16} color={Colors.light.error} />
              <ThemedText style={styles.checklistText}>Sales & Tax Ledgers</ThemedText>
            </View>
            <View style={styles.checklistItem}>
              <MaterialIcons name="remove-circle" size={16} color={Colors.light.error} />
              <ThemedText style={styles.checklistText}>Hardware Integrations</ThemedText>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.hardActionButtons}>
            <TouchableOpacity
              style={[
                styles.hardResetButton,
                (!isMatched || isLoading) && styles.hardResetButtonDisabled,
              ]}
              onPress={handleHardReset}
              disabled={!isMatched || isLoading}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="delete-forever"
                size={20}
                color={isMatched ? "#FFFFFF" : Colors.light.textSecondary}
              />
              <ThemedText
                style={[
                  styles.hardResetButtonText,
                  !isMatched && styles.hardResetButtonTextDisabled,
                ]}
              >
                {isLoading ? "Purging data..." : "Delete All Data"}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.factoryWipeButton,
                (!isMatched || isLoading) && styles.factoryWipeButtonDisabled,
              ]}
              onPress={handleHardReset}
              disabled={!isMatched || isLoading}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="restart-alt"
                size={20}
                color={isMatched ? "#FFFFFF" : Colors.light.textSecondary}
              />
              <ThemedText
                style={[
                  styles.factoryWipeButtonText,
                  !isMatched && styles.factoryWipeButtonTextDisabled,
                ]}
              >
                Reset and Return to Onboarding
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Reassurance Footer Note */}
          <View style={styles.reassuranceNote}>
            <MaterialIcons name="info" size={18} color={Colors.light.textMuted} />
            <ThemedText style={styles.reassuranceText}>
              After reset: Locale returns to French, database is cleared, and app returns to the initial onboarding setup screen.
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.light.background,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "transparent",
    gap: Spacing.md,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    alignSelf: "flex-start",
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  headerSection: {
    gap: Spacing.xs,
  },
  headingTitle: {
    ...Typography.heading2,
    color: Colors.light.textPrimary,
  },
  headingSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  criticalCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.light.errorLight,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  criticalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  criticalContent: {
    flex: 1,
  },
  criticalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  criticalBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.error,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  criticalPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.error,
  },
  criticalMessage: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.error,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: Colors.light.surface,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  softIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  hardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  safePill: {
    backgroundColor: Colors.light.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  safePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  sectionDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  softResetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.button,
  },
  softResetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  zoneDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.borderLight,
  },
  dangerZonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.full,
    marginHorizontal: 8,
  },
  dangerZoneText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
  },
  targetPhraseBox: {
    backgroundColor: Colors.light.surfaceAlt,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  targetPhrasePrompt: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  targetCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  targetLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  codeBadge: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  codeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  verificationContainer: {
    gap: 6,
  },
  matchStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  matchedText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  unmatchedText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.error,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.button,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  checklistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  checklistItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.surfaceAlt,
    padding: 8,
    borderRadius: 6,
  },
  checklistText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  hardActionButtons: {
    gap: 10,
    marginTop: 4,
  },
  hardResetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    backgroundColor: Colors.light.error,
    borderRadius: BorderRadius.button,
    ...Shadows.sm,
  },
  hardResetButtonDisabled: {
    backgroundColor: Colors.light.disabledBackground,
    shadowOpacity: 0,
  },
  hardResetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  hardResetButtonTextDisabled: {
    color: Colors.light.textSecondary,
  },
  factoryWipeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    backgroundColor: Colors.light.textPrimary,
    borderRadius: BorderRadius.button,
  },
  factoryWipeButtonDisabled: {
    backgroundColor: Colors.light.disabledBackground,
  },
  factoryWipeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  factoryWipeButtonTextDisabled: {
    color: Colors.light.textSecondary,
  },
  reassuranceNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.light.surfaceAlt,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.md,
    marginTop: 2,
  },
  reassuranceText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
});
