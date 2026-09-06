import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { getSaleById, cancel, returnSale as returnSaleFn } from '@/database/repositories/saleRepository';
import { formatCentimes } from '@/utils/money';
import { CancelSaleDialog } from '@/features/sales/components/CancelSaleDialog';
import { ReturnSaleDialog } from '@/features/sales/components/ReturnSaleDialog';

export function SaleDetailScreen({ route }: { route: { params: { id: string } } }) {
  const { t } = useTranslation();
  const [sale, setSale] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saleId = parseInt(route.params.id, 10);

  // Load sale by ID
  useEffect(() => {
    loadSale();
  }, [saleId]);

  const loadSale = async () => {
    setIsLoading(true);
    try {
      const saleData = await getSaleById(saleId);
      setSale(saleData);
    } catch (err) {
      console.error('Failed to load sale:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancellation
  const [cancelReason, setCancelReason] = useState<string>('');
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert(t('common.error'), t('sales.cancel_reason_required'));
      return;
    }

    try {
      await cancel(saleId, cancelReason);
      loadSale(); // Refresh after cancellation
      setCancelReason('');
    } catch (err: any) {
      const message =
        err.message.includes('already')
          ? t('sales.cancel_already_cancelled')
          : err.message.includes('not found')
          ? t('sales.sale_not_found')
          : t('sales.cancel_failed');
      Alert.alert(t('common.error'), message);
    }
  };

  // Handle return
  const [returnReason, setReturnReason] = useState<string>('');
  const handleReturn = async () => {
    if (!returnReason.trim()) {
      Alert.alert(t('common.error'), t('sales.return_reason_required'));
      return;
    }

    try {
      await returnSaleFn(saleId, returnReason);
      loadSale(); // Refresh after return
      setReturnReason('');
    } catch (err: any) {
      const message =
        err.message.includes('already')
          ? t('sales.already_returned_or_cancelled')
          : err.message.includes('not found')
          ? t('sales.sale_not_found')
          : t('sales.return_failed');
      Alert.alert(t('common.error'), message);
    }
  };

  // Open cancel confirmation dialog
  const openCancelDialog = () => {
    // Check if sale can be cancelled (must be completed)
    if (sale?.status !== 'completed') {
      Alert.alert(t('common.error'), t('sales.cannot_cancel_status', { status: sale?.status }));
      return;
    }
    setCancelReason('');
  };

  // Open return confirmation dialog
  const openReturnDialog = () => {
    // Check if sale can be returned (must be completed)
    if (sale?.status !== 'completed') {
      Alert.alert(t('common.error'), t('sales.cannot_return_status', { status: sale?.status }));
      return;
    }
    setReturnReason('');
  };

  if (!sale) {
    return (
      <ThemedView type="background" style={{ flex: 1, padding: 16 }}>
        <ThemedText type="body" style={{ textAlign: 'center', marginTop: 40 }}>
          {t('sales.loading_sale')}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView>
      <ThemedView type="background" style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <ThemedText type="heading" style={{ flex: 1 }}>
            {t('sales.sale_detail', { saleId: sale.id })}
          </ThemedText>
          {/* Status badge */}
          <View style={{ padding: 6, borderRadius: 20, marginLeft: 8 }}>
            <ThemedText type="caption" style={[
              styles.statusBadge,
              sale.status === 'cancelled' && styles.statusBadgeCancelled,
              sale.status === 'returned' && styles.statusBadgeReturned,
              sale.status === 'completed' && styles.statusBadgeCompleted,
            ]}>
              {sale.status === 'cancelled'
                ? t('sales.status_cancelled')
                : sale.status === 'returned'
                ? t('sales.status_returned')
                : t('sales.status_completed')}
            </ThemedText>
          </View>
        </View>

        {/* Sale info cards */}
        {/* Customer info */}
        {sale.customer_id && (
          <View style={styles.infoCard}>
            <ThemedText type="body" style={styles.infoLabel}>
              {t('sales.customer')}
            </ThemedText>
            <ThemedText type="body" style={styles.infoValue}>
              {sale.customer_name || t('sales.unknown_customer')}
            </ThemedText>
          </View>
        )}

        {/* Payment method */}
        <View style={styles.infoCard}>
          <ThemedText type="body" style={styles.infoLabel}>
            {t('sales.payment_method')}
          </ThemedText>
          <ThemedText type="body" style={styles.infoValue}>
            {t(`sales.payment_${sale.payment_method}`)}
          </ThemedText>
        </View>

        {/* Date */}
        <View style={styles.infoCard}>
          <ThemedText type="body" style={styles.infoLabel}>
            {t('sales.date')}
          </ThemedText>
          <ThemedText type="body" style={styles.infoValue}>
            {new Date(sale.sold_at).toLocaleDateString()}
          </ThemedText>
        </View>

        {/* Items list */}
        <ThemedView type="background" style={{ marginTop: 16, borderRadius: 12, padding: 16 }}>
          <ThemedText type="body" style={{ fontWeight: '600', marginBottom: 8 }}>
            {t('sales.items')}
          </ThemedText>
          <FlatList
            data={sale.saleItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <ThemedText type="body" style={{ flex: 1 }}>
                  {item.product_name_snapshot} - {item.quantity} x {formatCentimes(item.unit_sale_price_centimes)}
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  {formatCentimes(item.line_total_centimes)}
                </ThemedText>
              </View>
            )}
          />
          {/* Totals */}
          <View style={{ marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <ThemedText type="body" style={{ flex: 1 }}>
                {t('sales.subtotal')}: {formatCentimes(sale.subtotal_centimes)}
              </ThemedText>
              {sale.discount_centimes > 0 && (
                <ThemedText type="body" style={{ color: '#6c757d' }}>
                  -{formatCentimes(sale.discount_centimes)}
                </ThemedText>
              )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16 }}>
                {t('sales.total')}: {formatCentimes(sale.total_centimes)}
              </ThemedText>
              {sale.remaining_balance_centimes > 0 && (
                <ThemedText type="body" style={{ color: '#dc3545' }}>
                  ({t('sales.balance')}: {formatCentimes(sale.remaining_balance_centimes)})
                </ThemedText>
              )}
            </View>
          </View>
        </ThemedView>

        {/* Action buttons - only for completed sales */}
        {sale.status === 'completed' && (
          <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={openCancelDialog} style={{ padding: 12, borderRadius: 8, backgroundColor: '#dc3545', marginRight: 8 }}>
              <ThemedText type="body" style={{ color: '#fff' }}>
                {t('sales.cancel_sale')}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={openReturnDialog} style={{ padding: 12, borderRadius: 8, backgroundColor: '#1B6B3A', marginLeft: 8 }}>
              <ThemedText type="body" style={{ color: '#fff' }}>
                {t('sales.return_sale')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancelled/Returned status info */}
        {sale.status === 'cancelled' && (
          <View style={{ marginTop: 24, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
            <ThemedText type="body" style={{ marginBottom: 8, color: '#6c757d' }}>
              {t('sales.cancelled_note')}
            </ThemedText>
            {sale.note && (
              <ThemedText type="body" style={{ color: '#6c757d' }}>
                {t('sales.cancel_reason', { reason: sale.note })}
              </ThemedText>
            )}
          </View>
        )}

        {sale.status === 'returned' && (
          <View style={{ marginTop: 24, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
            <ThemedText type="body" style={{ marginBottom: 8, color: '#6c757d' }}>
              {t('sales.returned_note')}
            </ThemedText>
            {sale.note && (
              <ThemedText type="body" style={{ color: '#6c757d' }}>
                {t('sales.return_reason', { reason: sale.note })}
              </ThemedText>
            )}
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    padding: 4,
    borderRadius: 20,
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeCompleted: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusBadgeCancelled: {
    backgroundColor: '#e2e3e5',
    color: '#383d44',
  },
  statusBadgeReturned: {
    backgroundColor: '#f8d7da',
    color: '#842029',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: '#333',
    fontSize: 14,
  },
});