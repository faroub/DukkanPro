import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { formatCentimes } from "@/utils/money";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export interface SelectorProductItem {
  id: number;
  name: string;
  category?: string;
  price_centimes: number;
  stock: number;
}

interface ProductSelectorProps {
  products: SelectorProductItem[];
  selectedProductIds: Set<number>;
  onToggleProduct: (productId: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  showPrices: boolean;
  hideOutOfStock: boolean;
  onProceedToPreview: () => void;
  onBack: () => void;
}

export function ProductSelector({
  products,
  selectedProductIds,
  onToggleProduct,
  onSelectAll,
  onDeselectAll,
  showPrices,
  hideOutOfStock,
  onProceedToPreview,
  onBack,
}: ProductSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products based on search query and out-of-stock setting
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (hideOutOfStock && p.stock <= 0) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = p.category ? p.category.toLowerCase().includes(q) : false;
      return matchName || matchCat;
    });
  }, [products, searchQuery, hideOutOfStock]);

  const selectedCount = selectedProductIds.size;

  const getCategoryIcon = (category?: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("lait") || cat.includes("dairy") || cat.includes("boisson") || cat.includes("beverage")) {
      return "local-drink";
    }
    if (cat.includes("pain") || cat.includes("bakery") || cat.includes("boulange")) {
      return "bakery-dining";
    }
    if (cat.includes("café") || cat.includes("coffee") || cat.includes("thé")) {
      return "coffee";
    }
    if (cat.includes("huile") || cat.includes("oil") || cat.includes("épice")) {
      return "kitchen";
    }
    return "shopping-bag";
  };

  return (
    <View style={styles.container} id="product-selector-screen">
      {/* Top Bar */}
      <View style={styles.topBar} id="product-selector-topbar">
        <TouchableOpacity
          onPress={onBack}
          style={styles.circleBackButton}
          activeOpacity={0.7}
          id="product-selector-back-btn"
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={Colors.light.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.titleColumn}>
          <ThemedText style={styles.screenTitle}>
            {t("catalogue.selectProductsTitle")}
          </ThemedText>
          <ThemedText style={styles.screenSubtitle}>
            {t("catalogue.selectProductsSubtitle")}
          </ThemedText>
        </View>
      </View>

      {/* Control Bar (Counter, Select All/Deselect, Search) */}
      <View style={styles.controlBar} id="product-selector-control-bar">
        <View style={styles.counterRow}>
          <View style={styles.counterBadge}>
            <View style={styles.pulseDot} />
            <ThemedText style={styles.counterText}>
              {selectedCount} {t("catalogue.productsSelected")}
            </ThemedText>
          </View>

          <View style={styles.bulkActions}>
            <TouchableOpacity
              onPress={onSelectAll}
              activeOpacity={0.7}
              id="btn-select-all"
            >
              <ThemedText style={styles.bulkActionText}>
                {t("catalogue.selectAll")}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.bulkDot}>•</ThemedText>
            <TouchableOpacity
              onPress={onDeselectAll}
              activeOpacity={0.7}
              id="btn-deselect-all"
            >
              <ThemedText style={styles.bulkActionText}>
                {t("catalogue.deselect")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer} id="product-search-container">
          <MaterialIcons
            name="search"
            size={20}
            color={Colors.light.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("catalogue.searchPlaceholder")}
            placeholderTextColor={Colors.light.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            id="input-product-search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearSearchButton}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="close"
                size={18}
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        id="product-selector-list"
        ListEmptyComponent={
          <View style={styles.emptyState} id="product-selector-empty">
            <View style={styles.emptyIconCircle}>
              <MaterialIcons
                name="search-off"
                size={36}
                color={Colors.light.textSecondary}
              />
            </View>
            <ThemedText style={styles.emptyTitle}>
              {t("catalogue.noProductsFound")}
            </ThemedText>
            <ThemedText style={styles.emptyDesc}>
              {t("catalogue.noProductsFoundDesc")}
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = selectedProductIds.has(item.id);
          const isAvailable = item.stock > 0;

          return (
            <TouchableOpacity
              style={[
                styles.productCard,
                isSelected && styles.productCardSelected,
              ]}
              onPress={() => onToggleProduct(item.id)}
              activeOpacity={0.75}
              id={`product-item-${item.id}`}
            >
              {/* Custom Checkbox */}
              <View
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}
              >
                {isSelected && (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>

              {/* Product Thumbnail / Category Icon */}
              <View style={styles.thumbnail}>
                <MaterialIcons
                  name={getCategoryIcon(item.category)}
                  size={24}
                  color={Colors.light.primary}
                />
              </View>

              {/* Info Column (Only public data: Name, Price, Category, Availability) */}
              <View style={styles.infoCol}>
                <View style={styles.infoTopRow}>
                  <ThemedText style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                  {showPrices && (
                    <ThemedText style={styles.productPrice}>
                      {formatCentimes(item.price_centimes)}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.infoBottomRow}>
                  <ThemedText style={styles.productCategory}>
                    {item.category || "Général"}
                  </ThemedText>
                  <View
                    style={[
                      styles.availabilityBadge,
                      isAvailable
                        ? styles.badgeAvailable
                        : styles.badgeOutOfStock,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.availabilityText,
                        isAvailable
                          ? styles.textAvailable
                          : styles.textOutOfStock,
                      ]}
                    >
                      {isAvailable
                        ? t("catalogue.available")
                        : t("catalogue.outOfStock")}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Bottom Action Dock */}
      <View style={styles.bottomDock} id="product-selector-bottom-dock">
        <TouchableOpacity
          style={[
            styles.previewButton,
            selectedCount === 0 && styles.previewButtonDisabled,
          ]}
          onPress={onProceedToPreview}
          disabled={selectedCount === 0}
          activeOpacity={0.8}
          id="btn-preview-catalogue"
        >
          <ThemedText style={styles.previewButtonText}>
            {t("catalogue.previewCatalogueBtn")} ({selectedCount})
          </ThemedText>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={onBack}
          activeOpacity={0.7}
          id="btn-back-to-settings"
        >
          <ThemedText style={styles.backLinkText}>
            {t("catalogue.backToSettings")}
          </ThemedText>
        </TouchableOpacity>
      </View>
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
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  circleBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  titleColumn: {
    flex: 1,
  },
  screenTitle: {
    ...Typography.heading2,
    color: Colors.light.textPrimary,
  },
  screenSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  controlBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  counterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  counterText: {
    ...Typography.badge,
    color: Colors.light.primary,
  },
  bulkActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  bulkActionText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  bulkDot: {
    color: Colors.light.textMuted,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
    color: Colors.light.textPrimary,
    height: "100%",
  },
  clearSearchButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: Spacing.md,
  },
  productCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "#FFFFFF",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  thumbnail: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCol: {
    flex: 1,
    justifyContent: "center",
  },
  infoTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  productName: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  productPrice: {
    ...Typography.moneySm,
    color: Colors.light.primary,
    fontWeight: "700",
  },
  infoBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productCategory: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  badgeAvailable: {
    backgroundColor: Colors.light.primaryLight,
  },
  badgeOutOfStock: {
    backgroundColor: Colors.light.errorLight,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  textAvailable: {
    color: Colors.light.primary,
  },
  textOutOfStock: {
    color: Colors.light.error,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxxl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  emptyDesc: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    gap: Spacing.sm,
  },
  previewButton: {
    height: 50,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  previewButtonDisabled: {
    backgroundColor: Colors.light.disabledBackground,
  },
  previewButtonText: {
    ...Typography.body,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  backLink: {
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backLinkText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
});
