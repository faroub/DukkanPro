import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { Typography } from "@/constants/theme";
import { useProducts } from "@/hooks/useProducts";
import { ProductSearchBar } from "@/features/products/components/ProductSearchBar";
import { ProductFilterTabs } from "@/features/products/components/ProductFilterTabs";
import { ProductRow } from "@/components/products/ProductRow";

interface ProductListScreenProps {
  route?: any;
  navigation?: any;
}

export function ProductListScreen({ route, navigation }: ProductListScreenProps) {
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
          {t("common:loading")}
        </ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText type="small" style={styles.errorText}>
          {t("common:error")}
        </ThemedText>
        <ThemedText type="small" style={styles.errorRetry}>
          {t("common:retry")}
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
          tintColor="#6B7280"
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
            {t("products:noProducts")}
          </ThemedText>
          <ThemedText type="small" style={styles.emptyDescription}>
            {t("products:searchNoResults")}
          </ThemedText>
        </View>
      )}

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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    ...Typography.body,
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.body,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    ...Typography.body,
    fontSize: 14,
    color: '#B91C1C',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorRetry: {
    ...Typography.body,
    fontSize: 14,
    color: '#1B6B3A',
  },
  listContainer: {
    paddingBottom: 100,
  },
});