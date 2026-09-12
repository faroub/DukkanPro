import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { formatCentimes } from '@/utils/money';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();

  const displayProducts = products.filter((p: any) => {
    if (hideOutOfStock && p.stock <= 0) return false;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceAlt }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Dukkan OS Catalogue</Text>

      {displayProducts.length === 0 && (
        <Text style={[styles.emptyState, { color: theme.textMuted }]}>{'No products available'}</Text>
      )}

      <FlatList
        data={displayProducts}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.productRow, { backgroundColor: theme.surface }]}>
            <Text style={[styles.productName, { color: theme.textPrimary }]}>{item.name}</Text>
            {showPrices && (
              <Text style={[styles.productPrice, { color: theme.primary }]}>
                {formatCentimes(item.price_centimes)} DZD
              </Text>
            )}
            <Text style={[styles.productAvailability, { color: theme.textSecondary }]}>
              {item.stock > 0 ? 'Available' : 'Out of stock'}
            </Text>
          </View>
        )}
      />

      {selectedProductNames.length > 0 && (
        <View style={[styles.selectedSummary, { backgroundColor: theme.surface }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Selected items: {selectedProductNames.length}</Text>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>{selectedProductNames.join(', ')}</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.primary }]} onPress={onShare}>
        <Text style={[styles.shareButtonText, { color: '#FFFFFF' }]}>Share</Text>
      </TouchableOpacity>

      <Text style={[styles.note, { color: theme.textMuted }]}>
        {contact ? 'Contact: ' + contact : ''}
        {address ? '\nAddress: ' + address : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
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
    borderRadius: BorderRadius.sm,
  },
  productName: {
    flex: 1,
    fontSize: 14,
  },
  productPrice: {
    fontSize: 14,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  productAvailability: {
    fontSize: 12,
    marginLeft: Spacing.xs,
  },
  selectedSummary: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  summaryLabel: {
    fontSize: 14,
    marginRight: Spacing.md,
  },
  summaryValue: {
    fontSize: 14,
  },
  emptyState: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: 14,
  },
  shareButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    marginTop: Spacing.md,
  },
  shareButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  note: {
    marginTop: Spacing.md,
    fontSize: 12,
    textAlign: 'center',
  },
});
