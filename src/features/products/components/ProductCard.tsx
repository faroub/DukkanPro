import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
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
        <ThemedText type="caption" style={styles.sku}>
          SKU: {product.sku ?? t("common:unknown")}
        </ThemedText>

        <ThemedText type="caption" style={styles.price}>
          {priceDzd} {t("appText:money")}
        </ThemedText>

        <ThemedText type="caption" style={styles.stock}>
          Stock: {product.stock_quantity} {product.unit}
        </ThemedText>
      </ThemedView>

      {isOutOfStock && (
        <ThemedView style={styles.outOfStockBadge}>
          <ThemedText type="caption" style={styles.badge}>
            {t("products:outOfStock")}
          </ThemedText>
        </ThemedView>
      )}

      {isLowStock && !isOutOfStock && (
        <ThemedView style={styles.lowStockBadge}>
          <ThemedText type="caption" style={styles.badge}>
            {t("products:lowStock")}
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  imageArea: {
    height: 80,
    backgroundColor: '#F0F0F3',
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
    color: '#6B7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#1B6B3A',
    fontWeight: 600,
    marginBottom: 2,
  },
  stock: {
    fontSize: 12,
    color: '#6B7280',
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    marginLeft: 4,
  },
  outOfStockBadge: {
    backgroundColor: '#EF4444',
    marginTop: 8,
  },
  lowStockBadge: {
    backgroundColor: '#F59E0B',
    marginTop: 8,
  },
});