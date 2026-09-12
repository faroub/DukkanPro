import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();

  const priceDzd = product.sale_price_centimes / 100;
  const isLowStock = product.lowStock ?? product.stock_quantity <= product.minimum_stock_quantity;
  const isOutOfStock = product.outOfStock ?? product.stock_quantity === 0;

  return (
    <View style={[styles.row, { borderBottomColor: theme.border, backgroundColor: theme.surface }]} testID={`product-row-${product.id}`}>
      <View style={styles.leftCell}>
        <ThemedText type="subtitle" style={styles.text}>
          {product.name}
        </ThemedText>
        <ThemedText type="small" style={[styles.caption, { color: theme.textSecondary }]}>
          {product.sku ?? t("common:unknown")}
        </ThemedText>
      </View>

      <View style={styles.centerCell}>
        <ThemedText type="small" style={styles.text}>
          {priceDzd} {t("appText:money")}
        </ThemedText>
      </View>

      <View style={styles.rightCell}>
        <ThemedText type="small" style={[styles.caption, { color: theme.textSecondary }]}>
          {product.stock_quantity} {product.unit}
        </ThemedText>

        {isOutOfStock && (
          <View style={[styles.outOfStockBadge, { backgroundColor: theme.errorLight }]}>
            <ThemedText type="small" style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
              {t("products:outOfStock")}
            </ThemedText>
          </View>
        )}

        {isLowStock && !isOutOfStock && (
          <View style={[styles.lowStockBadge, { backgroundColor: theme.warningLight }]}>
            <ThemedText type="small" style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
              {t("products:lowStock")}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    fontSize: 10,
    marginLeft: Spacing.xs,
  },
  outOfStockBadge: {
  },
  lowStockBadge: {
  },
});