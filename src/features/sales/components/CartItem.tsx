import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconButton } from '@/components/ui/icon-button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCentimes } from '@/utils/money';

interface CartItemProps {
  product: any;
  quantity: number;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

export function CartItem({
  product,
  quantity,
  onRemove,
  onUpdateQuantity,
}: CartItemProps) {
  const lineTotal = product.sale_price_centimes * quantity;

  return (
    <ThemedView type="surface" style={{ margin: 8, borderRadius: 8, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
        {/* Product info */}
        <View style={{ flex: 1, marginRight: 12 }}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            {product.name}
          </ThemedText>
          <ThemedText type="caption" style={{ color: '#666', marginTop: 2 }}>
            {product.unit}
          </ThemedText>
        </View>

        {/* Quantity controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => {
              const newQuantity = Math.max(1, quantity - 1);
              onUpdateQuantity(product.id, newQuantity);
            }}
            style={styles.quantityButton}
          >
            <MaterialCommunityIcons name="minus" size={20} color="#666" />
          </Pressable>

          <View style={styles.quantityDisplay}>
            <Text style={{ fontSize: 18, fontWeight: '600', width: 28, textAlign: 'center' }}>
              {quantity}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              const newQuantity = quantity + 1;
              onUpdateQuantity(product.id, newQuantity);
            }}
            style={styles.quantityButton}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#28a745" />
          </Pressable>
        </View>

        {/* Remove button */}
        <Pressable
          onPress={() => onRemove(product.id)}
          style={styles.removeButton}
        >
          <MaterialCommunityIcons name="trash-can" size={20} color="#dc3545" />
        </Pressable>

        {/* Line total */}
        <View style={{ marginLeft: 12 }}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            {formatCentimes(lineTotal)}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = {
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  quantityDisplay: {
    minWidth: 28,
    alignItems: 'center',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
};