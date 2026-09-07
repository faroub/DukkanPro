import { ThemedText, ThemedView, showToast } from "@/components";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from "react-native";

/**
 * DataResetScreen - Screen for resetting all application data.
 * - Clear development/demo data
 - Delete all local business data
 - Require exact business-name confirmation (type the business name to confirm)
 - Explain deletion cannot be undone
 - Clear database and preferences
 - Reset locale to French
 - Return to onboarding
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

  const handleBusinessNameChange = useCallback((text: string) => {
    setBusinessNameInput(text);
  }, []);

  const handleResetData = useCallback(async () => {
    const expectedBusinessName = "Dukan Grocery"; // Default from seed data

    // Check if the entered business name matches exactly
    if (businessNameInput.trim() !== expectedBusinessName) {
      showToast(t("dataReset.wrongBusinessName"));
      setBusinessNameInput("");
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

        <ThemedView style={styles.formSection}>
          <ThemedText style={styles.formLabel}>
            {t("dataReset.businessNameConfirmation")}
          </ThemedText>

          <TextInput
            style={styles.formInput}
            value={businessNameInput}
            onChangeText={handleBusinessNameChange}
            placeholder={t("dataReset.businessNameConfirmation")}
          />
        </ThemedView>

        {/* Warning about irreversible action */}
        <ThemedView style={styles.warningBox}>
          <ThemedText style={styles.warningText}>
            {t("dataReset.irreversibleWarning")}
          </ThemedText>
        </ThemedView>

        {/* Action buttons */}
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
          >
            <ThemedText style={styles.destructiveButtonText}>
              {t("dataReset.resetData")}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
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
  formSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    backgroundColor: Colors.light.backgroundElement,
    width: "100%",
  },
  warningBox: {
    backgroundColor: Colors.light.warningLight,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningText: {
    fontSize: 12,
    color: Colors.light.warning,
    marginBottom: 0,
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
    marginLeft: Spacing.md,
    width: "100%",
  },
  destructiveButtonText: {
    color: Colors.light.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
