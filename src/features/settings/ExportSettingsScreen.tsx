import { ThemedText, ThemedView, useToast } from "@/components";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";

/**
 * ExportSettingsScreen - Screen for managing data export settings.
 * - Choose what to export (products, customers, sales, etc.)
 * - CSV headers use selected language
 * - Confirm before export
 * - Never upload automatically
 * - All user-facing strings come from translation dictionaries
 * - Layout remains LTR in all languages
 */
export function ExportSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedExport, setSelectedExport] = useState<"products" | "customers" | "sales" | "saleItems" | "payments" | "inventoryMovements">("products");
  const [confirmExport, setConfirmExport] = useState(false);

  const exportOptions = [
    { value: "products", label: t("exportSettings.products") },
    { value: "customers", label: t("exportSettings.customers") },
    { value: "sales", label: t("exportSettings.sales") },
    { value: "saleItems", label: t("exportSettings.saleItems") },
    { value: "payments", label: t("exportSettings.payments") },
    { value: "inventoryMovements", label: t("exportSettings.inventoryMovements") },
  ];

  const handleExportSelect = useCallback(
    (value: string) => {
      setSelectedExport(value as typeof selectedExport);
    },
    [],
  );

  const handleConfirmExport = useCallback(
    () => {
      setConfirmExport(true);
    },
    [],
  );

  const handleCancelExport = useCallback(
    () => {
      setConfirmExport(false);
    },
    [],
  );

  const handlePerformExport = useCallback(
    async () => {
      // TODO: Implement actual export using csvExportService
      // For now, show a toast with the selected option
      useToast(t(`exportSettings.exported${selectedExport.charAt(0).toUpperCase() + selectedExport.slice(1)}`));
      setConfirmExport(false);
    },
    [selectedExport, t],
  );

  // Handle export confirmation dialog
  if (confirmExport) {
    return (
      <Alert
        title={t("exportSettings.exportConfirmTitle")}
        message={t("exportSettings.exportConfirmMessage", {
          exportType: t(`exportSettings.${selectedExport}`),
        })}
        cancelButtonIndex={0}
        cancelButtonTitle={t("common:cancel")}
        onPress={handlePerformExport}
      }
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersist="handled"
    >
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>
            {t("settings.dataExport")}
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
            {t("exportSettings.selectType")}
          </ThemedText>

          {exportOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.exportOptionItem}
              onPress={() => handleExportSelect(option.value)}
              accessibilityRole={selectedExport === option.value ? "radio" : undefined}
            >
              <ThemedText style={styles.exportOptionLabel}>
                {option.label}
              </ThemedText>
              {selectedExport === option.value && (
                <ThemedText style={styles.exportOptionCheck}>
                  ✓
                </ThemedText>
              )}
            </TouchableOpacity>
          ))}

          {/* Confirm export button - always visible */}
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleConfirmExport}
          >
            <ThemedText style={styles.exportButtonText}>
              {t("exportSettings.exportButton")}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Export info section */}
        <ThemedView style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            {t("exportSettings.infoText", {
              count: exportOptions.length,
            })}
          </ThemedText>
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
  exportOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: selectedExport === "products" ? "#1B6B3A" : "#E5E5E5",
  },
  exportOptionLabel: {
    fontSize: 15,
    flex: 1,
  },
  exportOptionCheck: {
    fontSize: 18,
    color: "#1B6B3A",
    marginLeft: 8,
  },
  exportButton: {
    backgroundColor: "#1B6B3A",
    padding: 16,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
    width: "100%",
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "#F0FDF4",
    borderColor: "#1B6B3A",
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: "#1B6B3A",
  },
});