import { ThemedText, ThemedView, showToast } from "@/components";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

/**
 * InventorySettingsScreen - Screen for managing inventory settings.
 * - Allow negative stock (default: disabled)
 * - Default low-stock threshold
 * - Negative stock disabled by default
 * - All user-facing strings come from translation dictionaries
 * - Layout remains LTR in all languages
 */
export function InventorySettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState(10);
  const [businessName, setBusinessName] = useState("");

  const handleToggleChange = useCallback((value: boolean) => {
    setAllowNegativeStock(value);
  }, []);

  const handleThresholdChange = useCallback((value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setDefaultLowStockThreshold(num);
    }
  }, []);

  const handleSave = useCallback(async () => {
    // TODO: Persist inventory settings to app_settings or backend
    showToast(t("settings.saveChanges"));
  }, [t]);

  // Show confirmation if negative stock is enabled
  const negativeStockWarning = !allowNegativeStock ? null : (
    <View style={styles.warningBox}>
      <ThemedText style={styles.warningText}>
        {t("inventorySettings.negativeStockWarning")}
      </ThemedText>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>
            {t("settings.inventoryRules")}
          </ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>{t("back")}</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.formSection}>
          {/* Allow negative stock toggle */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.formLabel}>
              {t("inventorySettings.allowNegativeStock")}
            </ThemedText>
            <Switch
              value={allowNegativeStock}
              onValueChange={handleToggleChange}
              trackColor={{ false: "#e0e0e0", true: "#1B6B3A" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {negativeStockWarning}

          {/* Default low-stock threshold */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.formLabel}>
              {t("inventorySettings.defaultLowStockThreshold")}
            </ThemedText>
            <TextInput
              style={styles.formInput}
              keyboardType="numeric"
              value={defaultLowStockThreshold.toString()}
              onChangeText={handleThresholdChange}
              placeholder={t(
                "inventorySettings.defaultLowStockThresholdPlaceholder",
              )}
            />
          </View>

          {/* Save button */}
          <ThemedView style={styles.actionButtons}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <ThemedText style={styles.saveButtonText}>
                {t("settings.saveChanges")}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
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
  formGroup: {
    marginBottom: 20,
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
  saveButton: {
    backgroundColor: "#1B6B3A",
    padding: 16,
    borderRadius: 6,
    alignItems: "center",
    width: "100%",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
