import React from 'react';
import { View, Text } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { formatCentimes } from '@/utils/money';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
  onDiscountChange: (value: number) => void;
}

export function CartSummary({
  subtotal,
  discount,
  total,
  onDiscountChange,
}: CartSummaryProps) {
  const { t } = useTranslation();

  return (
    <ThemedView type="surface" style={{ margin: 16, borderRadius: 12, overflow: 'hidden' }}>
      <ThemedView style={{ padding: 16 }}>
        {/* Subtotal */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <ThemedText type="body">{t('sell.subtotal')}</ThemedText>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            {formatCentimes(subtotal)}
          </ThemedText>
        </View>

        {/* Discount */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <ThemedText type="body">{t('sell.discount')}</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* In a real app, this would be an input */}
            <ThemedText type="body" style={{ marginRight: 8, fontWeight: '600' }}>
              {formatCentimes(discount)}
            </ThemedText>
            {/* Placeholder for discount input */}
            <ThemedText type="caption" style={{ color: '#007bff', marginLeft: 4 }}>
              {t('sell.edit')}
            </ThemedText>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />

        {/* Total */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
          <ThemedText type="title">{t('sell.total')}</ThemedText>
          <ThemedText type="title" style={{ fontWeight: '600', color: '#28a745' }}>
            {formatCentimes(total)}
          </ThemedText>
        </View>
      </ThemedView>
    </ThemedView>
  );
}