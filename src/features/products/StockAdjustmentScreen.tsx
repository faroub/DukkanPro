import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRoute, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getById, adjustStock } from '@/database/repositories/productRepository';
import { Product } from '@/types/entities';
import { formatCentimes } from '@/utils/money';

export type AdjustmentMode = 'set' | 'delta';

export type AdjustmentReasonKey =
  | 'delivery'
  | 'count_correction'
  | 'damaged'
  | 'return'
  | 'other';

interface ReasonOption {
  key: AdjustmentReasonKey;
  labelKey: string;
  defaultLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const REASONS: ReasonOption[] = [
  {
    key: 'delivery',
    labelKey: 'products:reasonDelivery',
    defaultLabel: 'New stock delivery / Restock',
    icon: 'cube-outline',
    color: Colors.light.primary,
  },
  {
    key: 'count_correction',
    labelKey: 'products:reasonCorrection',
    defaultLabel: 'Inventory count correction',
    icon: 'checkbox-outline',
    color: Colors.light.textSecondary,
  },
  {
    key: 'damaged',
    labelKey: 'products:reasonDamaged',
    defaultLabel: 'Damaged or expired goods',
    icon: 'alert-circle-outline',
    color: Colors.light.warning,
  },
  {
    key: 'return',
    labelKey: 'products:reasonReturn',
    defaultLabel: 'Customer return',
    icon: 'arrow-undo-outline',
    color: Colors.light.error,
  },
  {
    key: 'other',
    labelKey: 'products:reasonOther',
    defaultLabel: 'Other',
    icon: 'ellipsis-horizontal-circle-outline',
    color: Colors.light.textMuted,
  },
];

export function StockAdjustmentScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const route = useRoute();
  const localParams = useLocalSearchParams<{
    productId?: string | number;
    productName?: string;
    currentStock?: string | number;
  }>();
  const routeParams = (route.params || {}) as {
    productId?: string | number;
    productName?: string;
    currentStock?: string | number;
  };
  const params = { ...routeParams, ...localParams };

