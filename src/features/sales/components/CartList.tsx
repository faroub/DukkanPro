import React from 'react';
import { View, Text, FlatList, Pressable, Modal } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/icon-button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCentimes } from '@/utils/money';
import { CartItem } from './CartItem';

interface CartListProps {
  items: Array<{ product: any; quantity: number }>;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onPreserveCartToggle: (value: boolean) => void;
  preserveCart: boolean;
}

export function CartList({
  items,
  onRemove,
  onUpdateQuantity,
  onPreserveCartToggle,
  preserveCart,
}: CartListProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return null;
  }

  return (
    <View>
      <ThemedView type="surface" style={{ margin: 16, borderRadius: 12, overflow: 'hidden' }}>
        <ThemedView style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
          <ThemedText type="heading" style={{ flex: 1 }}>
            {t('sell.cart')}
          </ThemedText>
          <IconButton
            onPress={() => onPreserveCartToggle(!preserveCart)}
            icon={preserveCart ? 'pin' : 'pin-off'}
            size={20}
            color="primary"
          />
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
              <Pressable
                onPress={() => {
                  // Clear cart with confirmation
                  // In a real app, we'd use a proper confirmation dialog
                  onRemove(0); // Special ID to clear all
                }}
                style={{ padding: 12, alignItems: 'center' }}
              >
                <ThemedText type="body" style={{ color: '#dc3545' }}>
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