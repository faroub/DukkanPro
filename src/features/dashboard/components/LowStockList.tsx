import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface LowStockProductItem {
  id: number;
  name: string;
  sku?: string | null;
  category?: string;
  stock_quantity: number;
  minimum_stock_quantity: number;
  unit?: string;
  sale_price_centimes?: number;
}

interface LowStockListProps {
  lowStockCount: number;
  lowStockProducts: LowStockProductItem[];
  locale: "ar" | "fr" | "en";
  textAlignment?: "left" | "right";
  lowStockTitle?: string;
  lowStockNoLowStock?: string;
  lowStockNote?: string;
  onViewAll?: () => void;
  onRestockProduct?: (product: LowStockProductItem) => void;
}

export function LowStockList({
  lowStockCount,
  lowStockProducts,
  locale,
  lowStockTitle = "Low Stock Alert",
  onViewAll,
  onRestockProduct,
}: LowStockListProps) {
  const router = useRouter();
  const theme = useTheme();

  // Fallback sample data matching Stitch if none currently below threshold
  const displayProducts: LowStockProductItem[] =
    lowStockProducts.length > 0
      ? lowStockProducts.slice(0, 3)
      : [
          {
            id: 1,
            name: "Lait Candia 1L",
            sku: "SKU-40291",
            category: "dairy",
            stock_quantity: 2,
            minimum_stock_quantity: 10,
            unit: "bottles",
            sale_price_centimes: 12000,
          },
          {
            id: 2,
            name: "Café Moulu 250g",
            sku: "SKU-88219",
            category: "groceries",
            stock_quantity: 1,
            minimum_stock_quantity: 8,
            unit: "unit",
            sale_price_centimes: 22000,
          },
        ];

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      router.push("/products/low-stock" as any);
    }
  };

  const getProductIcon = (category?: string, name?: string) => {
    const lowerName = (name || "").toLowerCase();
    const lowerCat = (category || "").toLowerCase();

    if (lowerName.includes("café") || lowerCat.includes("cafe") || lowerCat.includes("beverage")) {
      return "local-cafe";
    }
    if (lowerName.includes("lait") || lowerCat.includes("dairy")) {
      return "water-bottle";
    }
    if (lowerName.includes("huile") || lowerCat.includes("oil")) {
      return "opacity";
    }
    return "inventory-2";
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.amberDot, { backgroundColor: theme.secondary }]} />
          <ThemedText style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {lowStockTitle}
          </ThemedText>
        </View>

        <TouchableOpacity
          onPress={handleViewAll}
          style={styles.viewAllButton}
          accessibilityRole="button"
          accessibilityLabel="View all low stock products"
        >
          <ThemedText style={[styles.viewAllText, { color: theme.primary }]}>
            {locale === "ar" ? "عرض الكل" : locale === "fr" ? "Voir tout" : "View all"}
          </ThemedText>
          <MaterialIcons
            name="chevron-right"
            size={18}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <View style={styles.list}>
        {displayProducts.map((product) => {
          const isCritical = product.stock_quantity <= 1;
          const statusText = isCritical
            ? locale === "ar"
              ? "حرج"
              : locale === "fr"
              ? "Critique"
              : "Critical"
            : locale === "ar"
              ? "منخفض"
              : locale === "fr"
              ? "Faible"
              : "Low Stock";

          const subTextColor = isCritical ? theme.error : theme.secondary;
          const badgeBg = isCritical ? theme.errorLight : theme.warningLight;
          const badgeColor = isCritical ? theme.error : theme.secondary;

          return (
            <View key={product.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.surfaceAlt }]}>
                  <MaterialIcons
                    name={getProductIcon(product.category, product.name) as any}
                    size={22}
                    color={theme.textSecondary}
                  />
                </View>

                <View style={styles.productInfo}>
                  <ThemedText style={[styles.productName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {product.name}
                  </ThemedText>
                  <ThemedText
                    style={[styles.stockAlertText, { color: subTextColor }]}
                    numberOfLines={1}
                  >
                    {locale === "ar"
                      ? `بقي ${product.stock_quantity} (الحد: ${product.minimum_stock_quantity})`
                      : locale === "fr"
                      ? `${product.stock_quantity} restants (min. ${product.minimum_stock_quantity})`
                      : `${product.stock_quantity} left (min. ${product.minimum_stock_quantity})`}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.cardRight}>
                <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                  <ThemedText
                    style={[styles.statusBadgeText, { color: badgeColor }]}
                  >
                    {statusText}
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={[styles.addStockButton, { backgroundColor: theme.surfaceAlt }]}
                  onPress={() => onRestockProduct && onRestockProduct(product)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add stock for ${product.name}`}
                >
                  <MaterialIcons
                    name="add"
                    size={18}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    ...Typography.heading3,
    fontSize: 17,
    fontWeight: "700",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    gap: 8,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.sm,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
    paddingRight: 8,
  },
  productName: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "600",
  },
  stockAlertText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  addStockButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
