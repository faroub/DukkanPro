/**
 * DashboardScreen — Home dashboard for Dukkan OS
 *
 * Fully integrated with Stitch design exports:
 * 1. Greeting header with store name, live pulse dot, today's date, and online status pill.
 * 2. 2x2 Bento Summary Cards with semantic colors (green for sales/profit, amber for debt/low stock).
 * 3. 7-Day Sales Activity bar chart with today highlighted.
 * 4. Recent Sales section with customer avatar, items count, amount, and "See all" navigation.
 * 5. Low Stock Alert section with progress bars, threshold status, and "View all" navigation.
 * 6. Quick Action bottom sheet with 4 large touch buttons.
 * 7. Fast Restock modal for quick counter stock receipt.
 *
 * All data sourced from SQLite via repositories.
 * Strictly visual LTR layout across all languages (ar, fr, en).
 */

import React, { useState, useCallback } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { FooterTrademark } from "@/components/FooterTrademark";
import { GreetingCard } from "@/features/dashboard/components/GreetingCard";
import { LowStockAlertBanner } from "@/features/dashboard/components/LowStockAlertBanner";
import { LowStockList, LowStockProductItem } from "@/features/dashboard/components/LowStockList";
import { LowStockNotificationModal } from "@/features/dashboard/components/LowStockNotificationModal";
import { QuickActionSheet } from "@/features/dashboard/components/QuickActionSheet";
import { RecentSalesList } from "@/features/dashboard/components/RecentSalesList";
import { SalesChart } from "@/features/dashboard/components/SalesChart";
import { SummaryCards } from "@/features/dashboard/components/SummaryCards";
import { EmptyDashboardScreen } from "@/features/onboarding/EmptyDashboardScreen";
import { update as updateProductStock } from "@/database/repositories/productRepository";
import { useDashboard } from "@/hooks/useDashboard";
import { useTheme } from "@/hooks/use-theme";
import { getTextAlignment } from "@/utils/text";

interface DashboardScreenProps {
  t: (key: string, ...args: any[]) => string;
  locale: "ar" | "fr" | "en";
}

