import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Modal } from '@react-native-community/masked-view';
import { ThemedView, ThemedText } from '@/components/themed-view';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/icon-button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCentimes } from '@/utils/money';
import { Sale } from '@/types/entities';

interface ReceiptPreviewProps {
  visible: boolean;
  onRequestClose: () => void;
  onNewSale: () => void;
  sale: Sale | null;
}

export function ReceiptPreview({
  visible,
  onRequestClose,
  onNewSale,
  sale,
}: ReceiptPreviewProps) {
  const { t } = useTranslation();

  if (!sale) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }}>
        <ThemedView type="surface" style={{ borderRadius: 12, padding: 16, maxHeight: '80%' }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#28a745" />
            <ThemedText type="heading" style={{ marginTop: 8 }}>
              {t('sell.sale_success')}
            </ThemedText>
            <ThemedText type="caption" style={{ color: '#666', marginTop: 4 }}>
              {new Date(sale.sold_at).toLocaleString()}
            </ThemedText>
          </View>

          <ScrollView style={{ marginBottom: 16 }}>
            {/* Sale items */}
            {sale.saleItems?.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <ThemedText type="body">{item.product_name_snapshot}</ThemedText>
                  <ThemedText type="caption" style={{ color: '#666' }}>
                    {item.quantity} x {formatCentimes(item.unit_sale_price_centimes)}
                  </ThemedText>
                </View>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  {formatCentimes(item.line_total_centimes)}
                </ThemedText>
              </View>
            ))}

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />

            {/* Totals */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <ThemedText type="body">{t('sell.subtotal')}</ThemedText>
              <ThemedText type="body">{formatCentimes(sale.subtotal_centimes)}</ThemedText>
            </View>

            {sale.discount_centimes > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <ThemedText type="body">{t('sell.discount')}</ThemedText>
                <ThemedText type="body">-{formatCentimes(sale.discount_centimes)}</ThemedText>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <ThemedText type="heading">{t('sell.total')}</ThemedText>
              <ThemedText type="heading" style={{ color: '#28a745' }}>
                {formatCentimes(sale.total_centimes)}
              </ThemedText>
            </View>

            {/* Payment method */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <ThemedText type="caption">{t('sell.payment_method')}</ThemedText>
              <ThemedText type="caption" style={{ textTransform: 'capitalize' }}>
                {sale.payment_method}
              </ThemedText>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable
              onPress={onRequestClose}
              style={[styles.button, styles.secondaryButton]}
            >
              <ThemedText type="body">{t('sell.close')}</ThemedText>
            </Pressable>

            <Pressable
              onPress={onNewSale}
              style={[styles.button, styles.primaryButton]}
            >
              <ThemedText type="body" style={{ color: '#fff' }}>
                {t('sell.new_sale')}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = {
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#28a745',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
  },
};