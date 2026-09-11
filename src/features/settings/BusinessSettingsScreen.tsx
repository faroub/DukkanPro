import { ThemedText, ThemedView, showToast } from "@/components";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Colors, Spacing, BorderRadius, ComponentDimensions } from "@/constants/theme";

/**
 * BusinessSettingsScreen - Screen for managing business profile settings.
 * - Edit business name, owner name, business type
 * - Currency is DZD (display only, not editable)
 * - All user-facing strings come from translation dictionaries
 * - Layout remains LTR in all languages
 */
export function BusinessSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [businessName, setBusinessName] = React.useState(
    t("settings.businessNameDefault") || "Supérette El-Amel"
  );
  const [ownerName, setOwnerName] = React.useState(
    t("settings.ownerNameDefault") || "Karim Belkacem"
  );
  const [businessType, setBusinessType] = React.useState(
    t("settings.businessTypeDefault") || "superette"
  );

  const handleSave = React.useCallback(() => {
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

        {/* Store Photo Preview Card (Stitch version) */}
        <ThemedView style={styles.profileCard}>
          <ThemedView style={styles.profilePhoto}>
            <ThemedView style={styles.photoInner}>
              <span className="material-symbols-outlined text-[24px] text-primary">
                storefront
              </span>
            </ThemedView>
          </ThemedView>
          <ThemedView style={styles.profileDetails}>
            <ThemedText style={styles.profileName}>
              {businessName}
            </ThemedText>
            <ThemedText style={styles.profileLocation}>
              {t("settings.addressDefault") || "Alger Centre • DZD Account"}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formSection}>
          {/* Business Name */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.formLabel}>
              {t("settings.businessName")}
              <span className="font-caption text-caption text-text-muted">
                {t("settings.businessNameRequired")}
              </span>
            </ThemedText>
            <div style={styles.formInputWrapper}>
              <TextInput
                style={styles.formInput}
                value={businessName}
                onChangeText={(text) => setBusinessName(text)}
                placeholder={t("settings.businessNamePlaceholder")}
              />
            </div>
          </View>

          {/* Owner Name */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.formLabel}>
              {t("settings.ownerName")}
              <span className="font-caption text-caption text-text-muted">
                {t("settings.ownerNameRequired")}
              </span>
            </ThemedText>
            <div style={styles.formInputWrapper}>
              <TextInput
                style={styles.formInput}
                value={ownerName}
                onChangeText={(text) => setOwnerName(text)}
                placeholder={t("settings.ownerNamePlaceholder")}
              />
            </div>
          </View>

          {/* Business Type */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.formLabel}>
              {t("settings.businessType")}
              <span className="font-caption text-caption text-text-muted">
                {t("settings.businessTypeHelp")}
              </span>
            </ThemedText>
            <div style={styles.formInputWrapper}>
              <TextInput
                style={styles.formInput}
                value={businessType}
                onChangeText={(text) => setBusinessType(text)}
                placeholder={t("settings.businessTypePlaceholder")}
              />
            </div>
          </View>

          {/* Currency display (display only) */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.formLabel}>
              {t("settings.currencyDZD")}
              <span className="font-caption text-caption text-text-muted">
                {t("settings.currencyDisplayOnly")}
              </span>
            </ThemedText>
            <ThemedText style={styles.formValueDisplay}>DZD</ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <ThemedText style={styles.cancelButtonText}>
              {t("common:cancel")}
            </ThemedText>
          </TouchableOpacity>
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
  profileCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primaryLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  photoInner: {
    fontSize: 30,
  },
  profileDetails: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  profileLocation: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  formSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    marginBottom: 8,
    display: "flex",
    justifyContent: "space-between",
  },
  formInputWrapper: {
    marginTop: 4,
  },
  formInput: {
    height: 48,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    backgroundColor: Colors.light.surface,
  },
  formValueDisplay: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginLeft: 8,
    fontStyle: "italic",
  },
  actionButtons: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    flexDirection: "row",
    justifyContent: "space-between",
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
  saveButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    width: "48%",
  },
  saveButtonText: {
    color: Colors.light.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});