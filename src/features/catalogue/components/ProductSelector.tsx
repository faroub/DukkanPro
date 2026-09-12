import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
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
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.background }]} id="product-selector-screen">
      {/* Top Bar */}
      <View style={styles.topBar} id="product-selector-topbar">
        <TouchableOpacity
          onPress={onBack}
          style={[styles.circleBackButton, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}
          activeOpacity={0.7}
          id="product-selector-back-btn"
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.titleColumn}>
          <ThemedText style={[styles.screenTitle, { color: theme.textPrimary }]}>
            {t("catalogue.selectProductsTitle")}
          </ThemedText>
          <ThemedText style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            {t("catalogue.selectProductsSubtitle")}
          </ThemedText>
        </View>
      </View>

      {/* Control Bar (Counter, Select All/Deselect, Search) */}
      <View style={styles.controlBar} id="product-selector-control-bar">
        <View style={styles.counterRow}>
          <View style={[styles.counterBadge, { backgroundColor: theme.primaryLight }]}>
            <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
            <ThemedText style={[styles.counterText, { color: theme.primary }]}>
              {selectedCount} {t("catalogue.productsSelected")}
            </ThemedText>
          </View>

          <View style={styles.bulkActions}>
            <TouchableOpacity
              onPress={onSelectAll}
              activeOpacity={0.7}
              id="btn-select-all"
            >
              <ThemedText style={[styles.bulkActionText, { color: theme.primary }]}>
                {t("catalogue.selectAll")}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={{ color: theme.textMuted }}>•</ThemedText>
            <TouchableOpacity
              onPress={onDeselectAll}
              activeOpacity={0.7}
              id="btn-deselect-all"
            >
              <ThemedText style={[styles.bulkActionText, { color: theme.primary }]}>
                {t("catalogue.deselect")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]} id="product-search-container">
          <MaterialIcons
            name="search"
            size={20}
            color={theme.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={t("catalogue.searchPlaceholder")}
            placeholderTextColor={theme.textMuted}
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
                color={theme.textSecondary}
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
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons
                name="search-off"
                size={36}
                color={theme.textSecondary}
              />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {t("catalogue.noProductsFound")}
            </ThemedText>
            <ThemedText style={[styles.emptyDesc, { color: theme.textSecondary }]}>
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
                { backgroundColor: theme.surface, borderColor: isSelected ? theme.primary : "transparent" },
              ]}
              onPress={() => onToggleProduct(item.id)}
              activeOpacity={0.75}
              id={`product-item-${item.id}`}
            >
              {/* Custom Checkbox */}
              <View
                style={[
                  styles.checkbox,
                  { backgroundColor: isSelected ? theme.primary : theme.surfaceAlt, borderColor: isSelected ? theme.primary : theme.border },
                ]}
              >
                {isSelected && (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>

              {/* Product Thumbnail / Category Icon */}
              <View style={[styles.thumbnail, { backgroundColor: theme.surfaceAlt }]}>
                <MaterialIcons
                  name={getCategoryIcon(item.category)}
                  size={24}
                  color={theme.primary}
                />
              </View>

              {/* Info Column */}
              <View style={styles.infoCol}>
                <View style={styles.infoTopRow}>
                  <ThemedText style={[styles.productName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                  {showPrices && (
                    <ThemedText style={[styles.productPrice, { color: theme.primary }]}>
                      {formatCentimes(item.price_centimes)}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.infoBottomRow}>
                  <ThemedText style={[styles.productCategory, { color: theme.textSecondary }]}>
                    {item.category || "Général"}
                  </ThemedText>
                  <View
                    style={[
                      styles.availabilityBadge,
                      isAvailable
                        ? { backgroundColor: theme.primaryLight }
                        : { backgroundColor: theme.errorLight },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.availabilityText,
                        isAvailable
                          ? { color: theme.primary }
                          : { color: theme.error },
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
      <View style={[styles.bottomDock, { backgroundColor: theme.surface, borderTopColor: theme.borderLight }]} id="product-selector-bottom-dock">
        <TouchableOpacity
          style={[
            styles.previewButton,
            { backgroundColor: selectedCount === 0 ? theme.disabledBackground : theme.primary },
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
          <ThemedText style={[styles.backLinkText, { color: theme.textSecondary }]}>
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  titleColumn: {
    flex: 1,
  },
  screenTitle: {
    ...Typography.heading2,
  },
  screenSubtitle: {
    ...Typography.caption,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  counterText: {
    ...Typography.badge,
  },
  bulkActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  bulkActionText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
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
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
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
    flex: 1,
    paddingRight: Spacing.sm,
  },
  productPrice: {
    ...Typography.moneySm,
    fontWeight: "700",
  },
  infoBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productCategory: {
    ...Typography.caption,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: "600",
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.heading3,
    marginBottom: 4,
  },
  emptyDesc: {
    ...Typography.caption,
    textAlign: "center",
    maxWidth: 260,
  },
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  previewButton: {
    height: 50,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
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
    fontWeight: "600",
  },
});
