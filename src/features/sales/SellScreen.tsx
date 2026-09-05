import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';

export default function SellScreen() {
  const { t } = useTranslation();
  const { products, loading, error } = useProducts({ is_active: true });
  const { cartItems, addItem } = useCartStore();

  if (loading) {
    return (
      <ThemedView type="background" style={{ flex: 1, padding: 16 }}>
        <ThemedText type="caption" style={{ textAlign: 'center', marginTop: 40 }}>
          {t('sell.loading')}
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView type="background" style={{ flex: 1, padding: 16 }}>
        <ThemedText type="body" style={{ textAlign: 'center', marginTop: 40, color: 'red' }}>
          {error}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="background" style={{ flex: 1 }}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            <Text>{item.sku}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={{ padding: 16 }}>
            <Text>Cart: {cartItems.length} items</Text>
          </View>
        }
      />
    </ThemedView>
  );
}