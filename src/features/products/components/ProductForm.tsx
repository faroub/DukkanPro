import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { formatCentimes } from '@/utils/money';

export interface ProductFormData {
  name: string;
  sku: string | null;
  category: string | null;
  sale_price_centimes: number;
  cost_price_centimes: number;
  stock_quantity: number;
  minimum_stock_quantity: number;
  unit: string;
  is_active: boolean;
}

export interface ProductFormProps {
  productId?: number;
  initialValues?: Partial<ProductFormData>;
  onSave: (product: ProductFormData) => Promise<void> | void;
  onClose: () => void;
  onArchive?: () => Promise<void> | void;
  onNavigateStockAdjustment?: () => void;
  mode: 'create' | 'edit';
}

const DEFAULT_CATEGORIES = [
  'Dairy & Fresh',
  'Groceries',
  'Beverages',
  'Bakery',
  'Household',
  'Snacks',
];

const DEFAULT_UNITS = [
  { value: 'Piece', label: 'Piece (pc)' },
  { value: 'Pack', label: 'Pack (pk)' },
  { value: 'Kilogram', label: 'Kilogram (kg)' },
  { value: 'Litre', label: 'Litre (L)' },
  { value: 'Box', label: 'Box (bx)' },
  { value: 'Other', label: 'Other' },
];

