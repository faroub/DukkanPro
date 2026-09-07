import { ThemedText, ThemedView, showToast } from "@/components";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * BusinessSettingsScreen - Screen for managing business profile settings.
 * - Edit business name, owner name, business type
 * - Currency is DZD (display only, not editable)
 * - All user-facing strings come from translation dictionaries
 */
export function BusinessSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [businessName, setBusinessName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [businessType, setBusinessType] = React.useState("");

  const handleSave = React.useCallback(() => {
    // TODO: Implement business profile save logic
    showToast(t("settings.saveChanges"));
  }, [t]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>
            {t("settings.businessProfile")}
          </ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>{t("back")}</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.formSection}>
          {/* Business Name */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.formLabel}>
              {t("settings.businessName")}
            </ThemedText>
            <TextInput
              style={styles.formInput}
              value={businessName}
              onChangeText={(text) => setBusinessName(text)}
              placeholder={t("settings.businessName")}
            />
          </View>

          {/* Owner Name */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.formLabel}>
              {t("settings.ownerName")}
            </ThemedText>
            <TextInput
              style={styles.formInput}
              value={ownerName}
              onChangeText={(text) => setOwnerName(text)}
              placeholder={t("settings.ownerName")}
            />
          </View>

          {/* Business Type */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.formLabel}>
              {t("settings.businessType")}
            </ThemedText>
            <TextInput
              style={styles.formInput}
              value={businessType}
              onChangeText={(text) => setBusinessType(text)}
              placeholder={t("settings.businessType")}
            />
          </View>

          {/* Currency display (display only) */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.formLabel}>
              {t("settings.currencyDZD")}
            </ThemedText>
            <ThemedText style={styles.formValueDisplay}>DZD</ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>
              {t("settings.saveChanges")}
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
  formValueDisplay: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 8,
    fontStyle: "italic",
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
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
