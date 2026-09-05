import React, { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SearchBar } from 'react-native-paper';
import { Modal } from '@react-native-community/masked-view';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/icon-button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCentimes } from '@/utils/money';

type Product = {
  id: number;
  name: string;
  sku?: string;
  sale_price_centimes: number;
  stock_quantity: number;
  minimum_stock_quantity: number;
  unit: string;
  is_active: boolean;
};

interface ProductSearchSheetProps {
  visible: boolean;
  onRequestClose: () => void;
  onSearch: (query: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  products: Product[];
}

export function ProductSearchSheet({
  visible,
  onRequestClose,
  onSearch,
  onAddToCart,
  products,
}: ProductSearchSheetProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const queryLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(queryLower) ||
      (product.sku && product.sku.toLowerCase().includes(queryLower))
    );
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleAddToCart = (product: Product) => {
    onAddToCart(product, 1);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#fff', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <ThemedText type="title">{t('sell.search_products')}</ThemedText>
            <IconButton onPress={onRequestClose} icon="x-mark" size={20} color="gray" />
          </View>
          
          <SearchBar
            placeholder={t('sell.search_placeholder')}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
            showLoading={false}
          />

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleAddToCart(item)} style={styles.item}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.sku && <Text style={styles.sku}>SKU: {item.sku}</Text>}
                  </View>
                  <Text style={styles.price}>{formatCentimes(item.sale_price_centimes)}</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={[
              searchQuery 
                ? <ThemedText type="body" style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
                    {t('sell.no_results', { query: searchQuery })}
                  </ThemedText>
                : <ThemedText type="body" style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
                    {t('sell.no_products')}
                  </ThemedText>
            ]}
            contentContainerStyle={{ padding: 8 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  sku: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  price: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
};