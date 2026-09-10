import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface ProductRowProps {
  product: {
    id: number;
    name: string;
    sku: string | null;
    sale_price_centimes: number;
    stock_quantity: number;
    minimum_stock_quantity: number;
    unit: string;
    is_active: boolean;
    lowStock?: boolean;
    outOfStock?: boolean;
  };
}

export function ProductRow({ product }: ProductRowProps) {
  const { t } = useTranslation();

  const priceDzd = product.sale_price_centimes / 100;
  const isLowStock = product.lowStock ?? product.stock_quantity <= product.minimum_stock_quantity;
  const isOutOfStock = product.outOfStock ?? product.stock_quantity === 0;

  return (
    <ThemedView style={styles.row} testID={`product-row-${product.id}`}>
      <ThemedView style={styles.leftCell}>
        <ThemedText type="subtitle" style={styles.text}>
          {product.name}
        </ThemedText>
        <ThemedText type="small" style={styles.caption}>
          {product.sku ?? t("common:unknown")}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.centerCell}>
        <ThemedText type="small" style={styles.text}>
          {priceDzd} {t("appText:money")}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.rightCell}>
        <ThemedText type="small" style={styles.caption}>
          {product.stock_quantity} {product.unit}
        </ThemedText>

        {isOutOfStock && (
          <ThemedView style={styles.outOfStockBadge}>
            <ThemedText type="small" style={styles.badge}>
              {t("products:outOfStock")}
            </ThemedText>
          </ThemedView>
        )}

        {isLowStock && !isOutOfStock && (
          <ThemedView style={styles.lowStockBadge}>
            <ThemedText type="small" style={styles.badge}>
              {t("products:lowStock")}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  leftCell: {
    flex: 1,
    minWidth: 0,
  },
  centerCell: {
    flex: 0,
    width: 100,
    textAlign: 'center',
    minWidth: 100,
  },
  rightCell: {
    flex: 0,
    textAlign: 'right',
    minWidth: 60,
  },
  text: {
    fontSize: 14,
  },
  caption: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  badge: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    fontSize: 10,
    marginLeft: Spacing.xs,
  },
  outOfStockBadge: {
    backgroundColor: "#FEF2F2",
  },
  lowStockBadge: {
    backgroundColor: "#FFFBEB",
  },
});