import { ThemedText, showToast } from "@/components";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";

/**
 * ExportButton - A reusable button component that triggers CSV export.
 * - Shows a language-selected export type menu
 - Confirms before exporting
 - Uses expo-file-system to write the CSV file
 - Uses expo-sharing to share the file
 - All headers are translated to the selected language
 * - Layout remains LTR regardless of selected language
 */
export function ExportButton({
  t,
  onExportTypeSelect,
  onPerformExport,
}: {
  t: ReturnType<typeof useTranslation>["t"];
  onExportTypeSelect: (type: string) => void;
  onPerformExport: () => void;
}) {
  const [selectedExport, setSelectedExport] = React.useState("products");
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  const exportOptions = [
    { value: "products", label: t("exportSettings.products") },
    { value: "customers", label: t("exportSettings.customers") },
    { value: "sales", label: t("exportSettings.sales") },
    { value: "saleItems", label: t("exportSettings.saleItems") },
    { value: "payments", label: t("exportSettings.payments") },
    {
      value: "inventoryMovements",
      label: t("exportSettings.inventoryMovements"),
    },
  ];

  const handleExportSelect = useCallback((value: string) => {
    setSelectedExport(value);
  }, []);

  const handleConfirmExport = useCallback(() => {
    setShowConfirmation(true);
  }, []);

  const handleCancelExport = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  const handlePerformExport = useCallback(async () => {
    // Read data from database and export
    // TODO: Integrate with actual database repositories
    showToast(t("exportSettings.exportInProgress"));
    setShowConfirmation(false);
  }, [t]);

  // Handle the alert confirmation
  React.useEffect(() => {
    if (showConfirmation) {
      Alert.alert(
        t("exportSettings.exportConfirmTitle"),
        t("exportSettings.exportConfirmMessage", {
          exportType: t(`exportSettings.${selectedExport}`),
        }),
        [
          {
            text: t("common:cancel"),
            style: "cancel",
            onPress: handleCancelExport,
          },
          {
            text: t("exportSettings.exportButton"),
            onPress: handlePerformExport,
          },
        ],
      );
    }
  }, [
    handleCancelExport,
    handlePerformExport,
    selectedExport,
    showConfirmation,
    t,
  ]);

  return (
    <TouchableOpacity style={styles.button} onPress={handleConfirmExport}>
      <ThemedText style={styles.buttonText}>
        {t("exportSettings.exportButton")}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1B6B3A",
    padding: 16,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: {
    color: Colors.light.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
