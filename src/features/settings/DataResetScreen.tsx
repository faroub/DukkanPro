import { ThemedText, ThemedView, showToast } from "@/components";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
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
    padding: 24,
    backgroundColor: "#F8F7F4",
  },
  content: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: "#1B6B3A",
  },
  formSection: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 8,
  },
  formInput: {
    height: 50,
    borderColor: "#E5E5E5",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
    width: "100%",
  },
  warningBox: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF8F00",
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: "#FF8F00",
    marginBottom: 0,
  },
  actionButtons: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },
  destructiveButton: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 6,
    alignItems: "center",
    marginLeft: 8,
    width: "100%",
  },
  destructiveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
