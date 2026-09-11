import { ThemedText, ThemedView, showToast } from "@/components";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius, ComponentDimensions } from "@/constants/theme";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    TextInput,
    FlatList,
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
  const [selectedExport, setSelectedExport] = useState<
    | "products"
    | "customers"
    | "sales"
    | "saleItems"
    | "payments"
    | "inventoryMovements"
  >("products");
  const [confirmExport, setConfirmExport] = useState(false);
  const [selectedTables, setSelectedTables] = useState<
    | "products"
    | "customers"
    | "sales"
    | "saleItems"
    | "payments"
    | "inventoryMovements"
  > as const[];

  const allTableLabels = {
    products: t("exportSettings.products"),
    customers: t("exportSettings.customers"),
    sales: t("exportSettings.sales"),
    saleItems: t("exportSettings.saleItems"),
    payments: t("exportSettings.payments"),
    inventoryMovements: t("exportSettings.inventoryMovements"),
  };

  const tableOptions = [
    { value: "products", label: allTableLabels.products, bytes: 24000 },
    { value: "customers", label: allTableLabels.customers, bytes: 18000 },
    { value: "sales", label: allTableLabels.sales, bytes: 32000 },
    { value: "saleItems", label: allTableLabels.saleItems, bytes: 19000 },
    { value: "payments", label: allTableLabels.payments, bytes: 7000 },
    { value: "inventoryMovements", label: allTableLabels.inventoryMovements, bytes: 5000 },
  ];

  const handleExportSelect = useCallback((value: string) => {
    setSelectedExport(value as typeof selectedExport);
  }, []);

  const toggleTable = useCallback((value: string) => {
    setSelectedTables((prev) => {
      const index = prev.indexOf(value);
      if (index > -1) {
        return prev.filter((v) => v !== value);
      }
      return [...prev, value];
    });
  }, []);

  const handleConfirmExport = useCallback(() => {
    setConfirmExport(true);
  }, []);

  const handleCancelExport = useCallback(() => {
    setConfirmExport(false);
  }, []);

  const handlePerformExport = useCallback(async () => {
    // Only export selected tables
    const selected = tableOptions.filter((opt) => selectedTables.includes(opt.value));
    if (selected.length === 0) {
      showToast(t("exportSettings.noTablesSelected"));
      return;
    }
    showToast(
      t("exportSettings.exportInProgress"),
    );
    setConfirmExport(false);
  }, [selectedTables, t]);

  React.useEffect(() => {
    if (confirmExport) {
      Alert.alert(
        t("exportSettings.exportConfirmTitle"),
        t("exportSettings.exportConfirmMessage", {
          exportType: selectedTables.length > 0 ? `${selectedTables.length} tables` : t(`exportSettings.${selectedExport}`),
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
    confirmExport,
    handleCancelExport,
    handlePerformExport,
    t,
  ]);

  // Calculate selected bytes
  const totalBytes = tableOptions
    .filter((opt) => selectedTables.includes(opt.value))
    .reduce((sum, opt) => sum + opt.bytes, 0);
  const kb = Math.round(totalBytes / 1024);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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

        {/* Format & Selection Toolbar */}
        <ThemedView style={styles.toolbar}>
          <ThemedView style={styles.formatSelector}>
            <ThemedText style={styles.formatLabel}>
              {t("exportSettings.selectType")}
            </ThemedText>
            <ThemedView style={styles.formatOption}>
              <TouchableOpacity
                style={styles.formatOptionItem}
                onPress={() => setSelectedExport("products")}
                selected={selectedExport === "products"}
              >
                <span className="material-symbols-outlined text-[20px] text-primary">
                  inventory_2
                </span>
                <ThemedText style={styles.formatOptionLabel}>Products</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.formatOptionItem}
                onPress={() => setSelectedExport("customers")}
                selected={selectedExport === "customers"}
              >
                <span className="material-symbols-outlined text-[20px] text-primary">
                  menu_book
                </span>
                <ThemedText style={styles.formatOptionLabel}>
                  {t("exportSettings.customers")}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.formatOptionItem}
                onPress={() => setSelectedExport("sales")}
                selected={selectedExport === "sales"}
              >
                <span className="material-symbols-outlined text-[20px] text-primary">
                  receipt_long
                </span>
                <ThemedText style={styles.formatOptionLabel}>Sales</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.toggleAll}>
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={toggleTable}
              >
                <ThemedText style={styles.toggleBtnText}>
                  {selectedTables.length === tableOptions.length ? t("common:deselectAll") : t("common:selectAll")}
                </ThemedText>
              </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* Exportable Collections Checklist Card */}
        <ThemedView style={styles.checklistCard}>
          <ThemedView style={styles.checklistHeader}>
            <ThemedText style={styles.checklistTitle}>
              {t("exportSettings.availableStoreLedgers")}
            </ThemedText>
            <ThemedText style={styles.checklistSubtitle}>
              {selectedTables.length} of {tableOptions.length} tables selected
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.checklistContent}>
            {tableOptions.map((option) => (
              <ThemedView
                key={option.value}
                style={styles.checklistItem}
                data-bytes={option.bytes}
              >
                <ThemedView style={styles.checkitemLeft}>
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    optionIcons[option.value]
                  </span>
                </ThemedView>
                <ThemedView style={styles.checkitemRight}>
                  <ThemedText style={styles.checkitemLabel}>
                    {option.label}
                  </ThemedText>
                  <ThemedText style={styles.checkitemSub}>
                    {option.description || ""}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.checkitemCheckbox}>
                  <TouchableOpacity
                    style={styles.checkitemCheckboxS}
                    onPress={() => toggleTable(option.value)}
                    accessibleRole={selectedTables.includes(option.value) ? "radio" : undefined}
                  >
                    {selectedTables.includes(option.value) ? (
                      <ThemedText style={styles.checkitemCheck}>
                        ✓
                      </ThemedText>
                    ) : null}
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>

        {/* Confirmation Info */}
        {selectedTables.length > 0 && (
          <ThemedView style={styles.infoBox}>
            <ThemedText style={styles.infoText}>
              {t("exportSettings.infoText", {
                count: selectedTables.length,
              })}
            </ThemedText>
          </ThemedView>
        )}

        {/* Export button */}
        <ThemedView style={styles.exportButtonContainer}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleConfirmExport}
            disabled={selectedTables.length === 0}
          >
            <ThemedText style={styles.exportButtonText}>
              {selectedTables.length > 0 ? (
                t("exportSettings.exportButton")
              ) : (
                t("common:selectAtLeastOne")
              )}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const optionIcons = {
  products: "inventory_2",
  customers: "menu_book",
  sales: "receipt_long",
  saleItems: "shopping_basket",
  payments: "payments",
  inventoryMovements: "swap_vert",
};

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
  toolbar: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formatSelector: {
    marginBottom: Spacing.md,
  },
  formatLabel: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    marginBottom: 8,
  },
  formatOption: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  formatOptionItem: {
    backgroundColor: selectedExport === option.value ? Colors.light.primary : Colors.light.surface,
    padding: 10,
    borderRadius: BorderRadius.md,
    minWidth: 80,
  },
  formatOptionLabel: {
    fontSize: 13,
    color: selectedExport === option.value ? Colors.light.textPrimary : Colors.light.textSecondary,
    textAlign: "center",
  },
  toggleAll: {
    marginTop: Spacing.md,
  },
  toggleBtn: {
    width: "100%",
    backgroundColor: Colors.light.surface,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleBtnText: {
    fontSize: 13,
    color: Colors.light.textPrimary,
  },
  checklistCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  checklistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  checklistSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
  },
  checklistContent: {
    flexDirection: "column",
    gap: Spacing.sm,
  },
  checklistItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  checkitemLeft: {
    width: 40,
    flexShrink: 0,
  },
  checkitemRight: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  checkitemLabel: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    fontWeight: "500",
  },
  checkitemSub: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  checkitemCheckbox: {
    flexShrink: 0,
  },
  checkitemCheckboxS: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#1B6B3A",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  checkitemCheck: {
    fontSize: 14,
    color: "#1B6B3A",
  },
  infoBox: {
    backgroundColor: Colors.light.positive,
    borderColor: Colors.light.primary,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.primary,
  },
  exportButtonContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  exportButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    width: "100%",
    marginTop: 16,
    marginBottom: 8,
  },
  exportButtonText: {
    color: Colors.light.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});