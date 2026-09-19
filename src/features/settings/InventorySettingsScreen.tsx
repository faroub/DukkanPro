import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText, ThemedView, showToast } from "@/components";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Colors } from "@/constants/theme";
import { executeAll, executeWrite } from "@/database/database";
import {
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const ALLOW_NEGATIVE_KEY = "inventory_allow_negative_stock";
const LOW_STOCK_THRESHOLD_KEY = "inventory_low_stock_threshold";

/**
 * Read a boolean/number setting from app_settings, or fall back to the default.
 */
async function readSetting(key: string, fallback: string): Promise<string> {
  try {
    const rows = await executeAll<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ?",
      [key],
    );
    return rows.length > 0 ? rows[0].value : fallback;
  } catch {
    return fallback;
  }
}

/**
 * InventorySettingsScreen - Screen for managing inventory settings.
 * - Allow negative stock (default: disabled)
 * - Default low-stock threshold
 * - Negative stock disabled by default
 * - Settings persist to the app_settings table
 * - All user-facing strings come from translation dictionaries
 * - Layout remains LTR in all languages
 */
export function InventorySettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState(10);

  // Load persisted settings on mount so the form reflects what's saved.
  useEffect(() => {
    (async () => {
      const storedNegative = await readSetting(ALLOW_NEGATIVE_KEY, "false");
      setAllowNegativeStock(storedNegative === "true");
      const storedThreshold = await readSetting(
        LOW_STOCK_THRESHOLD_KEY,
        "10",
      );
      const parsed = parseInt(storedThreshold, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        setDefaultLowStockThreshold(parsed);
      }
    })();
  }, []);

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
    try {
      await executeWrite(
        "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
        [ALLOW_NEGATIVE_KEY, allowNegativeStock ? "true" : "false"],
      );
      await executeWrite(
        "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
        [LOW_STOCK_THRESHOLD_KEY, defaultLowStockThreshold.toString()],
      );
      showToast(t("settings.changesSaved") || t("settings.saveChanges"));
    } catch (error) {
      showToast(t("errors.saveFailed") || "Failed to save settings");
    }
  }, [allowNegativeStock, defaultLowStockThreshold, t]);

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
              thumbColor={Colors.light.primary}
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

        {/* Footer Trademark */}
        <FooterTrademark />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: Colors.light.background,
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
    color: Colors.light.primary,
  },
  formSection: {
    padding: 24,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    marginBottom: 8,
  },
  formInput: {
    height: 50,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.light.surface,
  },
  warningBox: {
    backgroundColor: Colors.light.warningLight,
    borderColor: Colors.light.warning,
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: Colors.light.warning,
    marginBottom: 0,
  },
  actionButtons: {
    padding: 24,
    backgroundColor: Colors.light.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 6,
    alignItems: "center",
    width: "100%",
  },
  saveButtonText: {
    color: Colors.light.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
