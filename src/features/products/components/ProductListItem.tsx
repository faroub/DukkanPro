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
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { formatCentimes } from "@/utils/money";

interface ProductListItemProps {
  product: {
    id: number;
    name: string;
    sku: string | null;
    sale_price_centimes: number;
    stock_quantity: number;
    minimum_stock_quantity: number;
    unit: string;
    is_active: boolean;
  };
  onPress: () => void;
}

export function ProductListItem({ product, onPress }: ProductListItemProps) {
  const { t, i18n } = useTranslation();
  const isLowStock = product.stock_quantity <= product.minimum_stock_quantity;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.touchable}
    >
      <ThemedView style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="cube-outline"
            size={24}
            color={Colors.light.textSecondary}
          />
        </View>
        <View style={styles.details}>
          <View style={styles.header}>
            <ThemedText style={styles.name} numberOfLines={1}>
              {product.name}
            </ThemedText>
            <ThemedText style={styles.price}>
              {formatCentimes(
                product.sale_price_centimes,
                i18n.language as any,
              )}
            </ThemedText>
          </View>
          <View style={styles.footer}>
            <ThemedText type="caption" style={styles.subtext} numberOfLines={1}>
              {product.sku || "N/A"} • {product.unit}
            </ThemedText>
            <View style={styles.rightFooter}>
              {isLowStock && (
                <View
                  style={
                    isOutOfStock ? styles.badgeOutOfStock : styles.badgeLowStock
                  }
                >
                  <Ionicons
                    name="warning"
                    size={12}
                    color={
                      isOutOfStock ? Colors.light.error : Colors.light.warning
                    }
                  />
                  <ThemedText
                    style={
                      isOutOfStock
                        ? styles.badgeTextOutOfStock
                        : styles.badgeTextLowStock
                    }
                  >
                    {isOutOfStock
                      ? t("products:outOfStock")
                      : t("products:lowStock")}{" "}
                    ({product.stock_quantity})
                  </ThemedText>
                </View>
              )}
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.light.textMuted}
              />
            </View>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: Spacing.md,
  },
  container: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  details: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  name: {
    ...Typography.heading3,
    fontSize: 16,
    flex: 1,
    marginRight: Spacing.sm,
  },
  price: {
    ...Typography.moneySmall,
    color: Colors.light.primary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtext: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  rightFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  badgeLowStock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  badgeTextLowStock: {
    ...Typography.caption,
    color: Colors.light.warning,
    fontWeight: "600",
  },
  badgeOutOfStock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.errorLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  badgeTextOutOfStock: {
    ...Typography.caption,
    color: Colors.light.error,
    fontWeight: "600",
  },
});
