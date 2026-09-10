import { ProductRow } from "@/components/products/ProductRow";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ProductFilterTabs } from "@/features/products/components/ProductFilterTabs";
import { ProductSearchBar } from "@/features/products/components/ProductSearchBar";
import { useProducts } from "@/hooks/useProducts";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

interface ProductListScreenProps {
  route?: any;
  navigation?: any;
}

export function ProductListScreen({
  route,
  navigation,
}: ProductListScreenProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Build filters object from current filter selection
  const productsFilters = useMemo(() => {
    if (filter === "all") {
      return {};
    } else if (filter === "lowStock") {
      return { is_active: true };
    } else if (filter === "outOfStock") {
      return { is_active: true };
    } else if (filter === "archived") {
      return { is_active: false };
    }
    return {};
  }, [filter]);

  const { products, loading, error, reload } = useProducts(productsFilters);

  // Handle filter tab changes
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);

  // Handle search from search bar
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      // When searching, we don't apply the filter state, just search
      setFilter("all");
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    reload();
    setRefreshing(false);
  }, [reload]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText type="small" style={styles.loadingText}>
          {t("loading")}
        </ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText type="small" style={styles.errorText}>
          {t("error")}
        </ThemedText>
        <ThemedText type="small" style={styles.errorRetry}>
          {t("retry")}
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.light.textSecondary}
        />
      }
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <ProductSearchBar
          onSearch={handleSearch}
          onClear={() => {
            // Clear search and reset to all products
            handleSearch("");
          }}
          disabled={loading}
        />

        <ProductFilterTabs
          activeFilter={filter}
          onFilterChange={handleFilterChange}
        />
      </View>

      {products.length === 0 && !loading && !error && (
        <View style={styles.emptyState}>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            {t("products.noProducts")}
          </ThemedText>
          <ThemedText type="small" style={styles.emptyDescription}>
            {t("products.searchNoResults")}
          </ThemedText>
        </View>
      )}

      {/* Summary Metric Strip - matches Stitch design */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryLeft}>
          <ThemedText type="caption" style={styles.summaryLabel}>
            {t("products:totalItems", { count: products.length })}</ThemedText>
          <ThemedText type="body" style={styles.summaryValue}>
            {products.length}
          </ThemedText>
        </View>
        <View style={styles.summaryCenter}>
          <ThemedText type="caption" style={styles.summaryLabel}>
            {t("products:totalValue")}</ThemedText>
          <ThemedText type="body" style={styles.summaryValue}>
            {(products.reduce((sum, p) => sum + (p.sale_price_centimes / 100), 0) || 0).toFixed(0)} {t("appText:money")}
          </ThemedText>
        </View>
        <View style={styles.summaryRight}>
          <ThemedView style={styles.summaryLowStockBadge}>
            <ThemedText type="small" style={styles.badgeText}>
              {t("products:lowStockCount", { count: products.filter(p => p.lowStock || p.stock_quantity <= p.minimum_stock_quantity).length })}
            </ThemedText>
          </ThemedView>
        </View>
      </View>

      <View style={styles.listContainer}>
        {products.map((product) => (
          <ProductRow
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              sku: product.sku,
              sale_price_centimes: product.sale_price_centimes,
              stock_quantity: product.stock_quantity,
              minimum_stock_quantity: product.minimum_stock_quantity,
              unit: product.unit,
              is_active: product.is_active,
              lowStock: product.lowStock,
              outOfStock: product.outOfStock,
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    ...Typography.body,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  summaryStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  summaryCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.md,
    textAlign: "center",
  },
  summaryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  summaryLowStockBadge: {
    backgroundColor: Colors.light.warning,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: 400,
  },
  summaryValue: {
    ...Typography.body,
    color: Colors.light.primary,
    fontWeight: 600,
  },
  listContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    ...Typography.body,
    fontSize: 14,
    color: "#B91C1C",
    marginBottom: 8,
    textAlign: "center",
  },
  errorRetry: {
    ...Typography.body,
    fontSize: 14,
    color: "#1B6B3A",
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.light.surface,
  },
});
