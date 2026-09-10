import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { ProductFilterTabs } from "@/features/products/components/ProductFilterTabs";
import { ProductSearchBar } from "@/features/products/components/ProductSearchBar";
import { ProductListItem } from "@/features/products/components/ProductListItem";
import { useProducts } from "@/hooks/useProducts";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

export function ProductListScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const currentNavigation = navigation ?? useNavigation();
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const productsFilters = useMemo(() => {
    const filters: any = {};
    if (filter === "archived") {
      filters.is_active = false;
    } else {
      filters.is_active = true;
    }
    return filters;
  }, [filter]);

  const { products, loading, error, reload } = useProducts(productsFilters);

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

  return (
    <View style={styles.mainContainer}>
      <View style={styles.topBar}>
        <View>
          <ThemedText style={styles.screenTitle}>{t("products:title")}</ThemedText>
          <ThemedText style={styles.screenSubtitle}>{t("products:subtitle")}</ThemedText>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() => (currentNavigation as any)?.push("products/new")}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <ThemedText style={styles.addButtonText}>{t("dashboard:quick:addProduct")}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.textSecondary} />
        }
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <ProductSearchBar onSearch={handleSearch} onClear={() => setSearchQuery("")} disabled={loading} />
          <ProductFilterTabs activeFilter={filter} onFilterChange={handleFilterChange} />
        </View>

        {filteredProducts.length === 0 && !loading && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={Colors.light.textMuted} style={styles.emptyIcon} />
            <ThemedText style={styles.emptyTitle}>{t("products:noProductsInList")}</ThemedText>
            <ThemedText style={styles.emptyDescription}>{t("products:description")}</ThemedText>
          </View>
        )}

        <View style={styles.listContainer}>
          {filteredProducts.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              onPress={() => (currentNavigation as any)?.push(`products/${product.id}`)}
            />
          ))}
        </View>
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
    height: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.button,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  addButtonText: {
    ...Typography.label,
    color: "#FFFFFF",
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  headerSection: {
    marginBottom: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.heading3,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  emptyDescription: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
  },
});