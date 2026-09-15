import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FormField } from '@/components/ui/FormField';
import { BorderRadius, Spacing } from '@/constants/theme';
import { executeWrite, executeRead } from '@/database/database';
import type { Product } from '@/types/entities';
import { useTheme } from '@/hooks/use-theme';

export interface StockAdjustmentFormProps {
  productId: number;
  initialQuantity?: number;
  onAdjustmentComplete?: () => void;
  locale?: "ar" | "fr" | "en";
}

export function StockAdjustmentForm({ productId, initialQuantity = 0, onAdjustmentComplete, locale = "fr" }: StockAdjustmentFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [form, setForm] = useState({
    quantityChange: initialQuantity,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [product, setProduct] = useState<Product | null>(null);
  const [stockDisplay, setStockDisplay] = useState(0);

  useEffect(() => {
    ;(async () => {
      try {
        const rows: any[] = await executeRead(
          `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
               stock_quantity, minimum_stock_quantity, unit, is_active,
               created_at, updated_at
           FROM products
           WHERE id = ?`,
          [productId],
        );
        if (rows.length > 0) {
          setProduct(rows[0]);
          setStockDisplay(rows[0].stock_quantity);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      }
    })();
  }, [productId]);

  const handleInputChange = useCallback((key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.reason?.trim()) {
      setErrorMessage(t('products:validationRequired').replace('This field is required', t('products:adjustmentReason')));
      setShowError(true);
      return;
    }

    setSubmitting(true);
    setShowError(false);

    try {
      const newStock = Math.max(0, stockDisplay + form.quantityChange);

      await executeWrite(
        `UPDATE products
         SET stock_quantity = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [newStock, productId],
      );

      await executeWrite(
        `INSERT INTO inventory_movements
         (product_id, movement_type, quantity_change, reference_sale_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [
          productId,
          form.quantityChange > 0 ? "in" : "out",
          form.quantityChange,
          null,
          form.reason,
        ],
      );

      setStockDisplay(newStock);
      setShowSuccess(true);
      setSubmitting(false);

      if (onAdjustmentComplete) {
        onAdjustmentComplete();
      }
    } catch (err) {
      setErrorMessage(t('common:error'));
      setShowError(true);
      setSubmitting(false);
    }
  }, [form, productId, stockDisplay, t, onAdjustmentComplete]);

  const inputStyle = [
    styles.input,
    {
      borderColor: theme.border,
      backgroundColor: theme.surface,
      color: theme.textPrimary,
    },
  ];

  return (
    <ThemedView type="background" style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedView style={[styles.form, { backgroundColor: theme.surface }]}>
          <ThemedText type="title" style={[styles.title, { color: theme.textPrimary }]}>
            {t('products:adjustmentTitle')}
          </ThemedText>

          {product && (
            <ThemedText type="small" style={[styles.currentStock, { color: theme.textSecondary }]}>
              {t('products:currentStock')}: {stockDisplay} {product.unit}
            </ThemedText>
          )}

          <FormField label={t('products:adjustmentReason')}>
            <TextInput
              value={form.reason}
              onChangeText={value => handleInputChange('reason', value)}
              placeholder={t('products:adjustmentReason')}
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              style={[inputStyle, { height: 80 }]}
            />
          </FormField>

          <FormField label={t('products:adjustmentQuantity')}>
            <TextInput
              value={form.quantityChange.toString()}
              onChangeText={value => {
                const num = parseInt(value, 10);
                handleInputChange('quantityChange', num || 0);
              }}
              keyboardType="numeric"
              placeholder="Positive = add stock, Negative = remove stock"
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
            />
            <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
              {t('products:adjustmentPositive')} (positive) / {t('products:adjustmentNegative')} (negative)
            </ThemedText>
          </FormField>

          {showError && (
            <ThemedView style={[styles.errorBanner, { backgroundColor: theme.errorLight }]}>
              <ThemedText style={{ color: theme.error, fontSize: 12 }}>{errorMessage}</ThemedText>
            </ThemedView>
          )}

          {showSuccess && (
            <ThemedView style={[styles.successBanner, { backgroundColor: (theme as any).successLight || theme.primaryLight }]}>
              <ThemedText style={{ color: (theme as any).success || theme.primary, fontSize: 12 }}>
                {t('products:adjustmentSuccess')}
              </ThemedText>
            </ThemedView>
          )}

          <PrimaryButton
            title={t('products:formSave')}
            loading={submitting}
            onPress={handleSubmit}
            locale={locale}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  content: {
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  currentStock: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  hint: {
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  errorBanner: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  successBanner: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  form: {
    flex: 1,
    maxWidth: 400,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
});
