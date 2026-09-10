import { useRoute, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { executeRead } from '@/database/database';
import { getInventoryHistory } from '@/database/repositories/productRepository';
import { formatCentimes } from '@/utils/money';

export default function ProductDetailScreen() {
  const { params } = useRoute() as { params: { id: string } };
  const productId = Number(params?.id);
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [product, setProduct] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
        const rows: any[] = await executeRead(`SELECT * FROM products WHERE id = ?`, [productId]);
        if (rows.length > 0) setProduct(rows[0]);
        const history = await getInventoryHistory(productId);
        setInventory(history);
    } catch (err) {
        console.error(err);
    } finally {
        setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [productId]);

  if (!product) return <View style={styles.container}><ThemedText>{t('loading')}</ThemedText></View>;

  const isLowStock = product.stock_quantity <= product.minimum_stock_quantity;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} /></TouchableOpacity>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => (navigation as any).push(`products/edit/${productId}`)}><Ionicons name="pencil" size={24} /></TouchableOpacity>
                <TouchableOpacity><Ionicons name="archive" size={24} color={Colors.light.error} /></TouchableOpacity>
            </View>
        </View>

        {isLowStock && (
            <View style={styles.warningBanner}>
                <Ionicons name="warning" size={20} color={Colors.light.warning} />
                <ThemedText style={styles.warningText}>{t('products:lowStock')}</ThemedText>
            </View>
        )}

        <ThemedView style={styles.card}>
            <ThemedText style={styles.name}>{product.name}</ThemedText>
            <ThemedText style={styles.sku}>{t('products:sku')}: {product.sku}</ThemedText>
            <View style={styles.priceRow}>
                <ThemedText style={styles.price}>{t('products:salePrice')}: {formatCentimes(product.sale_price_centimes, i18n.language as any)}</ThemedText>
            </View>
            <TouchableOpacity style={styles.adjustButton} onPress={() => (navigation as any).push('products/stock-adjustment', { productId })}>
                <Ionicons name="options" size={20} color={Colors.light.primary} />
                <ThemedText style={styles.adjustButtonText}>{t('products:adjustmentTitle')}</ThemedText>
            </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.card}>
            <ThemedText style={styles.sectionTitle}>{t('products:inventoryHistory')}</ThemedText>
            {inventory.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                    <ThemedText>{item.movement_type}</ThemedText>
                    <ThemedText>{item.quantity_change}</ThemedText>
                </View>
            ))}
        </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.lg },
    headerActions: { flexDirection: 'row', gap: Spacing.md },
    warningBanner: { flexDirection: 'row', backgroundColor: Colors.light.warningLight, padding: Spacing.md, gap: Spacing.sm },
    warningText: { color: Colors.light.warning, fontWeight: '600' },
    card: { margin: Spacing.lg, padding: Spacing.lg, borderRadius: BorderRadius.lg, ...Shadows.sm },
    name: { ...Typography.heading2 },
    sku: { ...Typography.caption, color: Colors.light.textSecondary },
    priceRow: { marginVertical: Spacing.md },
    price: { ...Typography.body },
    adjustButton: { flexDirection: 'row', backgroundColor: Colors.light.primary, padding: Spacing.md, borderRadius: BorderRadius.button, justifyContent: 'center', gap: Spacing.sm },
    adjustButtonText: { color: Colors.light.primary, fontWeight: '600' },
    sectionTitle: { ...Typography.heading3, marginBottom: Spacing.md },
    historyRow: {
      flexDirection: 'column',
      padding: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.light.border,
      backgroundColor: 'white',
      marginBottom: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    inventoryType: {
      fontSize: 12,
      color: Colors.light.textSecondary,
    },
    inventoryQty: {
      fontSize: 12,
      color: Colors.light.textPrimary,
      fontWeight: 500,
      alignSelf: 'flex-end',
    },
    inventoryNote: {
      fontSize: 10,
      color: Colors.light.textSecondary,
      marginHorizontal: 4,
    },
    inventoryDate: {
      fontSize: 10,
      color: Colors.light.textSecondary,
    },
});