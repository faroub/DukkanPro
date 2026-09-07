import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { getSalesByDateRange, getAllSales, search } from '@/database/repositories/saleRepository';
import { SaleFilterTabs } from '@/features/sales/components/SaleFilterTabs';
import { SaleCard } from '@/features/sales/components/SaleCard';
import { formatCentimes } from '@/utils/money';

export function SalesHistoryScreen() {
  const { t } = useTranslation();
  const [sales, setSales] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadSales = async () => {
    let salesData: any[];

    // Apply filters based on selected filter
    switch (filter) {
      case 'today': {
        const todaySales = await getSalesByDateRange(
          new Date().toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        );
        salesData = todaySales;
        break;
      }
      case 'week': {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        salesData = await getSalesByDateRange(startStr, endStr);
        break;
      }
      case 'month': {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        salesData = await getSalesByDateRange(startStr, endStr);
        break;
      }
      case 'cancelled': {
        salesData = await getAllSales({ status: 'cancelled' });
        break;
      }
      case 'returned': {
        salesData = await getAllSales({ status: 'returned' });
        break;
      }
      case 'partial': {
        // Partially paid sales - those with remaining_balance > 0 and status completed
        const completedSales = await getAllSales({ status: 'completed' });
        salesData = completedSales.filter((s: any) => s.remaining_balance_centimes > 0);
        break;
      }
      case 'credit': {
        // Credit sales
        const completedSales = await getAllSales({ status: 'completed' });
        salesData = completedSales.filter((s: any) => s.payment_method === 'credit');
        break;
      }
      case 'paid': {
        // Fully paid sales
        const completedSales = await getAllSales({ status: 'completed' });
        salesData = completedSales.filter((s: any) => s.remaining_balance_centimes === 0 && s.payment_method !== 'credit');
        break;
      }
      default:
        // 'all' - get all sales
        salesData = await getAllSales({});
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const results = await search(searchQuery);
      setSales(results);
    } else {
      setSales(salesData);
    }
  };

  // Load sales on mount
  useEffect(() => {
    loadSales();
  }, []);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setSearchQuery(''); // Clear search when changing filter
    loadSales();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    loadSales();
  };

  // Group sales by status for the summary
  const completedSales = sales.filter((s: any) => s.status === 'completed');
  const cancelledSales = sales.filter((s: any) => s.status === 'cancelled');
  const returnedSales = sales.filter((s: any) => s.status === 'returned');

  const totalRevenue = completedSales.reduce(
    (sum: number, s: any) => sum + s.total_centimes,
    0
  );
  const totalProfit = completedSales.reduce(
    (sum: number, s: any) => sum + (s.total_centimes - s.subtotal_centimes),
    0
  );
  const totalSold = sales.length;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, backgroundColor: '#fafafa' }}
    >
      <ThemedView type="background" style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="heading" style={{ flex: 1 }}>
            {t('sales.history')}
          </ThemedText>
          <ThemedText type="caption" style={{ color: '#666' }}>
            {totalSold} {t('sales.sales_found')}
          </ThemedText>
        </View>
      </ThemedView>

      {/* Filter Tabs */}
      <SaleFilterTabs
        initialFilter={filter}
        onFilterChange={handleFilterChange}
      />

      {/* Search bar */}
      <View style={{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, padding: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}>
          <ThemedText type="body" style={{ flex: 1, marginRight: 8 }}>
            {t('sales.search')}
          </ThemedText>
          <TextInput
            placeholder={t('sales.search_sales')}
            value={searchQuery}
            onChangeText={handleSearch}
            style={{ flex: 1, fontSize: 14 }}
          />
          <TouchableOpacity onPress={() => handleSearch('')} style={{ padding: 4, paddingTop: 4, paddingBottom: 4 }}>
            <ThemedText type="caption" style={{ color: '#1B6B3A' }}>
              {t('sales.clear')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sales list */}
      <FlatList
        data={sales}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }) => (
          <SaleCard
            sale={{
              id: item.id,
              customer_id: item.customer_id,
              status: item.status,
              subtotal_centimes: item.subtotal_centimes,
              total_centimes: item.total_centimes,
              amount_paid_centimes: item.amount_paid_centimes,
              remaining_balance_centimes: item.remaining_balance_centimes,
              payment_method: item.payment_method,
              note: item.note,
              sold_at: item.sold_at,
              created_at: item.created_at,
              updated_at: item.updated_at,
              saleItems: item.saleItems,
            }}
            onPress={() => {}}
          />
        )}
        horizontal={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      />

      {/* Summary section */}
      {totalSold > 0 && (
        <ThemedView type="background" style={{ marginTop: 24, padding: 16, borderRadius: 12 }}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            {t('sales.summary')}
          </ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText type="body" style={styles.summaryLabel}>
              {t('sales.total_revenue')}: {formatCentimes(totalRevenue)}
            </ThemedText>
            <ThemedText type="body" style={styles.summaryValue}>
              {formatCentimes(
                completedSales.reduce((sum: number, s: any) => sum + s.total_centimes, 0)
              )}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText type="body" style={styles.summaryLabel}>
              {t('sales.total_profit')}: {formatCentimes(totalProfit)}
            </ThemedText>
            <ThemedText type="body" style={styles.summaryValue}>
              {formatCentimes(
                completedSales.reduce((sum: number, s: any) => sum + (s.total_centimes - s.subtotal_centimes), 0)
              )}
            </ThemedText>
          </View>
          {cancelledSales.length > 0 && (
            <View style={styles.summaryNote}>
              <ThemedText type="caption">
                {t('sales.cancelled_excluded', {
                  count: cancelledSales.length,
                })}
              </ThemedText>
            </View>
          )}
          {returnedSales.length > 0 && (
            <View style={styles.summaryNote}>
              <ThemedText type="caption">
                {t('sales.returned_excluded', {
                  count: returnedSales.length,
                })}
              </ThemedText>
            </View>
          )}
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = {
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#555',
    fontSize: 14,
  },
  summaryValue: {
    color: '#1B6B3A',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  summaryNote: {
    marginTop: 4,
    alignSelf: 'flex-end' as const,
    color: '#6c757d',
    fontSize: 12,
  },
};