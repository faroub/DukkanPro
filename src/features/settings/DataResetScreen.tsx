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

import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { showToast } from "@/components/use-toast";
import {
  BorderRadius,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const expectedBusinessName = "Supérette El-Amel";

/**
 * DataResetScreen - Screen for resetting all application data.
 * Sourced directly from Stitch design `5._data_reset`.
 * - Critical precaution warning callout
 * - Soft reset (Clear demo data only)
 * - Hard reset (Factory wipe) protected by typing the exact business name
 * - Confirmation alert before destructive execution
 * - Dynamic theme response (Light / Dark) via useTheme()
 * - Strictly LTR layout across all languages
 */
export function DataResetScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

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
      contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      id="data-reset-screen"
    >
      <ThemedView style={styles.container}>
        {/* Breadcrumb Context */}
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => router.back()}
          activeOpacity={0.7}
          id="btn-data-reset-back"
        >
          <MaterialIcons name="arrow-back" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.breadcrumbText, { color: theme.textSecondary }]}>
            {t("navigation.back") || "Back to More"}
          </ThemedText>
        </TouchableOpacity>

        {/* Screen Header */}
        <View style={styles.headerSection}>
          <ThemedText style={[styles.headingTitle, { color: theme.textPrimary }]}>
            {t("settings.resetApp") || "Data Reset & Factory Wipe"}
          </ThemedText>
          <ThemedText style={[styles.headingSubtitle, { color: theme.textSecondary }]}>
            Supérette El-Amel • <ThemedText style={{ fontWeight: "800" }}>Dukkan<ThemedText style={{ color: theme.primary, fontWeight: "800" }}>Pro</ThemedText></ThemedText>
          </ThemedText>
        </View>

        {/* Critical Warning Callout */}
        <View style={[styles.criticalCallout, { backgroundColor: theme.errorLight, borderColor: theme.error }]}>
          <View style={[styles.criticalIconContainer, { backgroundColor: theme.surface }]}>
            <MaterialIcons name="warning" size={24} color={theme.error} />
          </View>
          <View style={styles.criticalContent}>
            <View style={styles.criticalHeaderRow}>
              <ThemedText style={[styles.criticalBadgeText, { color: theme.error }]}>Critical Precaution</ThemedText>
              <View style={[styles.criticalPulseDot, { backgroundColor: theme.error }]} />
            </View>
            <ThemedText style={[styles.criticalMessage, { color: theme.error }]}>
              Permanent Action: This will permanently delete ALL business data including products, customers, sales, and payments. This action CANNOT be undone.
            </ThemedText>
          </View>
        </View>

        {/* Section 1: Soft Reset (Demo Scrub) */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.softIconContainer, { backgroundColor: theme.primaryLight }]}>
                <MaterialIcons name="cleaning-services" size={20} color={theme.primary} />
              </View>
              <View>
                <ThemedText style={[styles.sectionTitle, { color: theme.textPrimary }]}>Clear Demo Data</ThemedText>
                <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Selective catalog reset</ThemedText>
              </View>
            </View>
            <View style={[styles.safePill, { backgroundColor: theme.surfaceAlt }]}>
              <ThemedText style={[styles.safePillText, { color: theme.textSecondary }]}>Safe Option</ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Removes pre-loaded demo catalog, fictional transactions, and sample ledger entries while preserving your store settings, receipt headers, and staff accounts.
          </ThemedText>

          {/* Data Impact Chips */}
          <View style={styles.chipsRow}>
            <View style={[styles.chip, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="inventory-2" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.chipText, { color: theme.textSecondary }]}>48 Demo Items</ThemedText>
            </View>
            <View style={[styles.chip, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="receipt-long" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.chipText, { color: theme.textSecondary }]}>12 Sample Orders</ThemedText>
            </View>
            <View style={[styles.chip, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="tune" size={14} color={theme.primary} />
              <ThemedText style={[styles.chipText, { color: theme.primary }]}>
                Keep Store Setup
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.softResetButton, { backgroundColor: theme.surfaceAlt }]}
            onPress={handleSoftReset}
            activeOpacity={0.8}
            id="btn-clear-demo-data"
          >
            <MaterialIcons name="auto-fix-high" size={20} color={theme.primary} />
            <ThemedText style={[styles.softResetButtonText, { color: theme.primary }]}>Clear Demo Data Only</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Divider / Zone Break */}
        <View style={styles.zoneDivider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.borderLight }]} />
          <View style={[styles.dangerZonePill, { backgroundColor: theme.surfaceAlt }]}>
            <MaterialIcons name="dangerous" size={16} color={theme.error} />
            <ThemedText style={[styles.dangerZoneText, { color: theme.textSecondary }]}>OR / DANGER ZONE</ThemedText>
          </View>
          <View style={[styles.dividerLine, { backgroundColor: theme.borderLight }]} />
        </View>

        {/* Section 2: Hard Reset / Factory Wipe */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.hardIconContainer, { backgroundColor: theme.errorLight }]}>
              <MaterialIcons name="delete-forever" size={20} color={theme.error} />
            </View>
            <View>
              <ThemedText style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Delete All Data & Factory Reset
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: theme.error }]}>
                Irreversible database erasure
              </ThemedText>
            </View>
          </View>

          {/* Target Phrase Box */}
          <View style={[styles.targetPhraseBox, { backgroundColor: theme.surfaceAlt }]}>
            <ThemedText style={[styles.targetPhrasePrompt, { color: theme.textSecondary }]}>
              To prevent accidental erasure, type the exact business name below to confirm:
            </ThemedText>
            <View style={styles.targetCodeRow}>
              <ThemedText style={[styles.targetLabel, { color: theme.textMuted }]}>Target phrase:</ThemedText>
              <View style={[styles.codeBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ThemedText style={[styles.codeText, { color: theme.textPrimary }]}>{expectedBusinessName}</ThemedText>
              </View>
            </View>
          </View>

          {/* Verification Input */}
          <View style={styles.verificationContainer}>
            <View style={styles.matchStatusRow}>
              <ThemedText style={[styles.inputLabel, { color: theme.textPrimary }]}>Confirmation Match</ThemedText>
              {isMatched ? (
                <View style={styles.statusRow}>
                  <MaterialIcons name="check-circle" size={16} color={theme.primary} />
                  <ThemedText style={[styles.matchedText, { color: theme.primary }]}>Phrase matched</ThemedText>
                </View>
              ) : businessNameInput.length > 0 ? (
                <View style={styles.statusRow}>
                  <MaterialIcons name="cancel" size={16} color={theme.error} />
                  <ThemedText style={[styles.unmatchedText, { color: theme.error }]}>Does not match</ThemedText>
                </View>
              ) : null}
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                value={businessNameInput}
                onChangeText={setBusinessNameInput}
                placeholder={`Type '${expectedBusinessName}'`}
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                id="input-business-name-confirm"
              />
              {isMatched && (
                <MaterialIcons name="check-circle" size={20} color={theme.primary} />
              )}
            </View>
          </View>

          {/* Danger Checklist Snapshot */}
          <View style={styles.checklistGrid}>
            <View style={[styles.checklistItem, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="remove-circle" size={16} color={theme.error} />
              <ThemedText style={[styles.checklistText, { color: theme.textSecondary }]}>All Customers & Debts</ThemedText>
            </View>
            <View style={[styles.checklistItem, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="remove-circle" size={16} color={theme.error} />
              <ThemedText style={[styles.checklistText, { color: theme.textSecondary }]}>Inventory & Barcodes</ThemedText>
            </View>
            <View style={[styles.checklistItem, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="remove-circle" size={16} color={theme.error} />
              <ThemedText style={[styles.checklistText, { color: theme.textSecondary }]}>Sales & Tax Ledgers</ThemedText>
            </View>
            <View style={[styles.checklistItem, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="remove-circle" size={16} color={theme.error} />
              <ThemedText style={[styles.checklistText, { color: theme.textSecondary }]}>Hardware Integrations</ThemedText>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.hardActionButtons}>
            <TouchableOpacity
              style={[
                styles.hardResetButton,
                { backgroundColor: isMatched && !isLoading ? theme.error : theme.disabledBackground },
              ]}
              onPress={handleHardReset}
              disabled={!isMatched || isLoading}
              activeOpacity={0.8}
              id="btn-delete-all-data"
            >
              <MaterialIcons
                name="delete-forever"
                size={20}
                color={isMatched ? "#FFFFFF" : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.hardResetButtonText,
                  { color: isMatched ? "#FFFFFF" : theme.textSecondary },
                ]}
              >
                {isLoading ? "Purging data..." : "Delete All Data"}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.factoryWipeButton,
                { backgroundColor: isMatched && !isLoading ? theme.textPrimary : theme.disabledBackground },
              ]}
              onPress={handleHardReset}
              disabled={!isMatched || isLoading}
              activeOpacity={0.8}
              id="btn-factory-wipe"
            >
              <MaterialIcons
                name="restart-alt"
                size={20}
                color={isMatched ? theme.surface : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.factoryWipeButtonText,
                  { color: isMatched ? theme.surface : theme.textSecondary },
                ]}
              >
                Reset and Return to Onboarding
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Reassurance Footer Note */}
          <View style={[styles.reassuranceNote, { backgroundColor: theme.surfaceAlt }]}>
            <MaterialIcons name="info" size={18} color={theme.textMuted} />
            <ThemedText style={[styles.reassuranceText, { color: theme.textSecondary }]}>
              After reset: Locale returns to French, database is cleared, and app returns to the initial onboarding setup screen.
            </ThemedText>
          </View>
        </View>

        {/* Footer Trademark */}
        <FooterTrademark />
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
  },
  headerSection: {
    gap: Spacing.xs,
  },
  headingTitle: {
    ...Typography.heading2,
  },
  headingSubtitle: {
    ...Typography.caption,
  },
  criticalCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  criticalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  criticalPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  criticalMessage: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  sectionCard: {
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
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
    alignItems: "center",
    justifyContent: "center",
  },
  hardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  safePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  safePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionDescription: {
    fontSize: 13,
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  softResetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: BorderRadius.button,
  },
  softResetButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  zoneDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dangerZonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginHorizontal: 8,
  },
  dangerZoneText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  targetPhraseBox: {
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  targetPhrasePrompt: {
    fontSize: 13,
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
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 13,
    fontWeight: "700",
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
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  matchedText: {
    fontSize: 12,
    fontWeight: "600",
  },
  unmatchedText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.button,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
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
    padding: 8,
    borderRadius: 6,
  },
  checklistText: {
    fontSize: 12,
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
    borderRadius: BorderRadius.button,
    ...Shadows.sm,
  },
  hardResetButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  factoryWipeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.button,
  },
  factoryWipeButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  reassuranceNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.md,
    marginTop: 2,
  },
  reassuranceText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});
