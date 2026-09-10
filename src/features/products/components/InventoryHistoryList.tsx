import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { getInventoryHistory } from '@/database/repositories/productRepository';

export interface InventoryHistoryListProps {
  productId: number;
  productName: string;
  height?: number;
}

export function InventoryHistoryList({
  productId,
  productName,
  height = 200,
}: InventoryHistoryListProps) {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadInventory = useCallback(async () => {
    setRefreshing(true);
    try {
      const history = await getInventoryHistory(productId);
      setInventory(history);
    } catch (err) {
      console.error('Failed to load inventory history:', err);
    } finally {
      setRefreshing(false);
    }
  }, [productId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const renderMovement = (movement: any) => {
    const movementTypeKey = movement.movement_type === 'in'
      ? 'products:movementIn'
      : movement.movement_type === 'out'
        ? 'products:movementOut'
        : 'products:movementAdjustment';

    return (
      <ThemedView style={styles.inventoryRow} key={movement.id}>
        <ThemedText type="small" style={styles.inventoryType}>
          {t(`products:${movementTypeKey}`)}
        </ThemedText>
        <ThemedText type="small" style={styles.inventoryQty}>
          {movement.quantity_change > 0 ? `+${movement.quantity_change}` : movement.quantity_change} {productName}
        </ThemedText>
        <ThemedText type="small" style={styles.inventoryNote}>
          {movement.note || t('common:noNote')}
        </ThemedText>
        <ThemedText type="small" style={styles.inventoryDate}>
          {new Date(movement.created_at).toLocaleDateString()}
        </ThemedText>
      </ThemedView>
    );
  };

  if (inventory.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText type="small" style={styles.emptyText}>
          {t('products:noInventoryHistory')}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" style={styles.sectionTitle}>
        {t('products:inventoryHistory')}
      </ThemedText>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {inventory.map((movement) => renderMovement(movement))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyText: {
    color: Colors.light.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 500,
    marginTop: 20,
    marginBottom: 12,
    color: '#374151',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    color: Colors.light.textSecondary,
  },
  list: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
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
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginHorizontal: 4,
  },
  inventoryDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});