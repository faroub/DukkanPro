import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { formatCentimes } from '@/utils/money';

interface CataloguePreviewProps {
  products: any[];
  showPrices: boolean;
  hideOutOfStock: boolean;
  onShare: () => void;
  selectedProductNames: string[];
  contact: string;
  address: string;
}

export function CataloguePreview({
  products,
  showPrices,
  hideOutOfStock,
  onShare,
  selectedProductNames,
  contact,
  address,
}: CataloguePreviewProps) {
  const displayProducts = products.filter((p: any) => {
    if (hideOutOfStock && p.stock <= 0) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dukkan OS Catalogue</Text>

      {displayProducts.length === 0 && (
        <Text style={styles.emptyState}>{'No products available'}</Text>
      )}

      <FlatList
        data={displayProducts}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.productRow}>
            <Text style={styles.productName}>{item.name}</Text>
            {showPrices && (
              <Text style={styles.productPrice}>
                {formatCentimes(item.price_centimes)} DZD
              </Text>
            )}
            <Text style={styles.productAvailability}>
              {item.stock > 0 ? 'Available' : 'Out of stock'}
            </Text>
          </View>
        )}
      />

      {selectedProductNames.length > 0 && (
        <View style={styles.selectedSummary}>
          <Text style={styles.summaryLabel}>Selected items: {selectedProductNames.length}</Text>
          <Text style={styles.summaryValue}>{selectedProductNames.join(', ')}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.shareButton} onPress={onShare}>
      <Text style={styles.shareButtonText}>Share</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        {contact ? 'Contact: ' + contact : ''}
        {address ? '\nAddress: ' + address : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fafafa',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    marginBottom: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  productPrice: {
    color: '#1B6B3A',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  productAvailability: {
    color: '#6c757d',
    fontSize: 12,
    marginLeft: 8,
  },
  selectedSummary: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
    marginRight: 8,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1B6B3A',
  },
  emptyState: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 14,
  },
  shareButton: {
    padding: 12,
    backgroundColor: '#1B6B3A',
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  note: {
    marginTop: 12,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});