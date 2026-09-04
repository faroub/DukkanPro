import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FormField } from '@/components/ui/FormField';
import { executeWrite, executeRead } from '@/database/database';
import type { Product } from '@/types/entities';

export interface StockAdjustmentFormProps {
  productId: number;
  initialQuantity?: number;
  onAdjustmentComplete?: () => void;
  locale?: "ar" | "fr" | "en";
}

export function StockAdjustmentForm({ productId, initialQuantity = 0, onAdjustmentComplete, locale = "fr" }: StockAdjustmentFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    quantityChange: initialQuantity,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch product data
  const [product, setProduct] = useState<Product | null>(null);
  const [stockDisplay, setStockDisplay] = useState(0);

  useEffect(() => {
    ;(async () => {
      try {
        const rows: any[] = await executeRead(
          // language=SQLite
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
    setForm({ ...form, [key]: value });
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!form.reason?.trim()) {
      setErrorMessage(t('products:validationRequired').replace('This field is required', t('products:adjustmentReason')));
      setShowError(true);
      return;
    }

    setSubmitting(true);
    setShowError(false);

    try {
      // Update product stock quantity
      const newStock = Math.max(0, stockDisplay + form.quantityChange);

      await executeWrite(
        // language=SQLite
        `UPDATE products
         SET stock_quantity = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [newStock, productId],
      );

      // Create inventory movement record
      await executeWrite(
        // language=SQLite
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

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedView style={styles.form}>
          <ThemedText type="title" style={styles.title}>
            {t('products:adjustmentTitle')}
          </ThemedText>

          {product && (
            <ThemedText type="small" style={styles.currentStock}>
              {t('products:currentStock')}: {stockDisplay} {product.unit}
            </ThemedText>
          )}

          <FormField label={t('products:adjustmentReason')}>
            <TextInput
              value={form.reason}
              onChangeText={value => handleInputChange('reason', value)}
              placeholder={t('products:adjustmentReason')}
              multiline
              numberOfLines={3}
              style={styles.input}
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
              style={styles.input}
            />
            <ThemedText type="small" style={styles.hint}>
              {t('products:adjustmentPositive')} (positive) / {t('products:adjustmentNegative')} (negative)
            </ThemedText>
          </FormField>

          {showError && (
            <ThemedView style={styles.errorBanner}>
              <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
            </ThemedView>
          )}

          {showSuccess && (
            <ThemedView style={styles.successBanner}>
              <ThemedText style={styles.successBannerText}>
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
    backgroundColor: '#F8F7F4',
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 24,
    textAlign: 'center',
  },
  currentStock: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  hint: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 12,
  },
  successBanner: {
    backgroundColor: '#D1F2BD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    color: '#166534',
    fontSize: 12,
  },
  form: {
    flex: 1,
    maxWidth: 400,
    padding: 20,
    backgroundColor: 'white',
  },
});