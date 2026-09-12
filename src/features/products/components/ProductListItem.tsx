import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  Colors,
  BorderRadius,
  Spacing,
  Shadows,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { formatCentimes } from "@/utils/money";

interface ProductListItemProps {
  product: {
    id: number;
    name: string;
    sku: string | null;
    category?: string | null;
    sale_price_centimes: number;
    stock_quantity: number;
    minimum_stock_quantity: number;
    unit: string;
    is_active: boolean;
  };
  onPress: () => void;
}

export function ProductListItem({ product, onPress }: ProductListItemProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = !isOutOfStock && product.stock_quantity <= product.minimum_stock_quantity;

  const categoryOrUnit = product.category || product.unit || t("products:unitPiece");

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.touchable}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.stock_quantity} ${product.unit}`}
    >
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        {/* Visual Thumbnail Box */}
        <View style={[styles.thumbnailBox, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons
            name="cube-outline"
            size={22}
            color={theme.primary}
          />
        </View>

        {/* Content Details */}
        <View style={styles.contentCol}>
          {/* Header Row: Title & Price */}
          <View style={styles.titleRow}>
            <ThemedText style={[styles.productName, { color: theme.textPrimary }]} numberOfLines={1}>
              {product.name}
            </ThemedText>
            <ThemedText style={[styles.priceText, { color: theme.primary }]}>
              {formatCentimes(product.sale_price_centimes, i18n.language as any)}
            </ThemedText>
          </View>

          {/* Subtitle Row: SKU & Category */}
          <View style={styles.metaRow}>
            <ThemedText style={[styles.skuText, { color: theme.textMuted }]}>
              {product.sku ? product.sku : `ID-${product.id}`}
            </ThemedText>
            <ThemedText style={[styles.dotSeparator, { color: theme.textMuted }]}>•</ThemedText>
            <ThemedText style={[styles.categoryText, { color: theme.textSecondary }]} numberOfLines={1}>
              {categoryOrUnit}
            </ThemedText>
          </View>

          {/* Bottom Row: Stock Quantity & Status Badge */}
          <View style={styles.stockRow}>
            <ThemedText style={[styles.stockLabel, { color: theme.textSecondary }]}>
              {t("products:stockLabel")}:{" "}
              <ThemedText style={[styles.stockValue, { color: theme.textPrimary }]}>
                {product.stock_quantity} {product.unit || "pcs"}
              </ThemedText>
            </ThemedText>

            {/* Status Badges with circular indicator dots */}
            {isOutOfStock ? (
              <View style={[styles.badgeOutOfStock, { backgroundColor: theme.errorLight }]}>
                <View style={[styles.dotError, { backgroundColor: theme.error }]} />
                <ThemedText style={[styles.badgeTextOutOfStock, { color: theme.error }]}>
                  {t("products:outOfStock")}
                </ThemedText>
              </View>
            ) : isLowStock ? (
              <View style={[styles.badgeLowStock, { backgroundColor: theme.warningLight }]}>
                <View style={[styles.dotWarning, { backgroundColor: theme.warning }]} />
                <ThemedText style={[styles.badgeTextLowStock, { color: theme.warning }]}>
                  {t("products:lowStock")} ({t("products:minThreshold")}: {product.minimum_stock_quantity})
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.badgeInStock, { backgroundColor: theme.primaryLight }]}>
                <View style={[styles.dotSuccess, { backgroundColor: theme.primary }]} />
                <ThemedText style={[styles.badgeTextInStock, { color: theme.primary }]}>
                  {t("products:inStock")}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Right Action Chevron */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.textMuted}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: Spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  thumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  productName: {
    ...Typography.label,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    flex: 1,
  },
  priceText: {
    ...Typography.moneySm,
    color: Colors.light.primary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 6,
  },
  skuText: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  dotSeparator: {
    color: Colors.light.textMuted,
    fontSize: 10,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  stockLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  stockValue: {
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  badgeLowStock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 5,
  },
  badgeTextLowStock: {
    ...Typography.badge,
    color: Colors.light.secondary,
  },
  dotWarning: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.secondary,
  },
  badgeOutOfStock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 5,
  },
  badgeTextOutOfStock: {
    ...Typography.badge,
    color: Colors.light.error,
  },
  dotError: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.error,
  },
  badgeInStock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 5,
  },
  badgeTextInStock: {
    ...Typography.badge,
    color: Colors.light.primary,
  },
  dotSuccess: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  chevron: {
    marginLeft: 6,
  },
});

