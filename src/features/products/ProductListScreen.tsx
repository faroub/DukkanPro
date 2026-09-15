import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatCentimes } from "@/utils/money";
import { ProductFilterTabs } from "@/features/products/components/ProductFilterTabs";
import { ProductSearchBar } from "@/features/products/components/ProductSearchBar";
import { ProductListItem } from "@/features/products/components/ProductListItem";
import { useProducts } from "@/hooks/useProducts";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshControl, ScrollView, StyleSheet, View, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export function ProductListScreen({ route, navigation }: any) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all products (both active and inactive so counts can be computed accurately)
  const { products, loading, error, reload } = useProducts({});

  // Compute counts for filter pills
  const counts = useMemo(() => {
    let all = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let archived = 0;

    for (const p of products) {
      if (!p.is_active) {
        archived++;
      } else {
        all++;
        if (p.stock_quantity === 0) {
          outOfStock++;
        } else if (p.stock_quantity <= p.minimum_stock_quantity) {
          lowStock++;
        }
      }
    }

    return { all, lowStock, outOfStock, archived };
  }, [products]);

  const totalInventoryValueCentimes = useMemo(() => {
    return products
      .filter((p) => p.is_active)
      .reduce((sum, p) => {
        const price = p.cost_price_centimes > 0 ? p.cost_price_centimes : p.sale_price_centimes;
        return sum + price * Math.max(0, p.stock_quantity);
      }, 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku && p.sku.toLowerCase().includes(query);
        if (!matchesName && !matchesSku) return false;
      }

      if (filter === "lowStock") {
        return p.is_active && p.stock_quantity <= p.minimum_stock_quantity && p.stock_quantity > 0;
      } else if (filter === "outOfStock") {
        return p.is_active && p.stock_quantity === 0;
      } else if (filter === "archived") {
        return !p.is_active;
      } else {
        return p.is_active;
      }
    });
  }, [products, searchQuery, filter]);

  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    reload();
    setRefreshing(false);
  }, [reload]);

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      {/* Top Header Bar matching Stitch */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
        <View style={styles.topBarLeft}>
          <ThemedText style={[styles.screenTitle, { color: theme.textPrimary }]}>{t("products:title")}</ThemedText>
          <ThemedText style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            {t("products:inventoryTracker")}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
          onPress={() => router.push("/products/new" as any)}
          accessibilityRole="button"
          accessibilityLabel={t("products:newItem")}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <ThemedText style={styles.addButtonText}>{t("products:newItem")}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar & Filter Tabs */}
        <View style={styles.headerSection}>
          <ProductSearchBar
            onSearch={handleSearch}
            onClear={() => setSearchQuery("")}
            disabled={loading}
          />
          <ProductFilterTabs
            activeFilter={filter}
            onFilterChange={handleFilterChange}
            counts={counts}
          />
        </View>

        {/* Summary Metric Strip - matches Stitch design */}
        <View style={[styles.summaryStrip, { backgroundColor: theme.surfaceAlt }]}>
          <View style={styles.summaryLeft}>
            <View style={[styles.summaryDot, { backgroundColor: theme.primary }]} />
            <ThemedText style={[styles.summaryItemsText, { color: theme.textPrimary }]}>
              {filteredProducts.length} {t("products:items")}
            </ThemedText>
          </View>

          <ThemedText style={[styles.summaryDotSeparator, { color: theme.textMuted }]}>•</ThemedText>

          <View style={styles.summaryCenter}>
            <ThemedText style={[styles.summaryValueLabel, { color: theme.textSecondary }]}>
              {t("products:value")}:{" "}
              <ThemedText style={[styles.summaryValueAmount, { color: theme.primary }]}>
                {formatCentimes(totalInventoryValueCentimes, i18n.language as any)}
              </ThemedText>
            </ThemedText>
          </View>

          {counts.lowStock > 0 && (
            <>
              <ThemedText style={[styles.summaryDotSeparator, { color: theme.textMuted }]}>•</ThemedText>
              <View style={[styles.badgeContainer, { backgroundColor: theme.warningLight }]}>
                <Ionicons name="warning" size={12} color={theme.warning} />
                <ThemedText style={[styles.badgeText, { color: theme.warning }]}>
                  {counts.lowStock} {t("products:lowStock")}
                </ThemedText>
              </View>
            </>
          )}
        </View>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && !error && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="cube-outline" size={40} color={theme.textMuted} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t("products:noProductsInList")}</ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: theme.textSecondary }]}>{t("products:description")}</ThemedText>
          </View>
        )}

        {/* Products List */}
        <View style={styles.listContainer}>
          {filteredProducts.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              onPress={() =>
                router.push({
                  pathname: "/products/[id]",
                  params: { id: String(product.id) },
                })
              }
            />
          ))}
        </View>

        {/* Footer Trademark */}
        <FooterTrademark />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  topBarLeft: {
    flex: 1,
  },
  screenTitle: {
    ...Typography.heading1,
    color: Colors.light.textPrimary,
  },
  screenSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.button,
    gap: 4,
    ...Shadows.sm,
  },
  addButtonText: {
    ...Typography.label,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  headerSection: {
    marginBottom: Spacing.xs,
  },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    gap: 8,
    flexWrap: "wrap",
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  summaryItemsText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  summaryDotSeparator: {
    color: Colors.light.textMuted,
    fontSize: 10,
  },
  summaryCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryValueLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  summaryValueAmount: {
    fontWeight: "700",
    color: Colors.light.primary,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  badgeText: {
    ...Typography.badge,
    color: Colors.light.secondary,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  listContainer: {
    flex: 1,
  },
});
