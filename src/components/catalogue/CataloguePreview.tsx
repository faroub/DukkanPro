import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { formatCentimes } from '@/utils/money';
import { Spacing, Colors, BorderRadius } from '@/constants/theme';

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
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundElement,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.xs,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.sm,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  productPrice: {
    color: Colors.light.primary,
    fontSize: 14,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  productAvailability: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    marginLeft: Spacing.xs,
  },
  selectedSummary: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginRight: Spacing.md,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  emptyState: {
    textAlign: 'center',
    color: Colors.light.textMuted,
    marginTop: Spacing.lg,
    fontSize: 14,
  },
  shareButton: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    marginTop: Spacing.md,
  },
  shareButtonText: {
    color: Colors.light.surface,
    fontSize: 14,
    textAlign: 'center',
  },
  note: {
    marginTop: Spacing.md,
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
});