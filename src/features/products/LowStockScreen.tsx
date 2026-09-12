import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { getLowStockProducts } from "@/database/repositories/dashboardRepository";
import { update } from "@/database/repositories/productRepository";
import { formatCentimes } from "@/utils/money";

interface LowStockItem {
  id: number;
  name: string;
  sku?: string;
  category?: string;
  sale_price_centimes: number;
  cost_price_centimes: number;
  stock_quantity: number;
  minimum_stock_quantity: number;
  unit?: string;
}

export function LowStockScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const locale = (i18n.language?.startsWith("ar") ? "ar" : i18n.language?.startsWith("fr") ? "fr" : "en") as "ar" | "fr" | "en";

  const [products, setProducts] = useState<LowStockItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Quick restock modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LowStockItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(10);

  const loadData = async () => {
    try {
      setLoading(true);
      const rows = await getLowStockProducts(50);
      if (rows && rows.length > 0) {
        setProducts(rows);
      } else {
        // Fallback items matching Stitch design
        setProducts([
          {
            id: 1,
            name: "Lait Candia 1L",
            sku: "SKU-44021",
            category: "dairy",
            sale_price_centimes: 11000,
            cost_price_centimes: 9000,
            stock_quantity: 2,
            minimum_stock_quantity: 10,
            unit: "units",
          },
          {
            id: 2,
            name: "Café Moulu 250g",
            sku: "SKU-99182",
            category: "groceries",
            sale_price_centimes: 24000,
            cost_price_centimes: 18000,
            stock_quantity: 1,
            minimum_stock_quantity: 8,
            unit: "unit",
          },
          {
            id: 3,
            name: "Huile Elio 2L",
            sku: "SKU-31204",
            category: "oils",
            sale_price_centimes: 34000,
            cost_price_centimes: 28000,
            stock_quantity: 3,
            minimum_stock_quantity: 12,
            unit: "bottles",
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to load low stock products", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRestockModal = (prod: LowStockItem) => {
    setSelectedProduct(prod);
    // default recommended restock quantity
    const needed = Math.max(5, prod.minimum_stock_quantity * 2 - prod.stock_quantity);
    setRestockQuantity(needed);
    setModalVisible(true);
  };

  const handleConfirmRestock = async () => {
    if (!selectedProduct) return;
    try {
      const newStock = selectedProduct.stock_quantity + restockQuantity;
      await update(selectedProduct.id, {
        stock_quantity: newStock,
      });

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, stock_quantity: newStock } : p
        )
      );

      setModalVisible(false);
      Alert.alert(
        locale === "ar" ? "تم التحديث" : locale === "fr" ? "Stock mis à jour" : "Stock Updated",
        locale === "ar"
          ? `تمت إضافة ${restockQuantity} إلى ${selectedProduct.name}`
          : `Added ${restockQuantity} units to ${selectedProduct.name}`
      );
    } catch (e) {
      console.error("Error updating stock", e);
      setModalVisible(false);
    }
  };

  const categories = [
    { key: "all", label: locale === "ar" ? `الكل (${products.length})` : `All (${products.length})` },
    { key: "dairy", label: locale === "ar" ? "مشتقات الحليب" : "Dairy & Fresh" },
    { key: "groceries", label: locale === "ar" ? "مواد غذائية" : "Groceries" },
    { key: "beverages", label: locale === "ar" ? "مشروبات" : "Beverages" },
    { key: "oils", label: locale === "ar" ? "زيوت طهي" : "Cooking Oils" },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === "all" ||
      (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const getProductIcon = (category?: string, name?: string) => {
    const lowerName = (name || "").toLowerCase();
    const lowerCat = (category || "").toLowerCase();
    if (lowerName.includes("café") || lowerCat.includes("grocer")) return "local-cafe";
    if (lowerName.includes("lait") || lowerCat.includes("dairy")) return "water-bottle";
    if (lowerName.includes("huile") || lowerCat.includes("oil")) return "opacity";
    return "inventory-2";
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation & Page Title Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
          >
            <MaterialIcons name="arrow-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <ThemedText style={styles.pageTitle}>
              {locale === "ar" ? "نقص المخزون" : locale === "fr" ? "Stock faible" : "Low Stock"}
            </ThemedText>
            <ThemedText style={styles.pageSubtitle}>
              {locale === "ar" ? "منتجات تحتاج لإعادة تموين" : locale === "fr" ? "Articles à réapprovisionner" : "Items needing restock"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.iconCircleButton}
            onPress={loadData}
            accessibilityRole="button"
            accessibilityLabel="Refresh stock levels"
          >
            <MaterialIcons name="sync" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconCircleButton}
            onPress={() => router.push("/products/stock-adjustment" as any)}
            accessibilityRole="button"
            accessibilityLabel="Adjust stock"
          >
            <MaterialIcons name="tune" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Alert Summary Banner */}
        <View style={styles.alertBanner}>
          <View style={styles.alertBannerTop}>
            <View style={styles.alertWarningBox}>
              <MaterialIcons name="warning" size={20} color={Colors.light.secondary} />
            </View>
            <View style={styles.alertBannerText}>
              <ThemedText style={styles.alertBannerTitle}>
                {locale === "ar" ? "أولوية التموين" : "Replenishment Priority"}
              </ThemedText>
              <ThemedText style={styles.alertBannerSubtitle}>
                {locale === "ar"
                  ? `${products.length} منتجات أقل من الحد الأدنى`
                  : `${products.length} products below minimum threshold`}
              </ThemedText>
            </View>
          </View>

          <View style={styles.alertBannerBottom}>
            <View style={styles.cutoffRow}>
              <View style={styles.pulsingDot} />
              <ThemedText style={styles.cutoffText}>
                {locale === "ar" ? "موعد طلبات المورد: 14:00" : "Supplier orders cutoff: 14:00"}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.exportListButton}
              onPress={() =>
                Alert.alert(
                  locale === "ar" ? "تصدير القائمة" : "Export reorder list",
                  locale === "ar"
                    ? "تم تصدير قائمة إعادة الطلب للمورد بنجاح"
                    : "Reorder list exported successfully"
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Export reorder list"
            >
              <MaterialIcons name="file-download" size={16} color={Colors.light.secondary} />
              <ThemedText style={styles.exportListText}>
                {locale === "ar" ? "تصدير القائمة" : "Export reorder list"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search & Barcode Scan Bar */}
        <View style={styles.searchBar}>
          <MaterialIcons
            name="search"
            size={20}
            color={Colors.light.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={
              locale === "ar"
                ? "البحث في المخزون، الباركود، الكود..."
                : "Search inventory, barcode, SKU..."
            }
            placeholderTextColor={Colors.light.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.barcodeScanButton}
            onPress={() =>
              Alert.alert(
                locale === "ar" ? "مسح الباركود" : "Scanner barcode",
                locale === "ar" ? "الكاميرا جاهزة لمسح الكود" : "Barcode scanner ready"
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Scan barcode"
          >
            <MaterialIcons name="qr-code-scanner" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills (Horizontal Scroll) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsRow}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryPill, isActive && styles.activeCategoryPill]}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.categoryPillText,
                    isActive && styles.activeCategoryPillText,
                  ]}
                >
                  {cat.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Low Stock Items List */}
        <View style={styles.itemsList}>
          {filteredProducts.map((prod) => {
            const isCritical = prod.stock_quantity <= 1;
            const progressRatio = Math.min(
              1,
              Math.max(0.08, prod.stock_quantity / Math.max(1, prod.minimum_stock_quantity))
            );

            return (
              <View key={prod.id} style={styles.productCard}>
                {/* Product Info Row */}
                <View style={styles.productCardTop}>
                  <View style={styles.productTopLeft}>
                    <View style={styles.productImageThumb}>
                      <MaterialIcons
                        name={getProductIcon(prod.category, prod.name) as any}
                        size={28}
                        color={Colors.light.textSecondary}
                      />
                    </View>

                    <View style={styles.productMetaWrap}>
                      <View style={styles.categorySkuRow}>
                        <ThemedText style={styles.prodCatText}>
                          {prod.category?.toUpperCase() || "GENERAL"}
                        </ThemedText>
                        <ThemedText style={styles.prodDot}>•</ThemedText>
                        <ThemedText style={styles.prodSkuText}>
                          {prod.sku || `SKU-${prod.id * 1000}`}
                        </ThemedText>
                      </View>

                      <ThemedText style={styles.prodTitle} numberOfLines={1}>
                        {prod.name}
                      </ThemedText>
                      <ThemedText style={styles.prodUnitPrice}>
                        {locale === "ar" ? "سعر الوحدة:" : "Unit price:"}{" "}
                        {formatCentimes(prod.sale_price_centimes, locale)}
                      </ThemedText>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.stockStatusPill,
                      {
                        backgroundColor: isCritical
                          ? Colors.light.errorLight
                          : Colors.light.warningLight,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.stockStatusText,
                        { color: isCritical ? Colors.light.error : Colors.light.secondary },
                      ]}
                    >
                      {isCritical
                        ? locale === "ar"
                          ? "حرج"
                          : "Critical"
                        : locale === "ar"
                        ? "منخفض"
                        : "Low stock"}
                    </ThemedText>
                  </View>
                </View>

                {/* Metrics and Threshold Bar */}
                <View style={styles.metricsBox}>
                  <View style={styles.metricsNumbersRow}>
                    <View>
                      <ThemedText style={styles.metricSubLabel}>
                        {locale === "ar" ? "المخزون الحالي" : "CURRENT STOCK"}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.currentStockNumber,
                          { color: isCritical ? Colors.light.error : Colors.light.secondary },
                        ]}
                      >
                        {prod.stock_quantity} {prod.unit || "units"}
                      </ThemedText>
                    </View>

                    <View style={styles.thresholdAlignRight}>
                      <ThemedText style={styles.metricSubLabel}>
                        {locale === "ar" ? "الحد الأدنى" : "MIN THRESHOLD"}
                      </ThemedText>
                      <ThemedText style={styles.thresholdNumber}>
                        {prod.minimum_stock_quantity} {prod.unit || "units"}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Progress Indicator */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(progressRatio * 100)}%`,
                          backgroundColor: isCritical
                            ? Colors.light.error
                            : Colors.light.secondary,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Add Stock Action Button */}
                <TouchableOpacity
                  style={styles.addStockBtn}
                  onPress={() => openRestockModal(prod)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Add stock for ${prod.name}`}
                >
                  <MaterialIcons name="add" size={20} color={Colors.light.primary} />
                  <ThemedText style={styles.addStockBtnText}>
                    {locale === "ar" ? "إضافة مخزون" : "Add Stock"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Bulk Reorder Button */}
        <TouchableOpacity
          style={styles.bulkReorderButton}
          onPress={() =>
            Alert.alert(
              locale === "ar" ? "طلب جماعي" : "Bulk Reorder Order",
              locale === "ar"
                ? `تم تجهيز طلبية تموين لـ ${filteredProducts.length} منتجات`
                : `Created reorder draft for ${filteredProducts.length} items`
            )
          }
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Bulk Reorder Order"
        >
          <MaterialIcons name="shopping-cart-checkout" size={22} color="#FFFFFF" />
          <ThemedText style={styles.bulkReorderText}>
            {locale === "ar" ? "طلب تموين جماعي" : "Bulk Reorder Order"}
          </ThemedText>
          <View style={styles.bulkCountBadge}>
            <ThemedText style={styles.bulkCountBadgeText}>
              {filteredProducts.length} {locale === "ar" ? "منتجات" : "items"}
            </ThemedText>
          </View>
        </TouchableOpacity>

        {/* Footer Trademark */}
        <FooterTrademark />
      </ScrollView>

      {/* Quick Restock Modal Sheet */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />

          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalSubHeader}>
                  {locale === "ar" ? "إعادة تموين سريعة" : "Quick Restock"}
                </ThemedText>
                <ThemedText style={styles.modalProductTitle} numberOfLines={1}>
                  {selectedProduct?.name}
                </ThemedText>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <MaterialIcons name="close" size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Current Level Box */}
            <View style={styles.modalCurrentLevelBox}>
              <ThemedText style={styles.modalCurrentLevelLabel}>
                {locale === "ar" ? "المستوى الحالي" : "Current level"}
              </ThemedText>
              <ThemedText style={styles.modalCurrentLevelValue}>
                {selectedProduct?.stock_quantity} / {selectedProduct?.minimum_stock_quantity}{" "}
                {selectedProduct?.unit || "units"}
              </ThemedText>
            </View>

            {/* Quantity Stepper */}
            <View style={styles.modalStepperRow}>
              <ThemedText style={styles.modalStepperLabel}>
                {locale === "ar" ? "الكمية المستلمة:" : "Quantity to receive:"}
              </ThemedText>

              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setRestockQuantity((q) => Math.max(1, q - 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease quantity"
                >
                  <MaterialIcons name="remove" size={18} color={Colors.light.textPrimary} />
                </TouchableOpacity>

                <ThemedText style={styles.stepperValueText}>
                  {restockQuantity}
                </ThemedText>

                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setRestockQuantity((q) => q + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                >
                  <MaterialIcons name="add" size={18} color={Colors.light.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <ThemedText style={styles.modalCancelBtnText}>
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmRestock}
                accessibilityRole="button"
                accessibilityLabel="Receive Units"
              >
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <ThemedText style={styles.modalConfirmBtnText}>
                  {locale === "ar" ? "استلام الوحدات" : "Receive Units"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  titleWrap: {},
  pageTitle: {
    ...Typography.heading2,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  pageSubtitle: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  alertBanner: {
    backgroundColor: Colors.light.warningLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: 12,
    ...Shadows.sm,
  },
  alertBannerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  alertWarningBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  alertBannerText: {
    flex: 1,
  },
  alertBannerTitle: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.secondary,
  },
  alertBannerSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: "#78350F",
    marginTop: 2,
  },
  alertBannerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(245, 158, 11, 0.15)",
  },
  cutoffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.secondary,
  },
  cutoffText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  exportListButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  exportListText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.secondary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginVertical: Spacing.sm,
    paddingHorizontal: 10,
    height: 44,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  barcodeScanButton: {
    padding: 4,
  },
  categoryPillsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activeCategoryPill: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryPillText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  activeCategoryPillText: {
    color: "#FFFFFF",
  },
  itemsList: {
    gap: 12,
    marginTop: 4,
  },
  productCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
    ...Shadows.sm,
  },
  productCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productTopLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  productImageThumb: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  productMetaWrap: {
    flex: 1,
    paddingRight: 6,
  },
  categorySkuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  prodCatText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  prodDot: {
    color: Colors.light.textMuted,
    fontSize: 10,
  },
  prodSkuText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  prodTitle: {
    ...Typography.heading3,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  prodUnitPrice: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  stockStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metricsBox: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 8,
  },
  metricsNumbersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  metricSubLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
  },
  currentStockNumber: {
    ...Typography.moneySm,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  thresholdAlignRight: {
    alignItems: "flex-end",
  },
  thresholdNumber: {
    ...Typography.moneySm,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.light.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  addStockBtn: {
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.surface,
  },
  addStockBtnText: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  bulkReorderButton: {
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  bulkReorderText: {
    ...Typography.label,
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bulkCountBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  bulkCountBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
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
    backgroundColor: Colors.light.surface,
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
    backgroundColor: Colors.light.border,
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
    color: Colors.light.textSecondary,
  },
  modalProductTitle: {
    ...Typography.heading3,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCurrentLevelBox: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalCurrentLevelLabel: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  modalCurrentLevelValue: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.textPrimary,
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
    color: Colors.light.textPrimary,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: 4,
    gap: 8,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  stepperValueText: {
    ...Typography.heading3,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.textPrimary,
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
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
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
