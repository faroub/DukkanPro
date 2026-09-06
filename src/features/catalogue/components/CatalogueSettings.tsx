import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTranslation } from "react-i18next";
import { StyleSheet, Switch, TouchableOpacity, View } from "react-native";

interface CatalogueSettingsProps {
  onSettingChange: (key: string, value: any) => void;
  currentSettings: {
    showPrices: boolean;
    hideOutOfStock: boolean;
    contact: string;
    address: string;
  };
}

export function CatalogueSettings({
  onSettingChange,
  currentSettings,
}: CatalogueSettingsProps) {
  const { t } = useTranslation();

  const handleToggleChange = (key: string) => {
    onSettingChange(key, !currentSettings[key as keyof typeof currentSettings]);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="heading" style={styles.title}>
        {t("catalogue.settings")}
      </ThemedText>

      {/* Show prices toggle */}
      <View style={styles.settingRow}>
        <ThemedText type="body" style={styles.settingLabel}>
          {t("catalogue.show_prices")}
        </ThemedText>
        <ThemedText type="body" style={styles.settingValue}>
          {currentSettings.showPrices ? t("yes") : t("no")}
        </ThemedText>
      </View>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={() => handleToggleChange("showPrices")}
          style={styles.toggleContainer}
        >
          <Switch
            value={currentSettings.showPrices}
            onValueChange={() => handleToggleChange("showPrices")}
            thumbColor="#1B6B3A"
            trackColor={{ false: "#666", true: "#1B6B3A" }}
          />
        </TouchableOpacity>
      </View>

      {/* Hide out-of-stock toggle */}
      <View style={styles.settingRow}>
        <ThemedText type="body" style={styles.settingLabel}>
          {t("catalogue.hide_out_of_stock")}
        </ThemedText>
        <ThemedText type="body" style={styles.settingValue}>
          {currentSettings.hideOutOfStock ? t("yes") : t("no")}
        </ThemedText>
      </View>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={() => handleToggleChange("hideOutOfStock")}
          style={styles.toggleContainer}
        >
          <Switch
            value={currentSettings.hideOutOfStock}
            onValueChange={() => handleToggleChange("hideOutOfStock")}
            thumbColor="#1B6B3A"
            trackColor={{ false: "#666", true: "#1B6B3A" }}
          />
        </TouchableOpacity>
      </View>

      {/* Contact field */}
      <View style={styles.settingRow}>
        <ThemedText type="body" style={styles.settingLabel}>
          {t("catalogue.contact")}
        </ThemedText>
        <ThemedText type="body" style={styles.settingValue} numberOfLines={1}>
          {currentSettings.contact || t("catalogue.not_set")}
        </ThemedText>
      </View>

      {/* Address field */}
      <View style={styles.settingRow}>
        <ThemedText type="body" style={styles.settingLabel}>
          {t("catalogue.address")}
        </ThemedText>
        <ThemedText type="body" style={styles.settingValue} numberOfLines={1}>
          {currentSettings.address || t("catalogue.not_set")}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fafafa",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: "#333",
  },
  settingValue: {
    fontSize: 14,
    color: "#666",
  },
  toggleContainer: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    width: 50,
    textAlign: "center",
  },
});
