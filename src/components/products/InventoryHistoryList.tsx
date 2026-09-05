import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { getInventoryHistory } from '@/database/repositories/productRepository';

interface InventoryHistoryListProps {
  productId: number;
  productName: string;
  locale?: "ar" | "fr" | "en";
}

export function InventoryHistoryList({ productId, productName, locale = "fr" }: InventoryHistoryListProps) {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
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

    loadHistory();
  }, [productId]);

  const movementTypeLabel = (type: string) => {
    if (locale === "ar") {
      return type === "in" ? "دخول" : type === "out" ? "خروج" : "تعديل";
    } else if (locale === "fr") {
      return type === "in" ? "Entrée" : type === "out" ? "Sortie" : "Ajustement";
    } else {
      return type === "in" ? "In" : type === "out" ? "Out" : "Adjustment";
    }
  };

  if (inventory.length === 0) {
    return (
      <ThemedView type="background" style={styles.container}>
        <ScrollView style={styles.scroll}>
          <ThemedView style={styles.emptyState}>
            <ThemedText type="small" style={styles.emptyText}>
              {t('products:noInventoryHistory')}
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
              const loadHistory = async () => {
                const history = await getInventoryHistory(productId);
                setInventory(history);
                setRefreshing(false);
              };
              loadHistory();
            }}
            tintColor="#6B7280"
          />
        }
        style={styles.scroll}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {t('products:inventoryHistory')} ({inventory.length})
          </ThemedText>
        </ThemedView>

        {inventory.map((movement) => (
          <ThemedView style={styles.row} key={movement.id}>
            <ThemedText type="small" style={styles.typeLabel}>
              {movement.movement_type}
            </ThemedText>

            <ThemedText type="small" style={styles.quantityLabel}>
              {movement.quantity_change > 0 ? `+${movement.quantity_change}` : movement.quantity_change}
            </ThemedText>

            <ThemedText type="small" style={styles.noteLabel}>
              {movement.note || t('common:noNote')}
            </ThemedText>

            <ThemedText type="small" style={styles.dateLabel}>
              {new Date(movement.created_at).toLocaleDateString(locale)}
            </ThemedText>
          </ThemedView>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    color: '#6B7280',
  },
  emptyText: {
    color: '#6B7280',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 500,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  typeLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: 500,
    flex: 0,
  },
  noteLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 4,
    flex: 2,
  },
  dateLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    flex: 1,
  },
});