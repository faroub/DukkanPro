import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
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
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();
  const priceDzd = product.sale_price_centimes / 100;
  const isLowStock = product.stock_quantity <= product.minimum_stock_quantity;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.imageArea}>
        <ThemedText type="subtitle" style={styles.name}>
          {product.name}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.details}>
        <ThemedText type="small" style={styles.sku}>
          SKU: {product.sku ?? t("common:unknown")}
        </ThemedText>

        <ThemedText type="small" style={styles.price}>
          {priceDzd} {t("appText:money")}
        </ThemedText>

        <ThemedText type="small" style={styles.stock}>
          Stock: {product.stock_quantity} {product.unit}
        </ThemedText>
      </ThemedView>

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
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  imageArea: {
    height: 80,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'center',
  },
  details: {
    padding: 12,
  },
  sku: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: 600,
    marginBottom: 2,
  },
  stock: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  badge: {
    backgroundColor: Colors.light.borderLight,
    paddingHorizontal: Spacing.xs, // 4px to match Stitch padding 4px 8px
    paddingVertical: Spacing.xs, // 4px
    borderRadius: BorderRadius.sm, // 4px
    fontSize: 12, // Match Stitch badge-label font size
    marginLeft: 4,
    color: Colors.light.warning, // Amber text for low stock badges
  },
  outOfStockBadge: {
    backgroundColor: Colors.light.destructive,
    marginTop: 8,
  },
  lowStockBadge: {
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});