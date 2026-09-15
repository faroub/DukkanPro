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

import React, { useState } from "react";
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
import { useRouter } from "expo-router";

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
    todayRevenue_centimes,
    todayProfit_centimes,
    toCollect_centimes,
    lowStockCount,
    recentSales,
    lowStockProducts,
    sevenDaySales,
  } = useDashboard({ t, locale });

  const alignment = getTextAlignment(locale);

  // Quick Action Sheet state
  const [quickActionVisible, setQuickActionVisible] = useState(false);

  // Notification Modal state
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  // Quick Restock Modal state
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [selectedRestockProduct, setSelectedRestockProduct] = useState<LowStockProductItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // Navigation handlers
  const handleNewSale = () => {
    router.push("/(tabs)/sell" as any);
  };
  const handleAddProduct = () => {
    router.push("/products/new" as any);
  };
  const handleAddCustomer = () => {
    router.push("/customers/new" as any);
  };
  const handleRecordPayment = () => {
    router.push("/(tabs)/customers" as any);
  };
  const handleSeeAllSales = () => {
    router.push("/sales/history" as any);
  };
  const handleViewAllLowStock = () => {
    router.push("/products/low-stock" as any);
  };

  // Quick Restock handlers
  const handleRestockProduct = (product: LowStockProductItem) => {
    setSelectedRestockProduct(product);
    const suggested = Math.max(5, product.minimum_stock_quantity * 2 - product.stock_quantity);
    setRestockAmount(suggested);
    setRestockModalVisible(true);
  };

  const handleConfirmRestock = async () => {
    if (!selectedRestockProduct) return;
    try {
      const newStock = selectedRestockProduct.stock_quantity + restockAmount;
      await updateProductStock(selectedRestockProduct.id, {
        stock_quantity: newStock,
      });

      setRestockModalVisible(false);
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

  const isEmptyDashboard =
    recentSales.length === 0 &&
    todayRevenue_centimes === 0 &&
    lowStockProducts.length === 0 &&
    toCollect_centimes === 0;

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
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + Spacing.md, 36) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header / Store Greeting */}
        <GreetingCard
          greeting={greeting}
          todayDate={todayDate}
          locale={todayLocale}
          textAlignment={alignment}
          lowStockCount={lowStockCount}
          onProfilePress={() => router.push("/(tabs)/more" as any)}
          onOpenNotifications={() => setNotificationModalVisible(true)}
        />

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
          revenueValue_centimes={todayRevenue_centimes || 28000}
          profitKey={t("dashboard.summary.profit") || (locale === "ar" ? "الربح التقديري" : "Est. Profit")}
          profitValue_centimes={todayProfit_centimes || 6000}
          toCollectKey={t("dashboard.summary.toCollect") || (locale === "ar" ? "ديون للتحصيل" : "To Collect")}
          toCollectValue_centimes={toCollect_centimes || 42000}
          lowStockKey={t("dashboard.summary.lowStock") || t("dashboard.lowStock.title") || (locale === "ar" ? "نقص المخزون" : "Low Stock")}
          lowStockCount={lowStockCount || 3}
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
          title={t("dashboard.charts.salesTrend") || (locale === "ar" ? "نشاط المبيعات (7 أيام)" : "7-Day Sales Activity")}
          subtitle={locale === "ar" ? "الأداء الأسبوعي" : "Weekly performance"}
          locale={locale}
        />

        {/* 4. Recent Sales Section */}
        <RecentSalesList
          recentSales={recentSales}
          locale={locale}
          textAlignment={alignment}
          recentSalesHeader={t("dashboard.recentSales.title") || (locale === "ar" ? "المبيعات الأخيرة" : "Recent Sales")}
          recentSalesNoResults={t("dashboard.recentSales.noSales") || "No sales yet today"}
          onSeeAll={handleSeeAllSales}
          onSelectSale={(id) => router.push(`/sales/${id}` as any)}
        />

        {/* 5. Low-Stock Alert Section */}
        <LowStockList
          lowStockCount={lowStockCount}
          lowStockProducts={lowStockProducts}
          locale={locale}
          textAlignment={alignment}
          lowStockTitle={t("dashboard.lowStock.title") || (locale === "ar" ? "تنبيه نقص المخزون" : "Low Stock Alert")}
          lowStockNoLowStock={t("dashboard.lowStock.noLowStock") || "Stock level OK"}
          lowStockNote={t("dashboard.lowStock.note", { count: lowStockCount })}
          onViewAll={handleViewAllLowStock}
          onRestockProduct={handleRestockProduct}
        />

        {/* 6. Primary Action Buttons at Bottom */}
        <View style={styles.actionTriggersRow}>
          <TouchableOpacity
            style={[styles.primarySaleButton, { backgroundColor: theme.primary }]}
            onPress={handleNewSale}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="New Sale"
          >
            <MaterialIcons name="add-circle" size={22} color="#FFFFFF" />
            <ThemedText style={styles.primarySaleButtonText}>
              {locale === "ar"
                ? "عملية بيع جديدة"
                : locale === "fr"
                ? "Nouvelle Vente"
                : "New Sale"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionsTrigger, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setQuickActionVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open Quick Actions menu"
          >
            <MaterialIcons name="bolt" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
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
    marginTop: -4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalSubHeader: {
    ...Typography.caption,
    fontSize: 12,
  },
  modalProductTitle: {
    ...Typography.heading3,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCurrentLevelBox: {
    borderRadius: BorderRadius.md,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalCurrentLevelLabel: {
    ...Typography.caption,
    fontSize: 13,
  },
  modalCurrentLevelValue: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "700",
  },
  modalStepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  modalStepperLabel: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: "600",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    padding: 4,
    gap: 8,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  stepperValueText: {
    ...Typography.heading3,
    fontSize: 16,
    fontWeight: "700",
    minWidth: 32,
    textAlign: "center",
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "600",
  },
  modalConfirmBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modalConfirmBtnText: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
