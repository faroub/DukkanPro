import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { getInventoryHistory } from '@/database/repositories/productRepository';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

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
    backgroundColor: Colors.light.background,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    color: Colors.light.textSecondary,
  },
  emptyText: {
    color: Colors.light.textSecondary,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 500,
    color: Colors.light.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  typeLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  quantityLabel: {
    fontSize: 12,
    color: Colors.light.textPrimary,
    fontWeight: 500,
    flex: 0,
  },
  noteLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginHorizontal: Spacing.xs,
    flex: 2,
  },
  dateLabel: {
    fontSize: 10,
    color: Colors.light.textMuted,
    flex: 1,
  },
});