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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FooterTrademark } from '@/components/FooterTrademark';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  { value: 'Carton', label: 'Carton (ctn)' },
  { value: 'Dozen', label: 'Dozen (dz)' },
  { value: 'Other', label: 'Other' },
];

const THRESHOLD_PRESETS = [0, 3, 5, 10, 20, 50];

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
  const theme = useTheme();

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
  const [unit, setUnit] = useState(initialValues?.unit || 'Piece');
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [targetRestockBatch, setTargetRestockBatch] = useState('12');
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
    if (profitDinars < 0) return { label: t('products:marginLoss', 'Loss'), color: theme.error, bg: theme.errorLight };
    if (marginPercentage < 15) return { label: t('products:marginLow', 'Low Margin'), color: theme.secondary, bg: theme.warningLight };
    return { label: t('products:marginHealthy', 'Healthy'), color: theme.primary, bg: theme.primaryLight };
  }, [saleDinars, costDinars, profitDinars, marginPercentage, t, theme]);

  // Stock status calculation based on current stock vs threshold
  const currentMinThreshold = parseInt(minStockAlert, 10) || 0;
  const stockHealthStatus = useMemo(() => {
    if (stockQuantity <= 0) {
      return {
        label: t('products:stockStatusOut', 'Out of Stock'),
        color: theme.error,
        bg: theme.errorLight,
        icon: 'alert-circle' as const,
      };
    }
    if (stockQuantity <= currentMinThreshold) {
      return {
        label: t('products:stockStatusLow', 'Low Stock Warning'),
        color: (theme as any).warning || (theme as any).secondary || (theme as any).primary,
        bg: theme.warningLight,
        icon: 'warning' as const,
      };
    }
    return {
      label: t('products:stockStatusHealthy', 'Healthy Stock'),
      color: theme.primary,
      bg: theme.primaryLight,
      icon: 'checkmark-circle' as const,
    };
  }, [stockQuantity, currentMinThreshold, t, theme]);

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

  const handlePresetSelect = (presetVal: number) => {
    setMinStockAlert(presetVal.toString());
  };

  const handleSubmit = async () => {
    setNameTouched(true);
    if (!isNameValid) {
      setErrorMsg(t('products:productNameRequired', 'Product name is required'));
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
      setErrorMsg(err?.message || t('common:error', 'Error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.borderLight }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.surfaceAlt }]}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel={t('common:close', 'Close')}
            >
              <Ionicons name="close" size={22} color={theme.textPrimary} />
            </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {mode === 'create'
              ? t('products:newProduct', 'New Product')
              : t('products:editProduct', 'Edit Product')}
          </ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.quickSaveButton, { backgroundColor: theme.primaryLight }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <ThemedText style={[styles.quickSaveText, { color: theme.primary }]}>
            {t('common:save', 'Save')}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Error Alert */}
        {errorMsg ? (
          <View style={[styles.errorAlert, { backgroundColor: theme.errorLight, borderColor: theme.error }]}>
            <Ionicons name="alert-circle" size={20} color={theme.error} />
            <ThemedText style={[styles.errorAlertText, { color: theme.error }]}>
              {errorMsg}
            </ThemedText>
          </View>
        ) : null}

        {/* Card 1: General Information */}
        <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeftGroup}>
              <Ionicons name="cube-outline" size={18} color={theme.primary} />
              <ThemedText style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {t('products:generalInformation', 'General Information')}
              </ThemedText>
            </View>
            <View style={[styles.badgeDraft, { backgroundColor: theme.primaryLight }]}>
              <ThemedText style={[styles.badgeDraftText, { color: theme.primary }]}>
                {mode === 'create' ? t('products:valid', 'New') : t('common:edit', 'Edit')}
              </ThemedText>
            </View>
          </View>

          {/* Product Name */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: theme.textPrimary }]}>
                {t('products:productName', 'Product Name')} <ThemedText style={[styles.asterisk, { color: theme.error }]}>*</ThemedText>
              </ThemedText>
              {nameTouched && isNameValid && (
                <View style={styles.validRow}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                  <ThemedText style={[styles.validText, { color: theme.primary }]}>
                    {t('products:valid', 'Valid')}
                  </ThemedText>
                </View>
              )}
            </View>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.borderLight,
                  color: theme.textPrimary,
                },
                nameTouched && !isNameValid && [styles.textInputError, { borderColor: theme.error, backgroundColor: theme.errorLight }],
              ]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMsg) setErrorMsg('');
              }}
              onBlur={() => setNameTouched(true)}
              placeholder="e.g., Lait Candia 1L, Couscous Sim 1kg"
              placeholderTextColor={theme.textMuted}
            />
            {nameTouched && !isNameValid ? (
              <ThemedText style={[styles.fieldErrorText, { color: theme.error }]}>
                {t('products:productNameRequired', 'Product name is required')}
              </ThemedText>
            ) : null}
          </View>

          {/* SKU / Barcode */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: theme.textPrimary }]}>
              {t('products:skuBarcodeOptional', 'SKU / Barcode (Optional)')}
            </ThemedText>
            <View style={styles.inputWithIconWrapper}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.inputWithIcon,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.borderLight,
                    color: theme.textPrimary,
                  },
                ]}
                value={sku}
                onChangeText={setSku}
                placeholder="e.g., 6130123456789 or SKU-44021"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.inputIconRight}
                onPress={() => {
                  Alert.alert(t('products:scanBarcode', 'Scan Barcode'), 'Ready to scan EAN-13 barcodes.');
                }}
              >
                <Ionicons name="barcode-outline" size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: theme.textPrimary }]}>
              {t('products:categoryOptional', 'Category (Optional)')}
            </ThemedText>
            <View style={styles.categoryChipsWrap}>
              {categoriesList.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surfaceAlt,
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                      },
                    ]}
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
                        {
                          color: isSelected ? '#FFFFFF' : theme.textSecondary,
                        },
                      ]}
                    >
                      {cat}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[
                  styles.newCategoryChip,
                  {
                    backgroundColor: theme.primaryLight,
                    borderColor: theme.primaryLight,
                  },
                ]}
                onPress={() => setIsNewCatModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={theme.primary} />
                <ThemedText style={[styles.newCategoryChipText, { color: theme.primary }]}>
                  {t('products:newCategory', 'New Category')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>

        {/* Card 2: Pricing & Margins */}
        <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeftGroup}>
              <Ionicons name="cash-outline" size={18} color={theme.primary} />
              <ThemedText style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {t('products:pricingAndMargins', 'Pricing & Margins')}
              </ThemedText>
            </View>
            <View style={[styles.badgeNeutral, { backgroundColor: theme.surfaceAlt }]}>
              <ThemedText style={[styles.badgeNeutralText, { color: theme.textSecondary }]}>
                {t('products:dzdCurrency', 'DZD Currency')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.rowTwoCols}>
            {/* Sale Price */}
            <View style={styles.colHalf}>
              <ThemedText style={[styles.label, { color: theme.textPrimary }]}>
                {t('products:salePrice', 'Sale Price')} <ThemedText style={[styles.asterisk, { color: theme.error }]}>*</ThemedText>
              </ThemedText>
              <View style={styles.inputWithSuffixWrapper}>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.inputWithSuffix,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderLight,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={salePriceDzd}
                  onChangeText={setSalePriceDzd}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                />
                <ThemedText style={[styles.inputSuffix, { color: theme.textMuted }]}>DZD</ThemedText>
              </View>
            </View>

            {/* Cost Price */}
            <View style={styles.colHalf}>
              <ThemedText style={[styles.label, { color: theme.textPrimary }]}>
                {t('products:costPrice', 'Cost Price')}
              </ThemedText>
              <View style={styles.inputWithSuffixWrapper}>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.inputWithSuffix,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderLight,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={costPriceDzd}
                  onChangeText={setCostPriceDzd}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                />
                <ThemedText style={[styles.inputSuffix, { color: theme.textMuted }]}>DZD</ThemedText>
              </View>
            </View>
          </View>

          {/* Live Profit Margin Card */}
          <View style={[styles.profitCard, { backgroundColor: theme.primaryLight }]}>
            <View style={styles.profitLeft}>
              <Ionicons name="trending-up" size={20} color={theme.primary} />
              <View>
                <ThemedText style={[styles.profitLabel, { color: theme.textSecondary }]}>
                  {t('products:estimatedProfit', 'Estimated Profit')}
                </ThemedText>
                <ThemedText style={[styles.profitAmount, { color: theme.primary }]}>
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

        {/* Card 3: Dedicated Product Inventory Rules & Stock Controls */}
        <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeftGroup}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
              <ThemedText style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {t('products:inventoryRulesTitle', 'Inventory Rules & Stock Controls')}
              </ThemedText>
            </View>
          </View>

          {/* Live Stock Health Badge under section title */}
          <View style={styles.healthBadgeContainer}>
            <View style={[styles.healthBadge, { backgroundColor: stockHealthStatus.bg }]}>
              <Ionicons name={stockHealthStatus.icon} size={13} color={stockHealthStatus.color} style={{ marginRight: 4 }} />
              <ThemedText style={[styles.healthBadgeText, { color: stockHealthStatus.color }]}>
                {stockHealthStatus.label}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.sectionSubtitleText, { color: theme.textSecondary }]}>
            {t('products:inventoryRulesSubtitle', 'Configure specific thresholds and selling rules for this product')}
          </ThemedText>

          {/* Stock on Hand & Unit Section */}
          {mode === 'create' ? (
            <View style={styles.rowTwoCols}>
              {/* Opening Stock Stepper */}
              <View style={styles.colHalf}>
                <ThemedText style={[styles.label, { color: theme.textPrimary }]}>
                  {t('products:openingStock', 'Opening Stock')} <ThemedText style={[styles.asterisk, { color: theme.error }]}>*</ThemedText>
                </ThemedText>
                <View style={[styles.stepperContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderLight }]}>
                  <TouchableOpacity
                    style={[styles.stepperButton, { backgroundColor: theme.surface }]}
                    onPress={() => handleStockAdjust(-1)}
                  >
                    <Ionicons name="remove" size={18} color={theme.textPrimary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.stepperInput, { color: theme.textPrimary }]}
                    value={stockQuantity.toString()}
                    onChangeText={(val) => {
                      const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                      setStockQuantity(isNaN(num) ? 0 : num);
                    }}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={[styles.stepperButton, { backgroundColor: theme.surface }]}
                    onPress={() => handleStockAdjust(1)}
                  >
                    <Ionicons name="add" size={18} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Unit selector */}
              <View style={styles.colHalf}>
                <ThemedText style={[styles.label, { color: theme.textPrimary }]}>
                  {t('products:unit', 'Unit')} <ThemedText style={[styles.asterisk, { color: theme.error }]}>*</ThemedText>
                </ThemedText>
                <TouchableOpacity
                  style={[styles.unitDropdown, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderLight }]}
                  onPress={() => setIsUnitModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.unitDropdownText, { color: theme.textPrimary }]}>{unit}</ThemedText>
                  <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Edit Mode: Read-only Current in-stock with link to Stock Adjustment
            <View style={[styles.currentStockCard, { backgroundColor: theme.surfaceAlt }]}>
              <View style={styles.currentStockTopRow}>
                <View style={styles.currentStockLeft}>
                  <Ionicons name="file-tray-stacked-outline" size={20} color={theme.textSecondary} />
                  <ThemedText style={[styles.currentStockLabel, { color: theme.textPrimary }]}>
                    {t('products:currentOnHand', 'Current On-Hand')}
                  </ThemedText>
                </View>
                <View style={styles.currentStockQtyRow}>
                  <ThemedText style={[styles.currentStockNumber, { color: theme.textPrimary }]}>{stockQuantity}</ThemedText>
                  <ThemedText style={[styles.currentStockUnit, { color: theme.textSecondary }]}>{unit}</ThemedText>
                </View>
              </View>
              <TouchableOpacity
                style={styles.adjustStockLink}
                onPress={() => {
                  if (onNavigateStockAdjustment) {
                    onNavigateStockAdjustment();
                  } else {
                    Alert.alert(t('products:adjustStock', 'Adjust Stock'), 'Navigate to stock adjustment');
                  }
                }}
              >
                <ThemedText style={[styles.adjustStockLinkText, { color: theme.primary }]}>
                  {t('products:adjustStock', 'Adjust Stock')}
                </ThemedText>
                <Ionicons name="arrow-forward" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Unit selector in Edit mode */}
          {mode === 'edit' && (
            <View style={styles.formGroup}>
              <ThemedText style={[styles.label, { color: theme.textPrimary }]}>{t('products:unit', 'Unit')}</ThemedText>
              <TouchableOpacity
                style={[styles.unitDropdown, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderLight }]}
                onPress={() => setIsUnitModalVisible(true)}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.unitDropdownText, { color: theme.textPrimary }]}>{unit}</ThemedText>
                <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Product-Specific Rule 1: Minimum Low-Stock Alert Threshold */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: theme.textPrimary }]}>
                {t('products:minAlertThreshold', 'Minimum Alert Threshold')} <ThemedText style={[styles.asterisk, { color: theme.error }]}>*</ThemedText>
              </ThemedText>
              <ThemedText style={[styles.safeFloorText, { color: theme.textMuted }]}>
                {t('products:safeFloor', 'Safe floor')}
              </ThemedText>
            </View>

            <View style={styles.inputWithSuffixWrapper}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.inputWithSuffix,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.borderLight,
                    color: theme.textPrimary,
                  },
                ]}
                value={minStockAlert}
                onChangeText={setMinStockAlert}
                keyboardType="number-pad"
                placeholder="5"
                placeholderTextColor={theme.textMuted}
              />
              <ThemedText style={[styles.inputSuffix, { color: theme.textMuted }]}>
                {unit}
              </ThemedText>
            </View>
            <ThemedText style={[styles.captionHint, { color: theme.textSecondary }]}>
              {t('products:alertsWhenLow', 'Alerts you on the POS and dashboard when stock dips to or below this level')}
            </ThemedText>
          </View>

          {/* Product-Specific Rule 2: Out of Stock Policy / Allow Negative Stock */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: theme.textPrimary }]}>
              {t('products:sellingPolicyLabel', 'Out-of-Stock Selling Policy')}
            </ThemedText>

            <View style={styles.policyChoicesContainer}>
              <TouchableOpacity
                style={[
                  styles.policyCard,
                  {
                    backgroundColor: !allowNegativeStock ? theme.primaryLight : theme.surfaceAlt,
                    borderColor: !allowNegativeStock ? theme.primary : theme.borderLight,
                  },
                ]}
                onPress={() => setAllowNegativeStock(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={!allowNegativeStock ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={!allowNegativeStock ? theme.primary : theme.textMuted}
                />
                <View style={styles.policyTextContainer}>
                  <ThemedText
                    style={[
                      styles.policyTitle,
                      { color: !allowNegativeStock ? theme.primary : theme.textPrimary },
                    ]}
                  >
                    {t('products:strictPolicy', 'Strict: Block sales when stock is 0')}
                  </ThemedText>
                  <ThemedText style={[styles.policyDesc, { color: theme.textSecondary }]}>
                    {t('products:strictPolicyDesc', 'Guarantees physical inventory count accuracy at all times.')}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.policyCard,
                  {
                    backgroundColor: allowNegativeStock ? theme.primaryLight : theme.surfaceAlt,
                    borderColor: allowNegativeStock ? theme.primary : theme.borderLight,
                  },
                ]}
                onPress={() => setAllowNegativeStock(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={allowNegativeStock ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={allowNegativeStock ? theme.primary : theme.textMuted}
                />
                <View style={styles.policyTextContainer}>
                  <ThemedText
                    style={[
                      styles.policyTitle,
                      { color: allowNegativeStock ? theme.primary : theme.textPrimary },
                    ]}
                  >
                    {t('products:allowNegativePolicy', 'Allow Negative Stock (Sell even when 0)')}
                  </ThemedText>
                  <ThemedText style={[styles.policyDesc, { color: theme.textSecondary }]}>
                    {t('products:allowNegativeDesc', 'Fast checkout for fast-moving items before supplier delivery is registered.')}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Product-Specific Rule 3: Target Restock Batch Size */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: theme.textPrimary }]}>
                {t('products:targetRestockQty', 'Recommended Restock Batch')}
              </ThemedText>
              <ThemedText style={[styles.safeFloorText, { color: theme.textMuted }]}>
                {t('common:optional', 'Optional')}
              </ThemedText>
            </View>
            <View style={styles.inputWithSuffixWrapper}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.inputWithSuffix,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.borderLight,
                    color: theme.textPrimary,
                  },
                ]}
                value={targetRestockBatch}
                onChangeText={setTargetRestockBatch}
                keyboardType="number-pad"
                placeholder="12"
                placeholderTextColor={theme.textMuted}
              />
              <ThemedText style={[styles.inputSuffix, { color: theme.textMuted }]}>
                {unit}
              </ThemedText>
            </View>
            <ThemedText style={[styles.captionHint, { color: theme.textSecondary }]}>
              {t('products:targetRestockQtyOptional', 'Suggested order batch size when replenishing from wholesalers')}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
            <ThemedText style={styles.primaryButtonText}>
              {t('products:saveProduct', 'Save Product')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.surfaceAlt }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
              {t('products:cancel', 'Cancel')}
            </ThemedText>
          </TouchableOpacity>

          {mode === 'edit' && onArchive && (
            <TouchableOpacity
              style={[styles.archiveButton, { borderColor: theme.borderLight, backgroundColor: theme.surface }]}
              onPress={onArchive}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? 'archive-outline' : 'refresh-outline'}
                size={18}
                color={isActive ? theme.error : theme.primary}
              />
              <ThemedText
                style={[
                  styles.archiveButtonText,
                  { color: isActive ? theme.error : theme.primary },
                ]}
              >
                {isActive ? t('products:archiveProduct', 'Archive Product') : t('products:reactivateProduct', 'Reactivate Product')}
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Footer Trademark */}
          <FooterTrademark />
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
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {t('products:newCategory', 'New Category')}
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.borderLight,
                  color: theme.textPrimary,
                },
              ]}
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder={t('products:addCategoryPrompt', 'Enter new category name')}
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsNewCatModalVisible(false)}
              >
                <ThemedText style={[styles.modalCancelText, { color: theme.textSecondary }]}>
                  {t('products:cancel', 'Cancel')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: theme.primary }]}
                onPress={handleAddNewCategory}
              >
                <ThemedText style={styles.modalConfirmText}>{t('products:save', 'Save')}</ThemedText>
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
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.textPrimary }]}>{t('products:unit', 'Unit')}</ThemedText>
            {DEFAULT_UNITS.map((u) => (
              <TouchableOpacity
                key={u.value}
                style={[
                  styles.unitOption,
                  { borderBottomColor: theme.borderLight },
                  unit === u.value && [styles.unitOptionSelected, { backgroundColor: theme.primaryLight }],
                ]}
                onPress={() => {
                  setUnit(u.value);
                  setIsUnitModalVisible(false);
                }}
              >
                <ThemedText
                  style={[
                    styles.unitOptionText,
                    { color: theme.textPrimary },
                    unit === u.value && { color: theme.primary, fontWeight: '600' },
                  ]}
                >
                  {u.label}
                </ThemedText>
                {unit === u.value && (
                  <Ionicons name="checkmark" size={18} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setIsUnitModalVisible(false)}
            >
              <ThemedText style={[styles.modalCancelText, { color: theme.textSecondary }]}>{t('products:cancel', 'Cancel')}</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickSaveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  quickSaveText: {
    fontSize: 13,
    fontWeight: '700',
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
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  errorAlertText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
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
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubtitleText: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 4,
    lineHeight: 16,
  },
  badgeDraft: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeDraftText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeNeutral: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeNeutralText: {
    fontSize: 11,
    fontWeight: '500',
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  healthBadgeContainer: {
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 6,
  },
  healthBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 13,
    fontWeight: '600',
  },
  asterisk: {
    fontWeight: '700',
  },
  validRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  textInputError: {
    borderWidth: 1.5,
  },
  fieldErrorText: {
    fontSize: 11,
    fontWeight: '500',
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
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  newCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  newCategoryChipText: {
    fontSize: 12,
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
    paddingRight: 56,
  },
  inputSuffix: {
    position: 'absolute',
    right: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  profitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  profitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  profitLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  profitAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  marginBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  marginBadgeText: {
    fontWeight: '600',
    fontSize: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  unitDropdown: {
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitDropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  safeFloorText: {
    fontSize: 11,
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  captionHint: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  policyChoicesContainer: {
    gap: Spacing.sm,
    marginTop: 4,
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  policyTextContainer: {
    flex: 1,
    gap: 2,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  policyDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  currentStockCard: {
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
    fontSize: 13,
    fontWeight: '600',
  },
  currentStockQtyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentStockNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  currentStockUnit: {
    fontSize: 12,
  },
  adjustStockLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  adjustStockLinkText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  actionsContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryButton: {
    height: 48,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    height: 44,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  archiveButton: {
    height: 44,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
  },
  archiveButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 13,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  unitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  unitOptionSelected: {
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  unitOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
