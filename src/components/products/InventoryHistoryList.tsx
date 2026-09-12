import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { getInventoryHistory } from '@/database/repositories/productRepository';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface InventoryHistoryListProps {
  productId: number;
  productName: string;
  locale?: "ar" | "fr" | "en";
}

export function InventoryHistoryList({ productId, productName, locale = "fr" }: InventoryHistoryListProps) {
  const { t } = useTranslation();
  const theme = useTheme();
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
      <ThemedView type="background" style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView style={styles.scroll}>
          <ThemedView style={styles.emptyState}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {t('products:noInventoryHistory')}
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="background" style={[styles.container, { backgroundColor: theme.background }]}>
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
            tintColor={theme.textSecondary}
          />
        }
        style={styles.scroll}
      >
        <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText type="subtitle" style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '500' }}>
            {t('products:inventoryHistory')} ({inventory.length})
          </ThemedText>
        </ThemedView>

        {inventory.map((movement) => (
          <ThemedView style={[styles.row, { borderBottomColor: theme.border, backgroundColor: theme.surface }]} key={movement.id}>
            <ThemedText type="small" style={{ fontSize: 12, color: theme.textSecondary, flex: 1 }}>
              {movementTypeLabel(movement.movement_type)}
            </ThemedText>

            <ThemedText type="small" style={{ fontSize: 12, color: theme.textPrimary, fontWeight: '500', flex: 0 }}>
              {movement.quantity_change > 0 ? `+${movement.quantity_change}` : movement.quantity_change}
            </ThemedText>

            <ThemedText type="small" style={{ fontSize: 12, color: theme.textSecondary, marginHorizontal: Spacing.xs, flex: 2 }}>
              {movement.note || t('common:noNote')}
            </ThemedText>

            <ThemedText type="small" style={{ fontSize: 10, color: theme.textMuted, flex: 1 }}>
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
  },
  header: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
