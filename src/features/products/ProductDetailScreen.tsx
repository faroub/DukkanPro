import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRoute, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FooterTrademark } from '@/components/FooterTrademark';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getById, getInventoryHistory, archive, update } from '@/database/repositories/productRepository';
import { Product, InventoryMovement } from '@/types/entities';
import { formatCentimes } from '@/utils/money';

interface ProductDetailScreenProps {
  productId?: number;
}

export default function ProductDetailScreen({ productId: propProductId }: ProductDetailScreenProps = {}) {
  const localParams = useLocalSearchParams<{ id?: string }>();
  const route = useRoute() as { params?: { id?: string } };
  const rawId = propProductId ?? localParams?.id ?? route?.params?.id;
  const productId = Number(rawId);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!productId) return;
    try {
      const p = await getById(productId);
      setProduct(p);
      const history = await getInventoryHistory(productId);
      setInventory(history);
    } catch (err) {
      console.error('Failed to load product detail:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleArchive = useCallback(async () => {
    if (!productId || !product) return;

    const actionText = product.is_active
      ? t('products:archiveProduct')
      : t('products:reactivateProduct');
    const confirmMessage = product.is_active
      ? t('products:archiveConfirm')
      : t('common:confirmDialog');

    Alert.alert(actionText, confirmMessage, [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: actionText,
        style: product.is_active ? 'destructive' : 'default',
        onPress: async () => {
          try {
            if (product.is_active) {
              await archive(productId);
            } else {
              await update(productId, { is_active: true });
            }
            await loadData();
          } catch (err: any) {
            Alert.alert(t('common:error'), err.message);
          }
        },
      },
    ]);
  }, [productId, product, t, loadData]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading && !product) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={styles.loadingText}>{t('common:loading')}</ThemedText>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ThemedText style={styles.errorTitle}>Product not found</ThemedText>
        <TouchableOpacity style={styles.backBtnSimple} onPress={() => router.back()}>
          <ThemedText style={styles.backBtnSimpleText}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const isLowStock = product.stock_quantity <= product.minimum_stock_quantity;
  const profitCentimes = product.sale_price_centimes - product.cost_price_centimes;
  const marginPercentage =
    product.sale_price_centimes > 0
      ? ((profitCentimes / product.sale_price_centimes) * 100).toFixed(1)
      : '0.0';

  const getMovementTypeLabel = (type: string) => {
    const lower = String(type).toLowerCase();
    if (lower === 'sale' || lower === 'out') return t('products:customerSale');
    if (lower === 'restock' || lower === 'in' || lower === 'delivery') return t('products:adjustmentDelivery');
    if (lower === 'damage' || lower === 'damaged' || lower === 'loss') return t('products:adjustmentLoss');
    if (lower === 'initial' || lower === 'opening') return t('products:openingStock');
    return t('products:movementAdjustment');
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
            {t('products:productDetail')}
          </ThemedText>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => router.push(`/products/edit/${productId}` as any)}
            accessibilityLabel="Edit product"
          >
            <Ionicons name="pencil" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={handleArchive}
            accessibilityLabel="Archive product"
          >
            <Ionicons
              name={product.is_active ? 'archive-outline' : 'refresh-outline'}
              size={18}
              color={product.is_active ? theme.error : theme.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={theme.primary}
          />
        }
      >
        {/* Breadcrumb strip matching Stitch */}
        <View style={styles.breadcrumbRow}>
          <Ionicons name="layers-outline" size={14} color={theme.textMuted} />
          <ThemedText style={styles.breadcrumbText} numberOfLines={1}>
            {t('products:title')} • {product.category || 'General'} • {product.name}
          </ThemedText>
        </View>

        {/* Low Stock Alert Banner */}
        {isLowStock && (
          <View style={styles.warningBanner}>
            <View style={styles.warningIconCircle}>
              <Ionicons name="warning" size={18} color={theme.secondary} />
            </View>
            <View style={styles.warningTextContainer}>
              <View style={styles.warningTitleRow}>
                <ThemedText style={styles.warningTitle}>
                  {t('products:lowStockAlert')}
                </ThemedText>
                <View style={styles.actionNeededBadge}>
                  <ThemedText style={styles.actionNeededBadgeText}>
                    {t('products:actionNeeded')}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.warningDescription}>
                {t('products:onlyCountLeft', {
                  count: product.stock_quantity,
                  unit: product.unit || 'units',
                  min: product.minimum_stock_quantity,
                })}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Main Product Card */}
        <View style={styles.card}>
          {/* Visual Header */}
          <View style={styles.productHeader}>
            <View style={styles.productAvatar}>
              <Ionicons name="cube" size={28} color={theme.primary} />
            </View>
            <View style={styles.productHeaderInfo}>
              <View style={styles.tagRow}>
                {product.category ? (
                  <View style={styles.categoryBadge}>
                    <ThemedText style={styles.categoryBadgeText}>
                      {product.category}
                    </ThemedText>
                  </View>
                ) : null}
                <ThemedText style={styles.unitMetaText}>
                  {t('products:unit')}: {product.unit || 'Piece'}
                </ThemedText>
              </View>
              <ThemedText style={styles.productName} numberOfLines={2}>
                {product.name}
              </ThemedText>
              {!product.is_active && (
                <View style={styles.archivedPill}>
                  <ThemedText style={styles.archivedPillText}>
                    {t('products:archivedBadge')}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Metadata Pill Grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaCol}>
              <ThemedText style={styles.metaLabel}>{t('products:sku')}</ThemedText>
              <ThemedText style={styles.metaValue}>
                {product.sku || '—'}
              </ThemedText>
            </View>
            <View style={styles.metaCol}>
              <ThemedText style={styles.metaLabel}>{t('products:barcodeScan')}</ThemedText>
              <View style={styles.barcodeRow}>
                <Ionicons name="barcode-outline" size={16} color={theme.textSecondary} />
                <ThemedText style={styles.metaValue}>
                  {product.sku || '—'}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Pricing Section */}
          <View style={styles.pricingSection}>
            <View style={styles.priceCol}>
              <ThemedText style={styles.priceColLabel}>
                {t('products:sellingPrice')}
              </ThemedText>
              <ThemedText style={styles.salePriceValue}>
                {formatCentimes(product.sale_price_centimes, i18n.language as any)}
              </ThemedText>
              <ThemedText style={styles.priceSubHint}>
                Per {product.unit || 'unit'}
              </ThemedText>
            </View>

            <View style={styles.priceCol}>
              <ThemedText style={styles.priceColLabel}>
                {t('products:costAndProfit')}
              </ThemedText>
              <View style={styles.costAndProfitRow}>
                <ThemedText style={styles.costPriceValue}>
                  {product.cost_price_centimes > 0
                    ? formatCentimes(product.cost_price_centimes, i18n.language as any)
                    : '—'}
                </ThemedText>
                {profitCentimes > 0 ? (
                  <View style={styles.profitBadge}>
                    <Ionicons name="trending-up" size={12} color={theme.primary} />
                    <ThemedText style={styles.profitBadgeText}>
                      +{formatCentimes(profitCentimes, i18n.language as any)} ({marginPercentage}%)
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Stock Status Micro-Grid */}
          <View style={styles.stockMicroGrid}>
            <View style={styles.stockGridItem}>
              <ThemedText style={styles.stockGridLabel}>
                {t('products:currentOnHand')}
              </ThemedText>
              <View style={styles.stockValueRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isLowStock ? theme.secondary : theme.primary },
                  ]}
                />
                <ThemedText
                  style={[
                    styles.stockGridValue,
                    isLowStock && { color: theme.secondary },
                  ]}
                >
                  {product.stock_quantity} {product.unit || 'units'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.stockGridItem}>
              <ThemedText style={styles.stockGridLabel}>
                {t('products:minThreshold')}
              </ThemedText>
              <ThemedText style={styles.stockGridValue}>
                {product.minimum_stock_quantity} {product.unit || 'units'}
              </ThemedText>
            </View>

            <View style={styles.stockGridItem}>
              <ThemedText style={styles.stockGridLabel}>
                {t('products:stockStatus')}
              </ThemedText>
              <ThemedText
                style={[
                  styles.stockGridValue,
                  { color: isLowStock ? theme.secondary : theme.primary },
                ]}
              >
                {isLowStock ? t('products:needsRestock') : t('products:healthy')}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Primary Action Button: Adjust Stock */}
        <TouchableOpacity
          style={styles.adjustStockButton}
          onPress={() =>
            router.push({
              pathname: '/products/stock-adjustment' as any,
              params: {
                productId: productId.toString(),
                productName: product.name,
                currentStock: product.stock_quantity.toString(),
              },
            })
          }
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          <ThemedText style={styles.adjustStockButtonText}>
            {t('products:adjustStock')}
          </ThemedText>
        </TouchableOpacity>

        {/* Inventory History Section */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <View>
              <ThemedText style={styles.historyTitle}>
                {t('products:inventoryHistory')}
              </ThemedText>
              <ThemedText style={styles.historySubtitle}>
                {t('products:recentMovements')}
              </ThemedText>
            </View>
          </View>

          {inventory.length === 0 ? (
            <View style={styles.emptyHistoryWrap}>
              <Ionicons name="file-tray-outline" size={32} color={theme.textMuted} />
              <ThemedText style={styles.emptyHistoryText}>
                {t('products:noInventoryHistory')}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.historyList}>
              {inventory.map((item, idx) => {
                const isPositive = item.quantity_change > 0;
                const isSale = (item.movement_type as string) === 'sale' || (item.movement_type as string) === 'out';
                const iconName = isSale
                  ? 'cart-outline'
                  : (item.movement_type as string) === 'restock' || isPositive
                  ? 'cube-outline'
                  : (item.movement_type as string) === 'damage'
                  ? 'alert-circle-outline'
                  : 'swap-vertical-outline';

                const iconBg = isPositive
                  ? theme.primaryLight
                  : isSale
                  ? theme.surfaceAlt
                  : theme.errorLight;

                const iconColor = isPositive
                  ? theme.primary
                  : isSale
                  ? theme.primary
                  : theme.error;

                const itemNote = (item as any).note || (item as any).notes;
                const balanceAfter = (item as any).balance_after;

                return (
                  <View key={item.id || idx}>
                    <View style={styles.historyRow}>
                      <View style={styles.historyRowLeft}>
                        <View style={[styles.movementIconCircle, { backgroundColor: iconBg }]}>
                          <Ionicons name={iconName as any} size={18} color={iconColor} />
                        </View>
                        <View style={styles.movementTextWrap}>
                          <ThemedText style={styles.movementType}>
                            {getMovementTypeLabel(String(item.movement_type))}
                          </ThemedText>
                          {itemNote ? (
                            <ThemedText style={styles.movementNote} numberOfLines={1}>
                              {itemNote}
                            </ThemedText>
                          ) : null}
                          <ThemedText style={styles.movementDate}>
                            {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.historyRowRight}>
                        <View
                          style={[
                            styles.quantityPill,
                            isPositive ? styles.quantityPillPositive : styles.quantityPillNegative,
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.quantityPillText,
                              isPositive
                                ? styles.quantityPillTextPositive
                                : styles.quantityPillTextNegative,
                            ]}
                          >
                            {isPositive ? `+${item.quantity_change}` : item.quantity_change}{' '}
                            {product.unit || 'units'}
                          </ThemedText>
                        </View>
                        {balanceAfter !== undefined && (
                          <ThemedText style={styles.balanceText}>
                            Bal: {balanceAfter}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    {idx < inventory.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Footer Trademark */}
        <FooterTrademark />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    errorTitle: {
      ...Typography.heading3,
      color: theme.error,
    },
    backBtnSimple: {
      padding: Spacing.md,
    },
    backBtnSimpleText: {
      ...Typography.label,
      color: theme.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...Typography.heading3,
      color: theme.textPrimary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    iconCircleBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: 48,
      gap: Spacing.md,
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    },
    breadcrumbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 2,
      marginBottom: 2,
    },
    breadcrumbText: {
      ...Typography.caption,
      color: theme.textSecondary,
      fontSize: 12,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      backgroundColor: theme.warningLight,
      padding: Spacing.md,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: theme.warning + '40',
    },
    warningIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.warningLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    warningTextContainer: {
      flex: 1,
      gap: 2,
    },
    warningTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    warningTitle: {
      ...Typography.label,
      color: theme.secondary,
      fontWeight: '700',
    },
    actionNeededBadge: {
      backgroundColor: theme.warningLight,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: BorderRadius.sm,
    },
    actionNeededBadgeText: {
      ...Typography.caption,
      fontSize: 11,
      color: theme.secondary,
      fontWeight: '700',
    },
    warningDescription: {
      ...Typography.caption,
      color: theme.secondary,
      lineHeight: 18,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      gap: Spacing.md,
      ...Shadows.sm,
    },
    productHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    productAvatar: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    productHeaderInfo: {
      flex: 1,
      gap: 4,
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    categoryBadge: {
      backgroundColor: theme.primaryLight,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    categoryBadgeText: {
      ...Typography.caption,
      color: theme.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    unitMetaText: {
      ...Typography.caption,
      color: theme.textSecondary,
      fontSize: 12,
    },
    productName: {
      ...Typography.heading2,
      color: theme.textPrimary,
    },
    archivedPill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.errorLight,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      marginTop: 2,
    },
    archivedPillText: {
      ...Typography.caption,
      color: theme.error,
      fontSize: 11,
      fontWeight: '700',
    },
    metaGrid: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    metaCol: {
      flex: 1,
      gap: 2,
    },
    metaLabel: {
      ...Typography.caption,
      color: theme.textMuted,
      fontSize: 12,
    },
    metaValue: {
      ...Typography.label,
      color: theme.textPrimary,
      fontWeight: '600',
    },
    barcodeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    pricingSection: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    priceCol: {
      flex: 1,
      gap: 2,
    },
    priceColLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
      fontSize: 12,
    },
    salePriceValue: {
      ...Typography.heading2,
      color: theme.primary,
      fontWeight: '700',
    },
    costAndProfitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 2,
    },
    costPriceValue: {
      ...Typography.body,
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    priceSubHint: {
      ...Typography.caption,
      color: theme.textMuted,
      fontSize: 11,
    },
    profitBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      marginTop: 4,
    },
    profitBadgeText: {
      ...Typography.caption,
      color: theme.primary,
      fontSize: 11,
      fontWeight: '600',
    },
    stockMicroGrid: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    stockGridItem: {
      flex: 1,
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.lg,
      padding: Spacing.sm,
      gap: 2,
    },
    stockGridLabel: {
      ...Typography.caption,
      color: theme.textMuted,
      fontSize: 11,
    },
    stockValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    stockGridValue: {
      ...Typography.label,
      color: theme.textPrimary,
      fontWeight: '600',
      fontSize: 13,
    },
    adjustStockButton: {
      height: 48,
      borderRadius: BorderRadius.xl,
      backgroundColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      ...Shadows.sm,
    },
    adjustStockButtonText: {
      ...Typography.label,
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 15,
    },
    historySection: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      gap: Spacing.md,
      ...Shadows.sm,
    },
    historySectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    historyTitle: {
      ...Typography.heading3,
      color: theme.textPrimary,
    },
    historySubtitle: {
      ...Typography.caption,
      color: theme.textSecondary,
      fontSize: 12,
    },
    emptyHistoryWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xl,
      gap: Spacing.xs,
    },
    emptyHistoryText: {
      ...Typography.caption,
      color: theme.textMuted,
    },
    historyList: {
      gap: Spacing.xs,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
    },
    historyRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    movementIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    movementTextWrap: {
      flex: 1,
      gap: 1,
    },
    movementType: {
      ...Typography.label,
      color: theme.textPrimary,
      fontWeight: '600',
      fontSize: 13,
    },
    movementNote: {
      ...Typography.caption,
      color: theme.textSecondary,
      fontSize: 12,
    },
    movementDate: {
      ...Typography.caption,
      color: theme.textMuted,
      fontSize: 11,
    },
    historyRowRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    quantityPill: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    quantityPillPositive: {
      backgroundColor: theme.primaryLight,
    },
    quantityPillNegative: {
      backgroundColor: theme.errorLight,
    },
    quantityPillText: {
      ...Typography.caption,
      fontWeight: '600',
      fontSize: 12,
    },
    quantityPillTextPositive: {
      color: theme.primary,
    },
    quantityPillTextNegative: {
      color: theme.error,
    },
    balanceText: {
      ...Typography.caption,
      color: theme.textMuted,
      fontSize: 11,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 4,
    },
  });
