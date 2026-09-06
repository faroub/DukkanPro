import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { formatCentimes } from '@/utils/money';
import { useTranslation } from 'react-i18next';

interface SaleCardProps {
  sale: {
    id: number;
    customer_id: number | null;
    status: string;
    subtotal_centimes: number;
    total_centimes: number;
    amount_paid_centimes: number;
    remaining_balance_centimes: number;
    payment_method: string;
    note: string | null;
    sold_at: string;
    created_at: string;
    updated_at: string;
    saleItems: any[];
  };
  onPress?: () => void;
  showStatus?: boolean;
}

export function SaleCard({ sale, onPress, showStatus = true }: SaleCardProps) {
  const { t } = useTranslation();

  const statusClassName =
    sale.status === 'cancelled'
      ? 'status-cancelled'
      : sale.status === 'returned'
      ? 'status-returned'
      : 'status-completed';

  return (
    <ThemedView
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.infoContainer}>
        <View style={styles.leftColumn}>
          <ThemedText type="body" style={styles.saleId}>
            {t('sales.sale_id')}: {sale.id}
          </ThemedText>
          <ThemedText type="body" style={styles.date}>
            {new Date(sale.sold_at).toLocaleDateString()}
          </ThemedText>
        </View>

        <View style={styles.rightColumn}>
          <ThemedText type="body" style={[styles.total, statusClassName]}>
            {formatCentimes(sale.total_centimes)}
          </ThemedText>
        </View>
      </View>

      {showStatus && (
        <View style={styles.statusContainer}>
          <ThemedText type="caption" style={styles.statusText}>
            {sale.status === 'cancelled'
              ? t('sales.status_cancelled')
              : sale.status === 'returned'
              ? t('sales.status_returned')
              : t('sales.status_completed')}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  total: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B6B3A',
  },
  statusContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});