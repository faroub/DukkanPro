import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { formatCentimes } from '@/utils/money';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
            <ThemedText type="body" style={{ marginRight: 8, fontWeight: '600' }}>
              {formatCentimes(discount)}
            </ThemedText>
            {/* Discount input - press to edit */}
            <Pressable
              onPress={() => {
                // In a real app, this would open a discount input
                // For now, we'll just show the current value
              }}
              style={{ padding: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginLeft: 4 }}
            >
              {t('sell.edit')}
            </Pressable>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />

        {/* Total */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
          <ThemedText type="title">{t('sell.total')}</ThemedText>
          <ThemedText type="title" style={{ fontWeight: '600', color: '#1B6B3A' }}>
            {formatCentimes(total)}
          </ThemedText>
        </View>
      </ThemedView>
    </ThemedView>
  );
}