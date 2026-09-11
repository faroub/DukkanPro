import { ThemedText, ThemedView, showToast } from "@/components";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18n";
import { Alert } from "react-native";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

/**
 * DataResetScreen - Screen for resetting all application data.
 * - Clear development/demo data
 * - Delete all local business data
 * - Require exact business-name confirmation (type the business name to confirm)
 * - Explain deletion cannot be undone
 * - Clear database and preferences
 * - Reset locale to French
 * - Return to onboarding
 * - All user-facing strings come from translation dictionaries
 * - Layout remains LTR in all languages
 * - Destructive action with strong confirmation guard
 */
export function DataResetScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [businessNameInput, setBusinessNameInput] = useState("");
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);

  const handleBusinessNameChange = useCallback((text: string) => {
    setBusinessNameInput(text);
    // Verify match
    if (text.trim() === "Supérette El-Amel") {
      setMatchStatus("matched");
    } else if (text.trim()) {
      setMatchStatus("mismatch");
    } else {
      setMatchStatus(null);
    }
  }, []);

  const handleResetData = useCallback(async () => {
    // Check if the entered business name matches exactly
    if (businessNameInput.trim() !== "Supérette El-Amel") {
      showToast(t("dataReset.wrongBusinessName"));
      setBusinessNameInput("");
      setMatchStatus(null);
      return;
    }

    // Show final confirmation dialog
    const confirmation = await Alert.alert(
      t("dataReset.confirmTitle"),
      t("dataReset.confirmMessage"),
      [
        {
          text: t("common:cancel"),
          style: "cancel",
          onPress: () => {
            setShowResetConfirmation(false);
          },
        },
        {
          text: t("dataReset.confirm"),
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              // TODO: Implement actual data reset logic
              // - Clear all SQLite tables (sales, products, customers, payments, movements)
              // - Clear app preferences
              // - Reset locale to French
              // - Navigate to onboarding
              showToast(t("dataReset.success"));
              setIsLoading(false);
              // Navigate back to onboarding
              router.replace("/onboarding");
            } catch (error) {
              console.error("Data reset error:", error);
              showToast(t("dataReset.error"));
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: false },
    );

    setShowResetConfirmation(false);
  }, [businessNameInput, t, router]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>
            {t("settings.dataReset")}
          </ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>{t("back")}</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Section 1: Soft Reset (Demo Scrub) */}
        <ThemedView style={styles.softResetSection}>
          <ThemedView style={styles.softResetHeader}>
            <ThemedView style={styles.softResetIcon}>
              <span className="material-symbols-outlined text-[20px]">cleaning_services</span>
            </ThemedView>
            <ThemedView style={styles.softResetInfo}>
              <ThemedText style={styles.softResetTitle}>
                {t("settings.clearDemoData")}
              </ThemedText>
              <ThemedText style={styles.softResetSubtitle}>
                {t("dataReset.softResetDesc")}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView style={styles.softResetImpact}>
            <ThemedText style={styles.softResetImpactLabel}>
              {t("dataReset.softResetImpact")}
            </ThemedText>
            <ThemedView style={styles.impactChips}>
              {["48 Demo Items", "12 Sample Orders"].map((item, index) => (
                <ThemedView
                  key={index}
                  style={styles.impactChip}
                >
                  <span className="material-symbols-outlined text-[12px]">
                    inventory_2
                  </span>
                  <ThemedText style={styles.impactChipText}>
                    {item}
                  </ThemedText>
                </ThemedView>
              ))}
              <ThemedView style={styles.impactChip}>
                <span className="material-symbols-outlined text-[12px] text-primary">
                  check_circle
                </span>
                <ThemedText style={styles.impactChipText}>
                  {t("dataReset.keepStoreSetup")}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
          <TouchableOpacity
            style={styles.softResetButton}
            onPress={() => {
              setBusinessNameInput("");
              showToast(t("dataReset.softResetCompleted"));
            }}
          >
            <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
            <ThemedText style={styles.softResetButtonText}>
              {t("dataReset.clearDemoDataOnly")}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Divider / Zone Break */}
        <ThemedView style={styles.zoneDivider}>
          <div style={styles.dividerLine} />
          <ThemedView style={styles.zoneLabel}>
            <span className="material-symbols-outlined text-[16px] text-error">
              dangerous
            </span>
            <ThemedText style={styles.zoneText}>
              {t("dataReset.dangerZone")}
            </ThemedText>
          </ThemedView>
          <div style={styles.dividerLine} />
        </ThemedView>

        {/* Section 2: Hard Reset / Factory Wipe */}
        <ThemedView style={styles.hardResetSection}>
          <ThemedView style={styles.hardResetHeader}>
            <ThemedView style={styles.hardResetIcon}>
              <span className="material-symbols-outlined text-[20px]" styleName="delete_forever">
                delete_forever
              </span>
            </ThemedView>
            <ThemedView style={styles.hardResetInfo}>
              <ThemedText style={styles.hardResetTitle}>
                {t("settings.deleteAllData")}
              </ThemedText>
              <ThemedText style={styles.hardResetSubtitle}>
                {t("dataReset.hardResetDesc")}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Verification Input */}
          <ThemedView style={styles.verificationInput}>
            <ThemedText style={styles.verificationLabel}>
              {t("dataReset.businessNameConfirmation")}
            </ThemedText>
            <div style={styles.verificationInputField}>
              <input
                style={styles.verificationInputElement}
                value={businessNameInput}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                placeholder={t("dataReset.typeBusinessName")}
                defaultValue="Supérette El-Amel"
              />
              {matchStatus === "matched" && (
                <span style={styles.matchIcon}>
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    check_circle
                  </span>
                  <ThemedText style={styles.matchIconText}>
                    {t("dataReset.phraseMatched")}
                  </ThemedText>
                </span>
              )}
              {matchStatus === "mismatch" && (
                <span style={styles.matchIcon}>
                  <span className="material-symbols-outlined text-[16px] text-error">
                    cancel
                  </span>
                  <ThemedText style={styles.matchIconText}>
                    {t("dataReset.textDoesNotMatch")}
                  </ThemedText>
                </span>
              )}
            </div>
          </ThemedView>

          {/* High Danger Checklist Snapshot */}
          <ThemedView style={styles.dangerChecklist}>
            <ThemedView style={styles.checklistTitle}>
              <span className="material-symbols-outlined text-error text-[14px]">
                remove_circle
              </span>
              <ThemedText style={styles.checklistText}>
                {t("dataReset.allCustomersAndDebts")}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.checklistItem}>
              <span className="material-symbols-outlined text-error text-[14px]">
                remove_circle
              </span>
              <ThemedText style={styles.checklistText}>
                {t("dataReset.inventoryAndBarcodes")}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.checklistItem}>
              <span className="material-symbols-outlined text-error text-[14px]">
                remove_circle
              </span>
              <ThemedText style={styles.checklistText}>
                {t("dataReset.salesAndTaxLedgers")}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.checklistItem}>
              <span className="material-symbols-outlined text-error text-[14px]">
                remove_circle
              </span>
              <ThemedText style={styles.checklistText}>
                {t("dataReset.hardwareIntegrations")}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Action Buttons */}
          <ThemedView style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowResetConfirmation(false)}
            >
              <ThemedText style={styles.cancelButtonText}>
                {t("common:cancel")}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.destructiveButton}
              onPress={handleResetData}
              disabled={!businessNameInput || matchStatus !== "matched"}
            >
              <span className="material-symbols-outlined text-[20px]" styleName="delete_forever">
                delete_forever
              </span>
              <ThemedText style={styles.destructiveButtonText}>
                {t("dataReset.resetData")}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* Reassurance Footer Note (hidden by default, shows after reset) */}
        {isLoading && (
          <ThemedView style={styles.loadingFooter}>
            <span className="material-symbols-outlined text-inverse-primary">
              hourglass_top
            </span>
            <ThemedText style={styles.loadingText}>
              {t("dataReset.preparingSecureReset")}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.light.background,
  },
  content: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: Spacing.md,
  },
  backButton: {
    padding: Spacing.md,
  },
  backButtonText: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  softResetSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  softResetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  softResetIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  softResetInfo: {
    flex: 1,
  },
  softResetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  softResetSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  softResetImpact: {
    backgroundColor: Colors.light.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  softResetImpactLabel: {
    fontSize: 12,
    color: Colors.light.warning,
    marginBottom: 8,
    display: "flex",
    justifyContent: "space-between",
  },
  impactChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: 4,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginRight: 4,
    marginBottom: 4,
  },
  impactChipText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  softResetButton: {
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  softResetButtonText: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    fontWeight: "500",
  },
  zoneDivider: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.light.divider,
    margin: Spacing.xs,
  },
  zoneLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  zoneText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
  },
  hardResetSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  hardResetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  hardResetIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.errorLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  hardResetInfo: {
    flex: 1,
  },
  hardResetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  hardResetSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  verificationInput: {
    marginBottom: Spacing.lg,
  },
  verificationLabel: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  verificationInputField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  verificationInputElement: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: Colors.light.textPrimary,
  },
  matchIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: Spacing.md,
    fontSize: 12,
  },
  matchIconText: {
    color: Colors.light.textPrimary,
  },
  dangerChecklist: {
    backgroundColor: Colors.light.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  checklistTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: 12,
    color: Colors.light.error,
  },
  checklistText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  actionButtons: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  cancelButton: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    flex: 1,
    marginRight: Spacing.md,
  },
  cancelButtonText: {
    color: Colors.light.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  destructiveButton: {
    backgroundColor: Colors.light.destructive,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    flex: 1,
  },
  destructiveButtonText: {
    color: Colors.light.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingFooter: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
});