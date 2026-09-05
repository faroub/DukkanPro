import React from 'react';
import { View, Text, FlatList, Pressable, Modal } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCentimes } from '@/utils/money';
import { CartItem } from './CartItem';

interface CartListProps {
  items: Array<{ product: any; quantity: number }>;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onPreserveCartToggle: (value: boolean) => void;
  preserveCart: boolean;
  subtotal: number;
  discount: number;
  total: number;
  setDiscount: (value: number) => void;
}

export function CartList({
  items,
  onRemove,
  onUpdateQuantity,
  onPreserveCartToggle,
  preserveCart,
  subtotal,
  discount,
  total,
  setDiscount,
}: CartListProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return null;
  }

  return (
    <View>
      <ThemedView type="surface" style={{ margin: 16, borderRadius: 12, overflow: 'hidden' }}>
        <ThemedView style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
          <ThemedText type="body" style={{ flex: 1, fontWeight: '600' }}>
            {t('sell.cart')}
          </ThemedText>
        </ThemedView>

        <FlatList
          data={items}
          keyExtractor={(item) => item.product.id.toString()}
          renderItem={({ item }) => (
            <CartItem
              product={item.product}
              quantity={item.quantity}
              onRemove={onRemove}
              onUpdateQuantity={onUpdateQuantity}
            />
          )}
          ListFooterComponent={
            <View style={{ padding: 16 }}>
              <ThemedView type="surface" style={{ padding: 12, borderRadius: 8, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {t('sell.subtotal')}</ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {formatCentimes(subtotal)}
                  </ThemedText>
                </View>

                {discount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <ThemedText type="body">{t('sell.discount')}</ThemedText>
                    <ThemedText type="body" style={{ color: '#D97706' }}>
                      -{formatCentimes(discount)}
                    </ThemedText>
                  </View>
                )}

                <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderColor: '#eee', marginTop: 8, paddingBottom: 8 }}>
                  <ThemedText type="title">{t('sell.total')}</ThemedText>
                  <ThemedText type="title" style={{ fontWeight: '600', color: '#1B6B3A' }}>
                    {formatCentimes(total)}
                  </ThemedText>
                </View>
              </ThemedView>

              {/* Clear cart with confirmation */}
              <Pressable
                onPress={() => {
                  // Clear cart with confirmation if non-empty
                  if (items.length > 0) {
                    // In a real app, use a proper confirmation dialog
                    onRemove(0); // Special ID to clear all
                  }
                }}
                style={{ padding: 12, alignItems: 'center' }}
              >
                <MaterialCommunityIcons name="trash-can" size={20} color="#dc3545" />
                <ThemedText type="body" style={{ color: '#dc3545', marginLeft: 8 }}>
                  {t('sell.clear_cart')}
                </ThemedText>
              </Pressable>
            </View>
          }
        />
      </ThemedView>
    </View>
  );
}