export default function DashboardScreenDefault({
  t,
  locale,
}: DashboardScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    greeting,
    todayDate,
    todayLocale,
    currencyCode,
    todayRevenue_centimes,
    todayProfit_centimes,
    toCollect_centimes,
    hasProductsOrSales,
    lowStockCount,
    recentSales,
    lowStockProducts,
    sevenDaySales,
    refetch,
  } = useDashboard({ t, locale });

  // Auto-refetch SQLite dashboard data whenever the Home tab receives focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const alignment = getTextAlignment(locale);

  // Bottom action sheet visibility
  const [quickActionVisible, setQuickActionVisible] = useState(false);

  // Quick Restock modal sheet states
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [selectedRestockProduct, setSelectedRestockProduct] =
    useState<LowStockProductItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // Notification center modal
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);

  // Quick action navigation handlers
  const handleNewSale = () => {
    setQuickActionVisible(false);
    router.push("/(tabs)/sell" as any);
  };

  const handleAddProduct = () => {
    setQuickActionVisible(false);
    router.push("/products/new" as any);
  };

  const handleAddCustomer = () => {
    setQuickActionVisible(false);
    router.push("/customers/new" as any);
  };

  const handleRecordPayment = () => {
    setQuickActionVisible(false);
    router.push("/customers/record-payment" as any);
  };

  const handleSeeAllSales = () => {
    router.push("/sales/history" as any);
  };

  const handleViewAllLowStock = () => {
    router.push("/products/low-stock" as any);
  };

  const handleRestockProduct = (item: LowStockProductItem) => {
    setSelectedRestockProduct(item);
    setRestockAmount(10);
    setRestockModalVisible(true);
  };

  const handleConfirmRestock = async () => {
    if (!selectedRestockProduct || restockAmount <= 0) return;
    try {
      const newStock =
        (selectedRestockProduct.stock_quantity || 0) + restockAmount;
      await updateProductStock(selectedRestockProduct.id, {
        stock_quantity: newStock,
      });

      setRestockModalVisible(false);
      refetch();
      Alert.alert(
        locale === "ar" ? "تم التحديث" : locale === "fr" ? "Stock mis à jour" : "Stock Updated",
        locale === "ar"
          ? `تمت إضافة ${restockAmount} إلى ${selectedRestockProduct.name}`
          : `Added ${restockAmount} units to ${selectedRestockProduct.name}`
      );
    } catch (e) {
      console.error("Failed to update stock", e);
      setRestockModalVisible(false);
    }
  };

  const isEmptyDashboard = !hasProductsOrSales;

  if (isEmptyDashboard) {
    return (
      <EmptyDashboardScreen
        onNewSale={handleNewSale}
        onAddProduct={handleAddProduct}
        onAddCustomer={handleAddCustomer}
        onOpenSettings={() => router.push("/(tabs)/more" as any)}
      />
    );
  }

  return (
    <ThemedView type="background" style={styles.container}>
      {/* 1. Fixed Top Bar with Safe Area Inset */}
      <View
        style={[
          styles.fixedHeader,
          {
            paddingTop: Math.max(insets.top, Spacing.sm),
            backgroundColor: theme.background,
            borderBottomColor: theme.borderLight,
          },
        ]}
      >
        <GreetingCard
          greeting={greeting}
          todayDate={todayDate}
          locale={todayLocale}
          textAlignment={alignment}
          lowStockCount={lowStockCount}
          onProfilePress={() => router.push("/(tabs)/more" as any)}
          onOpenNotifications={() => setNotificationModalVisible(true)}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1.5. Prominent Low-Stock Home Screen Alert Banner */}
        <LowStockAlertBanner
          lowStockProducts={lowStockProducts}
          locale={locale}
          onRestockProduct={handleRestockProduct}
          onOpenNotificationModal={() => setNotificationModalVisible(true)}
          onViewAll={handleViewAllLowStock}
        />

        {/* 2. 2x2 Bento Summary Cards */}
        <SummaryCards
          revenueKey={t("dashboard.summary.revenue") || (locale === "ar" ? "مبيعات اليوم" : "Today's Sales")}
          revenueValue_centimes={todayRevenue_centimes}
          profitKey={t("dashboard.summary.profit") || (locale === "ar" ? "الربح التقديري" : "Est. Profit")}
          profitValue_centimes={todayProfit_centimes}
          toCollectKey={t("dashboard.summary.toCollect") || (locale === "ar" ? "ديون للتحصيل" : "To Collect")}
          toCollectValue_centimes={toCollect_centimes}
          lowStockKey={t("dashboard.summary.lowStock") || t("dashboard.lowStock.title") || (locale === "ar" ? "نقص المخزون" : "Low Stock")}
          lowStockCount={lowStockCount}
          currency={currencyCode}
          locale={locale}
          textAlignment={alignment}
          onPressRevenue={handleSeeAllSales}
          onPressProfit={handleSeeAllSales}
          onPressToCollect={() => router.push("/(tabs)/customers" as any)}
          onPressLowStock={handleViewAllLowStock}
        />

        {/* 3. 7-Day Sales Trend Bar Chart */}
        <SalesChart
          data={sevenDaySales}
          title={t("dashboard.charts.salesTrend", { defaultValue: "7-Day Sales Activity" })}
          subtitle={t("dashboard.charts.subtitle", { defaultValue: "Weekly performance" })}
          currency={currencyCode}
          locale={locale}
        />

        {/* 3.5. Quick Operations Grid */}
        <View style={styles.shortcutsSection}>
          <View style={styles.shortcutsHeader}>
            <ThemedText style={[styles.shortcutsTitle, { color: theme.textPrimary }]}>
              {t("dashboard.shortcuts.title", { defaultValue: "Quick Operations" })}
            </ThemedText>
          </View>

          <View style={styles.shortcutsGrid}>
            <TouchableOpacity
              style={[styles.shortcutTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleNewSale}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[styles.shortcutIconBox, { backgroundColor: theme.primaryLight }]}>
                <MaterialIcons name="point-of-sale" size={22} color={theme.primary} />
              </View>
              <ThemedText style={[styles.shortcutLabel, { color: theme.textPrimary }]}>
                {t("dashboard.shortcuts.newSale", { defaultValue: "New Sale" })}
              </ThemedText>
              <ThemedText style={[styles.shortcutSub, { color: theme.textSecondary }]}>
                {t("dashboard.shortcuts.newSaleSub", { defaultValue: "Quick POS" })}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleAddProduct}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[styles.shortcutIconBox, { backgroundColor: theme.surfaceAlt }]}>
                <MaterialIcons name="add-box" size={22} color={theme.primary} />
              </View>
              <ThemedText style={[styles.shortcutLabel, { color: theme.textPrimary }]}>
                {t("dashboard.shortcuts.addProduct", { defaultValue: "Add Product" })}
              </ThemedText>
              <ThemedText style={[styles.shortcutSub, { color: theme.textSecondary }]}>
                {t("dashboard.shortcuts.addProductSub", { defaultValue: "Catalog" })}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleAddCustomer}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[styles.shortcutIconBox, { backgroundColor: theme.surfaceAlt }]}>
                <MaterialIcons name="person-add" size={22} color={theme.primary} />
              </View>
              <ThemedText style={[styles.shortcutLabel, { color: theme.textPrimary }]}>
                {t("dashboard.shortcuts.addCustomer", { defaultValue: "Add Customer" })}
              </ThemedText>
              <ThemedText style={[styles.shortcutSub, { color: theme.textSecondary }]}>
                {t("dashboard.shortcuts.addCustomerSub", { defaultValue: "Credit Book" })}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleRecordPayment}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[styles.shortcutIconBox, { backgroundColor: theme.warningLight }]}>
                <MaterialIcons name="payments" size={22} color={theme.secondary} />
              </View>
              <ThemedText style={[styles.shortcutLabel, { color: theme.textPrimary }]}>
                {t("dashboard.shortcuts.payDebt", { defaultValue: "Pay Debt" })}
              </ThemedText>
              <ThemedText style={[styles.shortcutSub, { color: theme.textSecondary }]}>
                {t("dashboard.shortcuts.payDebtSub", { defaultValue: "Receipt" })}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Recent Sales Section */}
        <RecentSalesList
          recentSales={recentSales}
          locale={locale}
          textAlignment={alignment}
          onSeeAll={handleSeeAllSales}
        />

        {/* 5. Low Stock Alert & Inventory Section */}
        <LowStockList
          products={lowStockProducts}
          locale={locale}
          textAlignment={alignment}
          onViewAll={handleViewAllLowStock}
          onRestock={handleRestockProduct}
        />

        {/* Footer Trademark */}
        <FooterTrademark />
      </ScrollView>

      {/* Quick Action Bottom Sheet */}
      <QuickActionSheet
        visible={quickActionVisible}
        onClose={() => setQuickActionVisible(false)}
        onNewSale={handleNewSale}
        onAddProduct={handleAddProduct}
        onAddCustomer={handleAddCustomer}
        onRecordPayment={handleRecordPayment}
        locale={locale}
      />

      {/* Quick Restock Modal Sheet */}
      <Modal
        visible={restockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRestockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setRestockModalVisible(false)}
          />

          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={[styles.modalSubHeader, { color: theme.textSecondary }]}>
                  {locale === "ar" ? "إعادة تموين سريعة" : locale === "fr" ? "Réapprovisionnement rapide" : "Quick Restock"}
                </ThemedText>
                <ThemedText style={[styles.modalProductTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {selectedRestockProduct?.name}
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: theme.surfaceAlt }]}
                onPress={() => setRestockModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close restock modal"
              >
                <MaterialIcons name="close" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Current Level Box */}
            <View style={[styles.modalCurrentLevelBox, { backgroundColor: theme.surfaceAlt }]}>
              <ThemedText style={[styles.modalCurrentLevelLabel, { color: theme.textSecondary }]}>
                {locale === "ar" ? "المستوى الحالي" : locale === "fr" ? "Niveau actuel" : "Current level"}
              </ThemedText>
              <ThemedText style={[styles.modalCurrentLevelValue, { color: theme.textPrimary }]}>
                {selectedRestockProduct?.stock_quantity} / {selectedRestockProduct?.minimum_stock_quantity}{" "}
                {selectedRestockProduct?.unit || (locale === "fr" ? "unités" : locale === "ar" ? "وحدات" : "units")}
              </ThemedText>
            </View>

            {/* Quantity Stepper */}
            <View style={styles.modalStepperRow}>
              <ThemedText style={[styles.modalStepperLabel, { color: theme.textPrimary }]}>
                {locale === "ar" ? "الكمية المستلمة:" : locale === "fr" ? "Quantité à recevoir :" : "Quantity to receive:"}
              </ThemedText>

              <View style={[styles.stepperContainer, { backgroundColor: theme.surfaceAlt }]}>
                <TouchableOpacity
                  style={[styles.stepperButton, { backgroundColor: theme.surface }]}
                  onPress={() => setRestockAmount((q) => Math.max(1, q - 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease quantity"
                >
                  <MaterialIcons name="remove" size={18} color={theme.textPrimary} />
                </TouchableOpacity>

                <ThemedText style={[styles.stepperValueText, { color: theme.textPrimary }]}>
                  {restockAmount}
                </ThemedText>

                <TouchableOpacity
                  style={[styles.stepperButton, { backgroundColor: theme.surface }]}
                  onPress={() => setRestockAmount((q) => q + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                >
                  <MaterialIcons name="add" size={18} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: theme.surfaceAlt }]}
                onPress={() => setRestockModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <ThemedText style={[styles.modalCancelBtnText, { color: theme.textSecondary }]}>
                  {locale === "ar" ? "إلغاء" : locale === "fr" ? "Annuler" : "Cancel"}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: theme.primary }]}
                onPress={handleConfirmRestock}
                accessibilityRole="button"
                accessibilityLabel="Receive Units"
              >
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <ThemedText style={styles.modalConfirmBtnText}>
                  {locale === "ar" ? "استلام الوحدات" : locale === "fr" ? "Réceptionner" : "Receive Units"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Low Stock Alert Center & Push Notification Center Modal */}
      <LowStockNotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        lowStockProducts={lowStockProducts}
        locale={locale}
        onRestockProduct={handleRestockProduct}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  shortcutsSection: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  shortcutsHeader: {
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  shortcutsTitle: {
    ...Typography.heading3,
    fontSize: 17,
    fontWeight: "700",
  },
  shortcutsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  shortcutTile: {
    flex: 1,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  shortcutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shortcutLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  shortcutSub: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  actionTriggersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: Spacing.xs,
  },
  primarySaleButton: {
    flex: 1,
    height: 50,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Shadows.md,
  },
  primarySaleButtonText: {
    ...Typography.label,
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  quickActionsTrigger: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    gap: 16,
    ...Shadows.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalSubHeader: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
  },
  modalProductTitle: {
    ...Typography.heading3,
    fontSize: 18,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCurrentLevelBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  modalCurrentLevelLabel: {
    ...Typography.caption,
    fontSize: 12,
  },
  modalCurrentLevelValue: {
    ...Typography.label,
    fontSize: 15,
  },
  modalStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalStepperLabel: {
    ...Typography.label,
    fontSize: 14,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    padding: 4,
    gap: 12,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValueText: {
    ...Typography.label,
    fontSize: 16,
    minWidth: 24,
    textAlign: "center",
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: {
    ...Typography.label,
    fontSize: 14,
  },
  modalConfirmBtn: {
    flex: 2,
    height: 46,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalConfirmBtnText: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
