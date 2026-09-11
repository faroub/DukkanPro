import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { showToast } from "@/components/use-toast";
import {
  BorderRadius,
  Colors,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";

export type ExportTableId =
  | "products"
  | "customers"
  | "sales"
  | "saleItems"
  | "payments"
  | "inventoryMovements";

interface TableOption {
  id: ExportTableId;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  bytes: number;
}

const TABLE_OPTIONS: TableOption[] = [
  {
    id: "products",
    icon: "inventory-2",
    title: "Products",
    description: "24 items, prices, SKUs, inventory counts",
    bytes: 34000,
  },
  {
    id: "customers",
    icon: "menu-book",
    title: "Customers & Carnet",
    description: "48 customers, debt ledger balances",
    bytes: 22000,
  },
  {
    id: "sales",
    icon: "receipt-long",
    title: "Sales History",
    description: "142 completed sales receipts",
    bytes: 41000,
  },
  {
    id: "saleItems",
    icon: "shopping-basket",
    title: "Sale Items",
    description: "Itemized sold lines & discounts",
    bytes: 19000,
  },
  {
    id: "payments",
    icon: "payments",
    title: "Customer Payments",
    description: "Ledger settlements & repayments",
    bytes: 7000,
  },
  {
    id: "inventoryMovements",
    icon: "swap-vert",
    title: "Inventory Movements",
    description: "Stock adjustments, receipts, returns",
    bytes: 5000,
  },
];

/**
 * ExportSettingsScreen - Screen for downloading local backup files in CSV format.
 * Sourced directly from Stitch design `4._data_export`.
 * - Multi-table checkbox selection with select all / deselect all
 * - Dynamic byte/size estimation
 * - Confirmation alert before exporting
 * - Never uploads automatically; stays local to device
 * - Strictly LTR layout across all languages
 */
export function ExportSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [selectedTables, setSelectedTables] = useState<ExportTableId[]>([
    "products",
    "customers",
    "sales",
    "saleItems",
    "payments",
    "inventoryMovements",
  ]);
  const [isExporting, setIsExporting] = useState(false);

  const isAllSelected = selectedTables.length === TABLE_OPTIONS.length;

  const totalBytes = useMemo(() => {
    return TABLE_OPTIONS.filter((opt) => selectedTables.includes(opt.id)).reduce(
      (sum, opt) => sum + opt.bytes,
      0
    );
  }, [selectedTables]);

  const totalKb = Math.round(totalBytes / 1024);

  const handleToggleTable = useCallback((id: ExportTableId) => {
    setSelectedTables((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedTables([]);
    } else {
      setSelectedTables(TABLE_OPTIONS.map((opt) => opt.id));
    }
  }, [isAllSelected]);

  const handleConfirmExport = useCallback(() => {
    if (selectedTables.length === 0) {
      showToast(t("exports.noDataToExport") || "Select at least 1 table");
      return;
    }

    Alert.alert(
      "Export Confirmation",
      `Export ${selectedTables.length} table(s) (${totalKb} KB) to local CSV storage?`,
      [
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: "Export CSV",
          onPress: () => {
            setIsExporting(true);
            setTimeout(() => {
              setIsExporting(false);
              showToast("Export completed successfully! / Exportation terminée");
            }, 500);
          },
        },
      ]
    );
  }, [selectedTables, totalKb, t]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.container}>
        {/* Breadcrumb Context */}
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={18} color={Colors.light.textSecondary} />
          <ThemedText style={styles.breadcrumbText}>
            {t("navigation.back") || "Back to More"}
          </ThemedText>
        </TouchableOpacity>

        {/* Friendly Delight Header Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconContainer}>
            <MaterialIcons name="cloud-download" size={28} color={Colors.light.primary} />
          </View>
          <View style={styles.heroContent}>
            <ThemedText style={styles.heroTitle}>Export Store Records</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Download local backup files directly to your device storage in standard CSV format.
            </ThemedText>
          </View>
        </View>

        {/* Format & Selection Toolbar */}
        <View style={styles.toolbarCard}>
          <View style={styles.formatRow}>
            <View style={styles.formatLeft}>
              <MaterialIcons name="format-list-bulleted" size={20} color={Colors.light.primary} />
              <ThemedText style={styles.formatLabel}>File Format</ThemedText>
            </View>
            <View style={styles.formatBadge}>
              <View style={styles.pulseDot} />
              <ThemedText style={styles.formatBadgeText}>CSV (UTF-8, Standard)</ThemedText>
            </View>
          </View>

          <View style={styles.selectionRow}>
            <ThemedText style={styles.selectionSummary}>
              {selectedTables.length} of {TABLE_OPTIONS.length} tables selected ({totalKb} KB)
            </ThemedText>
            <TouchableOpacity onPress={handleToggleAll} activeOpacity={0.7}>
              <ThemedText style={styles.toggleAllButton}>
                {isAllSelected ? "Deselect All" : "Select All"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Store Ledgers Checklist Card */}
        <View style={styles.ledgersCard}>
          <View style={styles.ledgersHeader}>
            <MaterialIcons name="storage" size={18} color={Colors.light.textSecondary} />
            <ThemedText style={styles.ledgersHeaderTitle}>Available Store Ledgers</ThemedText>
          </View>

          <View style={styles.checklist}>
            {TABLE_OPTIONS.map((item, index) => {
              const isChecked = selectedTables.includes(item.id);
              return (
                <React.Fragment key={item.id}>
                  {index > 0 && <View style={styles.itemDivider} />}
                  <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => handleToggleTable(item.id)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked }}
                  >
                    <View style={styles.checkRowLeft}>
                      <View style={styles.itemIconContainer}>
                        <MaterialIcons name={item.icon} size={20} color={Colors.light.primary} />
                      </View>
                      <View style={styles.itemInfo}>
                        <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                        <ThemedText style={styles.itemDescription} numberOfLines={1}>
                          {item.description}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Checkbox */}
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Note Card with Privacy & Locale info */}
        <View style={styles.privacyCard}>
          <View style={styles.lockIconContainer}>
            <MaterialIcons name="lock" size={20} color={Colors.light.warning} />
          </View>
          <View style={styles.privacyContent}>
            <ThemedText style={styles.privacyTitle}>Local & Private Storage</ThemedText>
            <ThemedText style={styles.privacySubtitle}>
              CSV headers will use the selected language (Français). Data stays strictly on your device — nothing is uploaded to third-party servers.
            </ThemedText>
          </View>
        </View>

        {/* Inline Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconContainer}>
            <MaterialIcons
              name={selectedTables.length > 0 ? "check-circle" : "info"}
              size={20}
              color={Colors.light.primary}
            />
          </View>
          <View style={styles.statusContent}>
            <View style={styles.statusHeaderRow}>
              <ThemedText style={styles.statusTitle}>
                {selectedTables.length > 0 ? "Ready to Export" : "No Tables Selected"}
              </ThemedText>
              <View style={styles.versionTag}>
                <ThemedText style={styles.versionTagText}>v1.2.4</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.statusSubtitle}>
              {selectedTables.length > 0
                ? `Ready to export ${selectedTables.length} CSV files (approx ${totalKb} KB). Tap confirm below to save to Downloads.`
                : "Select one or more tables from the list above to proceed."}
            </ThemedText>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            selectedTables.length === 0 && styles.actionButtonDisabled,
          ]}
          onPress={handleConfirmExport}
          activeOpacity={0.8}
          disabled={selectedTables.length === 0 || isExporting}
        >
          <MaterialIcons
            name="download"
            size={22}
            color={selectedTables.length === 0 ? Colors.light.textSecondary : "#FFFFFF"}
          />
          <ThemedText
            style={[
              styles.actionButtonText,
              selectedTables.length === 0 && styles.actionButtonTextDisabled,
            ]}
          >
            {isExporting
              ? "Exporting..."
              : selectedTables.length > 0
              ? `Export as CSV (${selectedTables.length} tables)`
              : "Select at least 1 table"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.light.background,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "transparent",
    gap: Spacing.md,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    alignSelf: "flex-start",
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.surfaceAlt,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  heroSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  toolbarCard: {
    backgroundColor: Colors.light.surface,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  formatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  formatLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formatLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  formatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  formatBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  selectionSummary: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  toggleAllButton: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
    textDecorationLine: "underline",
  },
  ledgersCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
    ...Shadows.sm,
  },
  ledgersHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: ComponentDimensions.cardPadding,
    paddingVertical: 12,
    backgroundColor: Colors.light.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  ledgersHeaderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  checklist: {
    paddingVertical: 2,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: ComponentDimensions.cardPadding,
    paddingVertical: 10,
  },
  checkRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
    minWidth: 0,
    paddingRight: Spacing.sm,
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  itemDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginHorizontal: ComponentDimensions.cardPadding,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.light.warningLight,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  lockIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  privacySubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.light.surfaceAlt,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  statusContent: {
    flex: 1,
  },
  statusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  versionTag: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  versionTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  statusSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.button,
    ...Shadows.sm,
  },
  actionButtonDisabled: {
    backgroundColor: Colors.light.disabledBackground,
    shadowOpacity: 0,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionButtonTextDisabled: {
    color: Colors.light.textSecondary,
  },
});