  const productId = params.productId ? Number(params.productId) : null;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AdjustmentMode>('set');
  const [value, setValue] = useState<number>(0);
  const [reason, setReason] = useState<AdjustmentReasonKey>('delivery');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load product from database
  useEffect(() => {
    let isMounted = true;
    if (productId) {
      (async () => {
        try {
          setLoading(true);
          const p = await getById(productId);
          if (isMounted && p) {
            setProduct(p);
            setValue(p.stock_quantity);
          }
        } catch (err) {
          console.error('Failed to load product for stock adjustment:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const currentStock = product?.stock_quantity ?? (params.currentStock ? Number(params.currentStock) : 0);
  const unitLabel = product?.unit ?? 'units';
  const minStock = product?.minimum_stock_quantity ?? 0;
  const costCentimes = product?.cost_price_centimes ?? 0;

  // Calculate new total and delta
  const { newTotal, delta } = useMemo(() => {
    if (mode === 'set') {
      const target = Math.max(0, value);
      return {
        newTotal: target,
        delta: target - currentStock,
      };
    } else {
      const change = value;
      const target = Math.max(0, currentStock + change);
      return {
        newTotal: target,
        delta: target - currentStock,
      };
    }
  }, [mode, value, currentStock]);

  // Inventory value change in centimes
  const valueChangeCentimes = delta * costCentimes;

  const handleStep = (step: number) => {
    setValue((prev) => {
      if (mode === 'set') {
        return Math.max(0, prev + step);
      } else {
        return prev + step;
      }
    });
  };

  const handleSwitchMode = (newMode: AdjustmentMode) => {
    setMode(newMode);
    if (newMode === 'set') {
      setValue(currentStock);
    } else {
      setValue(0);
    }
  };

  const handleConfirm = useCallback(async () => {
    if (!productId) {
      Alert.alert(t('common:error'), 'No product ID specified');
      return;
    }

    if (delta === 0) {
      Alert.alert(
        t('products:adjustmentMethod'),
        'Adjustment quantity is 0. Please specify an adjustment.'
      );
      return;
    }

    const selectedReasonObj = REASONS.find((r) => r.key === reason);
    const reasonTitle = selectedReasonObj
      ? t(selectedReasonObj.labelKey, selectedReasonObj.defaultLabel)
      : reason;
    const fullReason = note.trim()
      ? `${reasonTitle} — ${note.trim()}`
      : reasonTitle;

    try {
      setSubmitting(true);
      await adjustStock(productId, delta, fullReason);
      Alert.alert(
        t('common:success'),
        t('products:adjustmentSuccess'),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert(t('common:error'), err?.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  }, [productId, delta, reason, note, t, router]);

  if (loading) {
    return (
      <ThemedView type="background" style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>{t('common:loading')}</ThemedText>
      </ThemedView>
    );
  }

  const isLowStock = currentStock <= minStock;

  return (
    <ThemedView type="background" style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {t('products:adjustStock')}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Visual Header Summary Card */}
        <ThemedView style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.productInfoLeft}>
              <View style={styles.productIconContainer}>
                <Ionicons name="cube" size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.productTextWrap}>
                <ThemedText style={styles.productName} numberOfLines={1}>
                  {product?.name || params.productName || 'Product'}
                </ThemedText>
                <ThemedText style={styles.productMeta}>
                  {product?.sku ? `${product.sku} • ` : ''}
                  {t('products:unit')}: {unitLabel}
                </ThemedText>
              </View>
            </View>
            {isLowStock ? (
              <View style={styles.lowStockBadge}>
                <Ionicons name="warning" size={14} color={Colors.light.secondary} />
                <ThemedText style={styles.lowStockBadgeText}>
                  {t('products:lowStock')}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {/* Stock Status Ribbon */}
          <View style={styles.stockRibbon}>
            <View>
              <ThemedText style={styles.ribbonLabel}>
                {t('products:currentOnHand')}
              </ThemedText>
              <ThemedText style={styles.ribbonValue}>
                {currentStock} <ThemedText style={styles.ribbonUnit}>{unitLabel}</ThemedText>
              </ThemedText>
            </View>
            <View style={styles.ribbonRight}>
              <ThemedText style={styles.ribbonLabel}>
                {t('products:minThreshold')}
              </ThemedText>
              <ThemedText style={styles.ribbonThreshold}>
                Min: {minStock} {unitLabel}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Adjustment Form Card */}
        <ThemedView style={styles.card}>
          {/* Mode Selection Pills */}
          <View style={styles.formSection}>
            <ThemedText style={styles.sectionLabel}>
              {t('products:adjustmentMethod')}
            </ThemedText>
            <View style={styles.modeSelectorContainer}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'set' && styles.modeButtonActive]}
                onPress={() => handleSwitchMode('set')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="pin-outline"
                  size={16}
                  color={mode === 'set' ? Colors.light.primary : Colors.light.textSecondary}
                />
                <ThemedText
                  style={[styles.modeButtonText, mode === 'set' && styles.modeButtonTextActive]}
                >
                  {t('products:setNewTotal')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, mode === 'delta' && styles.modeButtonActive]}
                onPress={() => handleSwitchMode('delta')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="swap-vertical-outline"
                  size={16}
                  color={mode === 'delta' ? Colors.light.primary : Colors.light.textSecondary}
                />
                <ThemedText
                  style={[styles.modeButtonText, mode === 'delta' && styles.modeButtonTextActive]}
                >
                  {t('products:addRemove')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stepper Quantity Input Section */}
          <View style={styles.formSection}>
            <View style={styles.quantityHeaderRow}>
              <ThemedText style={styles.sectionLabel}>
                {mode === 'set'
                  ? t('products:newTotalQuantity')
                  : t('products:adjustmentQuantity')}
              </ThemedText>
              <ThemedText style={styles.currentQtyHint}>
                {t('products:currentOnHand')}: {currentStock}
              </ThemedText>
            </View>

            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperActionBtn}
                onPress={() => handleStep(-1)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={24} color={Colors.light.textPrimary} />
              </TouchableOpacity>

              <TextInput
                style={styles.stepperDisplayInput}
                value={value.toString()}
                onChangeText={(text) => {
                  if (mode === 'set') {
                    const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                    setValue(isNaN(num) ? 0 : num);
                  } else {
                    const clean = text.replace(/[^0-9-]/g, '');
                    const num = parseInt(clean, 10);
                    setValue(isNaN(num) ? 0 : num);
                  }
                }}
                keyboardType="numeric"
                selectTextOnFocus
              />

              <TouchableOpacity
                style={styles.stepperActionBtn}
                onPress={() => handleStep(1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={24} color={Colors.light.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Live Stock Change Dynamic Badge */}
            <View style={styles.diffBadgeWrap}>
              {delta > 0 ? (
                <View style={[styles.diffBadge, styles.diffBadgePositive]}>
                  <Ionicons name="trending-up" size={16} color={Colors.light.primary} />
                  <ThemedText style={styles.diffBadgeTextPositive}>
                    +{delta} {unitLabel} will be added to inventory
                  </ThemedText>
                </View>
              ) : delta < 0 ? (
                <View style={[styles.diffBadge, styles.diffBadgeNegative]}>
                  <Ionicons name="trending-down" size={16} color={Colors.light.error} />
                  <ThemedText style={styles.diffBadgeTextNegative}>
                    {delta} {unitLabel} will be removed from inventory
                  </ThemedText>
                </View>
              ) : (
                <View style={[styles.diffBadge, styles.diffBadgeNeutral]}>
                  <ThemedText style={styles.diffBadgeTextNeutral}>
                    No change in inventory balance
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Reason for Adjustment */}
          <View style={styles.formSection}>
            <View style={styles.reasonHeaderRow}>
              <ThemedText style={styles.sectionLabel}>
                {t('products:adjustmentReason')}{' '}
                <ThemedText style={styles.asterisk}>*</ThemedText>
              </ThemedText>
              <ThemedText style={styles.requiredCaption}>
                {t('products:reasonRequired')}
              </ThemedText>
            </View>

            <View style={styles.reasonsList}>
              {REASONS.map((r) => {
                const isSelected = reason === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.reasonCard, isSelected && styles.reasonCardSelected]}
                    onPress={() => setReason(r.key)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.reasonLeft}>
                      <Ionicons
                        name={r.icon}
                        size={20}
                        color={isSelected ? Colors.light.primary : r.color}
                      />
                      <ThemedText
                        style={[
                          styles.reasonLabel,
                          isSelected && styles.reasonLabelSelected,
                        ]}
                      >
                        {t(r.labelKey, r.defaultLabel)}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Optional Reference Note */}
          <View style={styles.formSection}>
            <View style={styles.reasonHeaderRow}>
              <ThemedText style={styles.sectionLabel}>
                {t('products:referenceNote')}
              </ThemedText>
              <ThemedText style={styles.optionalCaption}>
                {t('products:referenceNoteOptional')}
              </ThemedText>
            </View>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder={t('products:referenceNotePlaceholder')}
              placeholderTextColor={Colors.light.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>
        </ThemedView>

        {/* Summary Impact Highlight Box */}
        <ThemedView style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.impactTitle}>
              {t('products:impactSummary')}
            </ThemedText>
          </View>

          <View style={styles.impactRow}>
            <ThemedText style={styles.impactRowLabel}>
              {t('products:newInventoryBalance')}
            </ThemedText>
            <View style={styles.impactBalanceGroup}>
              <ThemedText style={styles.impactBalanceValue}>
                {newTotal} {unitLabel}
              </ThemedText>
              <View
                style={[
                  styles.impactStatusBadge,
                  newTotal < minStock && styles.impactStatusBadgeWarning,
                ]}
              >
                <ThemedText
                  style={[
                    styles.impactStatusBadgeText,
                    newTotal < minStock && styles.impactStatusBadgeTextWarning,
                  ]}
                >
                  {newTotal >= minStock
                    ? `Normal ≥ ${minStock}`
                    : `Low Stock < ${minStock}`}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.impactRow}>
            <ThemedText style={styles.impactRowLabel}>
              {t('products:inventoryValueChange')}
            </ThemedText>
            <ThemedText style={styles.impactCostChange}>
              {delta >= 0 ? '+' : ''}
              {formatCentimes(valueChangeCentimes, i18n.language as any)}{' '}
              <ThemedText style={styles.atCostText}>
                ({t('products:atCost')})
              </ThemedText>
            </ThemedText>
          </View>
        </ThemedView>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />
            <ThemedText style={styles.confirmButtonText}>
              {t('products:confirmAdjustment')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.cancelButtonText}>
              {t('products:cancel')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
    color: Colors.light.textPrimary,
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
  summaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  productInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  productIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTextWrap: {
    flex: 1,
  },
  productName: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  productMeta: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  lowStockBadgeText: {
    ...Typography.caption,
    color: Colors.light.secondary,
    fontWeight: '600',
    fontSize: 12,
  },
  stockRibbon: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: '#F0F3FF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  ribbonLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  ribbonValue: {
    ...Typography.heading2,
    color: Colors.light.textPrimary,
    fontWeight: '700',
  },
  ribbonUnit: {
    ...Typography.caption,
    fontWeight: 'normal',
    color: Colors.light.textSecondary,
  },
  ribbonRight: {
    alignItems: 'flex-end',
  },
  ribbonThreshold: {
    ...Typography.label,
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.lg,
    ...Shadows.sm,
  },
  formSection: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.light.textPrimary,
    fontWeight: '600',
  },
  asterisk: {
    color: Colors.light.error,
  },
  modeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F3FF',
    borderRadius: BorderRadius.lg,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  modeButtonText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  quantityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentQtyHint: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepperActionBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F0F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisplayInput: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  diffBadgeWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  diffBadgePositive: {
    backgroundColor: Colors.light.primaryLight,
  },
  diffBadgeTextPositive: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  diffBadgeNegative: {
    backgroundColor: Colors.light.errorLight,
  },
  diffBadgeTextNegative: {
    ...Typography.caption,
    color: Colors.light.error,
    fontWeight: '600',
  },
  diffBadgeNeutral: {
    backgroundColor: '#F0F3FF',
  },
  diffBadgeTextNeutral: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requiredCaption: {
    ...Typography.caption,
    color: Colors.light.error,
    fontSize: 12,
  },
  optionalCaption: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  reasonsList: {
    gap: Spacing.xs,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F0F3FF',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonCardSelected: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
  },
  reasonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  reasonLabel: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  reasonLabelSelected: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.light.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  noteInput: {
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.light.textPrimary,
    minHeight: 56,
  },
  impactCard: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  impactTitle: {
    ...Typography.label,
    color: Colors.light.primary,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  impactRowLabel: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  impactBalanceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  impactBalanceValue: {
    ...Typography.heading3,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  impactStatusBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  impactStatusBadgeWarning: {
    backgroundColor: Colors.light.warningLight,
  },
  impactStatusBadgeText: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  impactStatusBadgeTextWarning: {
    color: Colors.light.secondary,
  },
  impactCostChange: {
    ...Typography.label,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  atCostText: {
    fontWeight: 'normal',
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  actionsContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  confirmButton: {
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  confirmButtonText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelButton: {
    height: 44,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...Typography.label,
    color: Colors.light.textSecondary,
  },
});
