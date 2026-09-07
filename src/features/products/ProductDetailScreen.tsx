import { useRoute } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { executeRead } from '@/database/database';
import { getInventoryHistory } from '@/database/repositories/productRepository';

export default function ProductDetailScreen() {
  const { params } = useRoute() as { params: { id: string } };
  const productId = Number(params?.id);
  const { t } = useTranslation();
  const [product, setProduct] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        const rows: any[] = await executeRead(
          // language=SQLite
          `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
               stock_quantity, minimum_stock_quantity, unit, is_active,
               created_at, updated_at
           FROM products
           WHERE id = ?`,
          [productId],
        );
        if (rows.length > 0) {
          setProduct(rows[0]);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      }
    };

    const loadInventory = async () => {
      setRefreshing(true);
      try {
        const history = await getInventoryHistory(productId);
        setInventory(history);
      } catch (err) {
        console.error('Failed to load inventory history:', err);
      } finally {
        setRefreshing(false);
      }
    };

    loadProduct();
    loadInventory();
  }, [productId]);

  useEffect(() => {
    if (!productId) return;

    const loadInventory = async () => {
      setRefreshing(true);
      try {
        const history = await getInventoryHistory(productId);
        setInventory(history);
      } catch (err) {
        console.error('Failed to load inventory history:', err);
      } finally {
        setRefreshing(false);
      }
    };

    loadInventory();
  }, [productId]);

  if (!product) {
    return (
      <ThemedView type="background" style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                const loadInventory = async () => {
                  const history = await getInventoryHistory(productId);
                  setInventory(history);
                  setRefreshing(false);
                };
                loadInventory();
              }}
              tintColor={Colors.light.textSecondary}
            />
          }
          style={styles.scroll}
        >
          <ThemedView style={styles.content}>
            <ThemedText type="subtitle" style={styles.placeholder}>
              {t('products:loadingProduct')}
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              const loadInventory = async () => {
                const history = await getInventoryHistory(productId);
                setInventory(history);
                setRefreshing(false);
              };
              loadInventory();
            }}
            tintColor={Colors.light.textSecondary}
          />
        }
        style={styles.scroll}
      >
        <ThemedView style={styles.content}>
          {product.name && (
            <ThemedText type="title" style={styles.title}>
              {product.name}
            </ThemedText>
          )}

          {product.sku && (
            <ThemedText type="small" style={styles.detailLabel}>
              {t('products:sku')}: {product.sku}
            </ThemedText>
          )}

          {product.category && (
            <ThemedText type="small" style={styles.detailLabel}>
              {t('products:category')}: {product.category}
            </ThemedText>
          )}

          <ThemedText type="small" style={styles.detailLabel}>
            {t('products:salePrice')}: {(product.sale_price_centimes / 100).toFixed(2)} {t('appText:money')}
          </ThemedText>

          <ThemedText type="small" style={styles.detailLabel}>
            {t('products:costPrice')}: {(product.cost_price_centimes / 100).toFixed(2)} {t('appText:money')}
          </ThemedText>

          <ThemedText type="small" style={styles.detailLabel}>
            {t('products:stock')}: {product.stock_quantity} {product.unit}
          </ThemedText>

          <ThemedText type="small" style={styles.detailLabel}>
            {t('products:minimumStock')}: {product.minimum_stock_quantity}
          </ThemedText>

          {product.is_active && (
            <ThemedText type="small" style={styles.detailLabel}>
              {t('products:archived')}: No (active)
            </ThemedText>
          )}

          {!product.is_active && (
            <ThemedText type="small" style={styles.detailLabel}>
              {t('products:archived')}: Yes (archived)
            </ThemedText>
          )}

          <ThemedText type="small" style={styles.sectionTitle}>
            {t('products:inventoryHistory')}
          </ThemedText>

          {inventory.length === 0 ? (
            <ThemedText type="small" style={styles.emptyState}>
              {t('common:noData')}
            </ThemedText>
          ) : (
            <View style={styles.inventoryList}>
              {inventory.map((movement: any) => (
                <ThemedView style={styles.inventoryRow} key={movement.id}>
                  <ThemedText type="small" style={styles.inventoryType}>
                    {t(
                      movement.movement_type === 'in'
                        ? 'products:movementIn'
                        : movement.movement_type === 'out'
                          ? 'products:movementOut'
                          : 'products:movementAdjustment'
                    )}
                  </ThemedText>
                  <ThemedText type="small" style={styles.inventoryQty}>
                    {movement.quantity_change > 0 ? `+${movement.quantity_change}` : movement.quantity_change} {product.unit}
                  </ThemedText>
                  <ThemedText type="small" style={styles.inventoryNote}>
                    {movement.note || t('common:noNote')}
                  </ThemedText>
                  <ThemedText type="small" style={styles.inventoryDate}>
                    {new Date(movement.created_at).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
              ))}
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 24,
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 500,
    marginTop: 20,
    marginBottom: 12,
    color: '#374151',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    color: Colors.light.textSecondary,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    color: Colors.light.textSecondary,
  },
  inventoryList: {
    marginTop: 16,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    backgroundColor: 'white',
  },
  inventoryType: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  inventoryQty: {
    fontSize: 12,
    color: Colors.light.textPrimary,
    fontWeight: 500,
  },
  inventoryNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginHorizontal: 4,
  },
  inventoryDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});