export function ProductForm({
  productId,
  initialValues,
  onSave,
  onClose,
  onArchive,
  onNavigateStockAdjustment,
  mode,
}: ProductFormProps) {
  const { t, i18n } = useTranslation();

  const [name, setName] = useState(initialValues?.name || '');
  const [sku, setSku] = useState(initialValues?.sku || '');
  const [category, setCategory] = useState(initialValues?.category || '');
  const [salePriceDzd, setSalePriceDzd] = useState(
    initialValues?.sale_price_centimes
      ? (initialValues.sale_price_centimes / 100).toString()
      : ''
  );
  const [costPriceDzd, setCostPriceDzd] = useState(
    initialValues?.cost_price_centimes
      ? (initialValues.cost_price_centimes / 100).toString()
      : ''
  );
  const [stockQuantity, setStockQuantity] = useState(
    initialValues?.stock_quantity !== undefined ? initialValues.stock_quantity : 10
  );
  const [minStockAlert, setMinStockAlert] = useState(
    initialValues?.minimum_stock_quantity !== undefined
      ? initialValues.minimum_stock_quantity.toString()
      : '5'
  );
  const [unit, setUnit] = useState(initialValues?.unit || 'Pack');
  const [isActive, setIsActive] = useState(initialValues?.is_active !== false);

  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    const list = [...DEFAULT_CATEGORIES];
    if (initialValues?.category && !list.includes(initialValues.category)) {
      list.push(initialValues.category);
    }
    return list;
  });

  const [isNewCatModalVisible, setIsNewCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);

  const [nameTouched, setNameTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live profit & margin calculation
  const saleDinars = parseFloat(salePriceDzd) || 0;
  const costDinars = parseFloat(costPriceDzd) || 0;
  const profitDinars = saleDinars - costDinars;
  const marginPercentage = saleDinars > 0 ? (profitDinars / saleDinars) * 100 : 0;

  const marginHealth = useMemo(() => {
    if (saleDinars <= 0 && costDinars <= 0) return null;
    if (profitDinars < 0) return { label: t('products:marginLoss', 'Loss'), color: Colors.light.error, bg: Colors.light.errorLight };
    if (marginPercentage < 15) return { label: t('products:marginLow', 'Low Margin'), color: Colors.light.secondary, bg: Colors.light.warningLight };
    return { label: t('products:marginHealthy', 'Healthy'), color: Colors.light.primary, bg: Colors.light.primaryLight };
  }, [saleDinars, costDinars, profitDinars, marginPercentage, t]);

  const isNameValid = name.trim().length > 0;

  const handleSelectCategory = (cat: string) => {
    if (category === cat) {
      setCategory('');
    } else {
      setCategory(cat);
    }
  };

  const handleAddNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (!categoriesList.includes(trimmed)) {
      setCategoriesList((prev) => [...prev, trimmed]);
    }
    setCategory(trimmed);
    setNewCatName('');
    setIsNewCatModalVisible(false);
  };

  const handleStockAdjust = (delta: number) => {
    setStockQuantity((prev) => Math.max(0, prev + delta));
  };

  const handleSubmit = async () => {
    setNameTouched(true);
    if (!isNameValid) {
      setErrorMsg(t('products:productNameRequired'));
      return;
    }

    const saleCentimes = Math.round((parseFloat(salePriceDzd) || 0) * 100);
    const costCentimes = Math.round((parseFloat(costPriceDzd) || 0) * 100);
    const minStock = parseInt(minStockAlert, 10) || 0;

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onSave({
        name: name.trim(),
        sku: sku.trim() || null,
        category: category.trim() || null,
        sale_price_centimes: saleCentimes,
        cost_price_centimes: costCentimes,
        stock_quantity: stockQuantity,
        minimum_stock_quantity: minStock,
        unit: unit.trim() || 'Piece',
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || t('common:error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView type="background" style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
            {t(mode === 'create' ? 'products:addProduct' : 'products:editProduct')}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.quickSaveButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <ThemedText style={styles.quickSaveText}>
            {t('products:save')}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Item Details section title */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="cube-outline" size={18} color={Colors.light.primary} />
            </View>
            <ThemedText style={styles.sectionHeaderTitle}>
              {t('products:itemDetails')}
            </ThemedText>
          </View>
        </View>

        {errorMsg ? (
          <View style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={18} color={Colors.light.error} />
            <ThemedText style={styles.errorAlertText}>{errorMsg}</ThemedText>
          </View>
        ) : null}

        {/* Card 1: General Information */}
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>
              {t('products:generalInformation')}
            </ThemedText>
            <View style={styles.badgeDraft}>
              <ThemedText style={styles.badgeDraftText}>
                {mode === 'create'
                  ? t('products:activeDraft', 'Active draft')
                  : isActive
                  ? t('products:active', 'Active')
                  : t('products:archivedBadge', 'Archived')}
              </ThemedText>
            </View>
          </View>

          {/* Product Name */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>
                {t('products:name')} <ThemedText style={styles.asterisk}>*</ThemedText>
              </ThemedText>
              {isNameValid ? (
                <View style={styles.validRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
                  <ThemedText style={styles.validText}>{t('products:valid')}</ThemedText>
                </View>
              ) : null}
            </View>
            <TextInput
              style={[
                styles.textInput,
                nameTouched && !isNameValid ? styles.textInputError : null,
              ]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameTouched) setErrorMsg('');
              }}
              onBlur={() => setNameTouched(true)}
              placeholder="e.g., Lait Candia 1L, Café Moulu..."
              placeholderTextColor={Colors.light.textMuted}
              autoCapitalize="words"
            />
            {nameTouched && !isNameValid ? (
              <ThemedText style={styles.fieldErrorText}>
                {t('products:productNameRequired')}
              </ThemedText>
            ) : null}
          </View>

          {/* SKU / Barcode */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>
              {t('products:skuBarcodeOptional')}
            </ThemedText>
            <View style={styles.inputWithIconWrapper}>
              <TextInput
                style={[styles.textInput, styles.inputWithIcon]}
                value={sku}
                onChangeText={setSku}
                placeholder="e.g., SKU-44021 or scan barcode"
                placeholderTextColor={Colors.light.textMuted}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.inputIconRight}
                onPress={() => {
                  Alert.alert(t('products:scanBarcode'), 'Barcode scanner will read EAN-13 codes.');
                }}
              >
                <Ionicons name="barcode-outline" size={22} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>
              {t('products:categoryOptional')}
            </ThemedText>
            <View style={styles.categoryChipsWrap}>
              {categoriesList.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                    onPress={() => handleSelectCategory(cat)}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#FFFFFF"
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <ThemedText
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={styles.newCategoryChip}
                onPress={() => setIsNewCatModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={Colors.light.primary} />
                <ThemedText style={styles.newCategoryChipText}>
                  {t('products:newCategory')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>

        {/* Card 2: Pricing & Margins */}
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeftGroup}>
              <Ionicons name="cash-outline" size={18} color={Colors.light.primary} />
              <ThemedText style={styles.cardTitle}>
                {t('products:pricingAndMargins')}
              </ThemedText>
            </View>
            <View style={styles.badgeNeutral}>
              <ThemedText style={styles.badgeNeutralText}>
                {t('products:dzdCurrency', 'DZD Currency')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.rowTwoCols}>
            {/* Sale Price */}
            <View style={styles.colHalf}>
              <ThemedText style={styles.label}>
                {t('products:salePrice')} <ThemedText style={styles.asterisk}>*</ThemedText>
              </ThemedText>
              <View style={styles.inputWithSuffixWrapper}>
                <TextInput
                  style={[styles.textInput, styles.inputWithSuffix]}
                  value={salePriceDzd}
                  onChangeText={setSalePriceDzd}
                  placeholder="0"
                  placeholderTextColor={Colors.light.textMuted}
                  keyboardType="decimal-pad"
                />
                <ThemedText style={styles.inputSuffix}>DZD</ThemedText>
              </View>
            </View>

            {/* Cost Price */}
            <View style={styles.colHalf}>
              <ThemedText style={styles.label}>
                {t('products:costPrice')}
              </ThemedText>
              <View style={styles.inputWithSuffixWrapper}>
                <TextInput
                  style={[styles.textInput, styles.inputWithSuffix]}
                  value={costPriceDzd}
                  onChangeText={setCostPriceDzd}
                  placeholder="0"
                  placeholderTextColor={Colors.light.textMuted}
                  keyboardType="decimal-pad"
                />
                <ThemedText style={styles.inputSuffix}>DZD</ThemedText>
              </View>
            </View>
          </View>

          {/* Live Profit Margin Card */}
          <View style={styles.profitCard}>
            <View style={styles.profitLeft}>
              <Ionicons name="trending-up" size={20} color={Colors.light.primary} />
              <View>
                <ThemedText style={styles.profitLabel}>
                  {t('products:estimatedProfit')}
                </ThemedText>
                <ThemedText style={styles.profitAmount}>
                  {profitDinars.toLocaleString()} DZD ({marginPercentage.toFixed(1)}%)
                </ThemedText>
              </View>
            </View>
            {marginHealth && (
              <View style={[styles.marginBadge, { backgroundColor: marginHealth.bg }]}>
                <ThemedText style={[styles.marginBadgeText, { color: marginHealth.color }]}>
                  {marginHealth.label}
                </ThemedText>
              </View>
            )}
          </View>
        </ThemedView>

        {/* Card 3: Stock Inventory */}
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeftGroup}>
              <Ionicons name="storefront-outline" size={18} color={Colors.light.primary} />
              <ThemedText style={styles.cardTitle}>
                {t('products:stockInventory')}
              </ThemedText>
            </View>
            <View style={styles.badgeWarning}>
              <ThemedText style={styles.badgeWarningText}>
                {t('products:thresholdAlert', 'Threshold Alert')}
              </ThemedText>
            </View>
          </View>

          {mode === 'create' ? (
            <View style={styles.rowTwoCols}>
              {/* Opening Stock Stepper */}
              <View style={styles.colHalf}>
                <ThemedText style={styles.label}>
                  {t('products:openingStock')} <ThemedText style={styles.asterisk}>*</ThemedText>
                </ThemedText>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => handleStockAdjust(-1)}
                  >
                    <Ionicons name="remove" size={18} color={Colors.light.textPrimary} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.stepperInput}
                    value={stockQuantity.toString()}
                    onChangeText={(val) => {
                      const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                      setStockQuantity(isNaN(num) ? 0 : num);
                    }}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => handleStockAdjust(1)}
                  >
                    <Ionicons name="add" size={18} color={Colors.light.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Unit selector */}
              <View style={styles.colHalf}>
                <ThemedText style={styles.label}>
                  {t('products:unit')} <ThemedText style={styles.asterisk}>*</ThemedText>
                </ThemedText>
                <TouchableOpacity
                  style={styles.unitDropdown}
                  onPress={() => setIsUnitModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.unitDropdownText}>{unit}</ThemedText>
                  <Ionicons name="chevron-down" size={18} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Edit Mode: Read-only Current in-stock with link to Stock Adjustment
            <View style={styles.currentStockCard}>
              <View style={styles.currentStockTopRow}>
                <View style={styles.currentStockLeft}>
                  <Ionicons name="file-tray-stacked-outline" size={20} color={Colors.light.textSecondary} />
                  <ThemedText style={styles.currentStockLabel}>
                    {t('products:currentOnHand')}
                  </ThemedText>
                </View>
                <View style={styles.currentStockQtyRow}>
                  <ThemedText style={styles.currentStockNumber}>{stockQuantity}</ThemedText>
                  <ThemedText style={styles.currentStockUnit}>{unit}</ThemedText>
                </View>
              </View>
              <TouchableOpacity
                style={styles.adjustStockLink}
                onPress={() => {
                  if (onNavigateStockAdjustment) {
                    onNavigateStockAdjustment();
                  } else {
                    Alert.alert(t('products:adjustStock'), 'Navigate to stock adjustment');
                  }
                }}
              >
                <ThemedText style={styles.adjustStockLinkText}>
                  {t('products:adjustStock')}
                </ThemedText>
                <Ionicons name="arrow-forward" size={16} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Unit selector in Edit mode */}
          {mode === 'edit' && (
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>{t('products:unit')}</ThemedText>
              <TouchableOpacity
                style={styles.unitDropdown}
                onPress={() => setIsUnitModalVisible(true)}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.unitDropdownText}>{unit}</ThemedText>
                <Ionicons name="chevron-down" size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Minimum Alert Threshold */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>
                {t('products:minAlertThreshold')} <ThemedText style={styles.asterisk}>*</ThemedText>
              </ThemedText>
              <ThemedText style={styles.safeFloorText}>
                {t('products:safeFloor')}
              </ThemedText>
            </View>
            <View style={styles.inputWithSuffixWrapper}>
              <TextInput
                style={[styles.textInput, styles.inputWithSuffix]}
                value={minStockAlert}
                onChangeText={setMinStockAlert}
                keyboardType="number-pad"
                placeholder="5"
                placeholderTextColor={Colors.light.textMuted}
              />
              <ThemedText style={styles.inputSuffix}>
                {t('products:units')}
              </ThemedText>
            </View>
            <ThemedText style={styles.captionHint}>
              {t('products:alertsWhenLow')}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
            <ThemedText style={styles.primaryButtonText}>
              {t('products:saveProduct')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.cancelButtonText}>
              {t('products:cancel')}
            </ThemedText>
          </TouchableOpacity>

          {mode === 'edit' && onArchive && (
            <TouchableOpacity
              style={styles.archiveButton}
              onPress={onArchive}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? 'archive-outline' : 'refresh-outline'}
                size={18}
                color={isActive ? Colors.light.error : Colors.light.primary}
              />
              <ThemedText
                style={[
                  styles.archiveButtonText,
                  !isActive && { color: Colors.light.primary },
                ]}
              >
                {isActive ? t('products:archiveProduct') : t('products:reactivateProduct')}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modal: New Category Input */}
      <Modal
        visible={isNewCatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNewCatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              {t('products:newCategory')}
            </ThemedText>
            <TextInput
              style={styles.textInput}
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder={t('products:addCategoryPrompt')}
              placeholderTextColor={Colors.light.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsNewCatModalVisible(false)}
              >
                <ThemedText style={styles.modalCancelText}>{t('products:cancel')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleAddNewCategory}
              >
                <ThemedText style={styles.modalConfirmText}>{t('products:save')}</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>

      {/* Modal: Unit Selector */}
      <Modal
        visible={isUnitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUnitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>{t('products:unit')}</ThemedText>
            {DEFAULT_UNITS.map((u) => (
              <TouchableOpacity
                key={u.value}
                style={[styles.unitOption, unit === u.value && styles.unitOptionSelected]}
                onPress={() => {
                  setUnit(u.value);
                  setIsUnitModalVisible(false);
                }}
              >
                <ThemedText
                  style={[
                    styles.unitOptionText,
                    unit === u.value && styles.unitOptionTextSelected,
                  ]}
                >
                  {u.label}
                </ThemedText>
                {unit === u.value && (
                  <Ionicons name="checkmark" size={18} color={Colors.light.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setIsUnitModalVisible(false)}
            >
              <ThemedText style={styles.modalCancelText}>{t('products:cancel')}</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    color: Colors.light.textPrimary,
  },
  quickSaveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  quickSaveText: {
    ...Typography.label,
    color: Colors.light.primary,
    fontWeight: '600',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorAlertText: {
    ...Typography.caption,
    color: Colors.light.error,
    flex: 1,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Typography.label,
    color: Colors.light.textPrimary,
    fontWeight: '600',
  },
  badgeDraft: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeDraftText: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeNeutral: {
    backgroundColor: Colors.light.surfaceAlt,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeNeutralText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  badgeWarning: {
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeWarningText: {
    ...Typography.caption,
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.label,
    color: Colors.light.textPrimary,
    fontSize: 14,
  },
  asterisk: {
    color: Colors.light.error,
  },
  validRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validText: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  textInputError: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.errorLight,
  },
  fieldErrorText: {
    ...Typography.caption,
    color: Colors.light.error,
    fontSize: 12,
  },
  inputWithIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  inputIconRight: {
    position: 'absolute',
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surfaceAlt,
  },
  categoryChipSelected: {
    backgroundColor: Colors.light.primary,
  },
  categoryChipText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  newCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surfaceAlt,
  },
  newCategoryChipText: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  colHalf: {
    flex: 1,
    gap: 6,
  },
  inputWithSuffixWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputWithSuffix: {
    paddingRight: 50,
  },
  inputSuffix: {
    position: 'absolute',
    right: 12,
    ...Typography.caption,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  profitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  profitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  profitLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  profitAmount: {
    ...Typography.label,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  marginBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  marginBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 4,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  unitDropdown: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitDropdownText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  safeFloorText: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  captionHint: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  currentStockCard: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  currentStockTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentStockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currentStockLabel: {
    ...Typography.label,
    color: Colors.light.textPrimary,
  },
  currentStockQtyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentStockNumber: {
    ...Typography.heading2,
    color: Colors.light.textPrimary,
    fontWeight: '700',
  },
  currentStockUnit: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  adjustStockLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  adjustStockLinkText: {
    ...Typography.label,
    color: Colors.light.primary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  actionsContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryButton: {
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  primaryButtonText: {
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
  archiveButton: {
    height: 44,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  archiveButtonText: {
    ...Typography.caption,
    color: Colors.light.error,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.md,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalCancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  modalCancelText: {
    ...Typography.label,
    color: Colors.light.textSecondary,
  },
  modalConfirmBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  modalConfirmText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  unitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  unitOptionSelected: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  unitOptionText: {
    ...Typography.body,
    color: Colors.light.textPrimary,
  },
  unitOptionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
