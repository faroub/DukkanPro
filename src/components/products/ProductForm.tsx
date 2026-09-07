import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FormField } from '@/components/ui/FormField';
import { executeWrite, executeRead } from '@/database/database';
import { Colors } from '@/constants/theme';
import { Colors } from '@/constants/theme';

type ProductFormMode = 'create' | 'edit';

interface ProductFormProps {
  mode: ProductFormMode;
  initialProduct?: any;
  onSave: (product: any) => void;
  onClose: () => void;
  onArchive?: () => void;
  locale?: "ar" | "fr" | "en";
}

export function ProductForm({ mode, initialProduct, onSave, onClose, onArchive, locale = "fr" }: ProductFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    sale_price_centimes: 0,
    cost_price_centimes: 0,
    stock_quantity: mode === 'create' ? 0 : (initialProduct?.stock_quantity || 0),
    minimum_stock_quantity: mode === 'create' ? 0 : (initialProduct?.minimum_stock_quantity || 0),
    unit: 'pcs',
    is_active: true,
    id: mode === 'edit' ? (initialProduct?.id || undefined) : undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // For edit mode, load initial product data
  useEffect(() => {
    if (mode === 'edit' && initialProduct) {
      setForm({
        name: initialProduct.name,
        sku: initialProduct.sku || '',
        category: initialProduct.category || '',
        sale_price_centimes: initialProduct.sale_price_centimes,
        cost_price_centimes: initialProduct.cost_price_centimes,
        stock_quantity: initialProduct.stock_quantity,
        minimum_stock_quantity: initialProduct.minimum_stock_quantity,
        unit: initialProduct.unit || 'pcs',
        is_active: initialProduct.is_active,
        id: initialProduct.id,
      });
    }
  }, [mode, initialProduct]);

  const handleInputChange = useCallback((key: keyof typeof form, value: any) => {
    setForm({ ...form, [key]: value });
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!form.name?.trim()) {
      setErrorMessage(t('products:validationRequired').replace('This field is required', t('products:name')));
      setShowError(true);
      return;
    }

    if (!form.sku?.trim()) {
      setErrorMessage(t('products:validationRequired').replace('This field is required', t('products:sku')));
      setShowError(true);
      return;
    }

    setSubmitting(true);
    setShowError(false);

    try {
      let result;
      if (mode === 'create') {
        result = await executeWrite(
          // language=SQLite
          `INSERT INTO products
           (name, sku, category, sale_price_centimes, cost_price_centimes,
            stock_quantity, minimum_stock_quantity, unit, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            form.name,
            form.sku,
            form.category,
            form.sale_price_centimes,
            form.cost_price_centimes,
            form.stock_quantity,
            form.minimum_stock_quantity,
            form.unit,
            form.is_active ? 1 : 0,
          ],
        );
        // Re-fetch the created product
        const rows: any[] = await executeRead(
          `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
               stock_quantity, minimum_stock_quantity, unit, is_active,
               created_at, updated_at FROM products WHERE id = (SELECT MAX(id) FROM products)`,
          [],
        );
        result = rows[0];
      } else {
        // Edit mode - use update
        // First check SKU uniqueness (excluding current product)
        if (form.sku) {
          const rows: any[] = await executeRead(
            `SELECT id FROM products WHERE sku = ? AND id != ?`,
            [form.sku, form.id],
          );
          if (rows.length > 0) {
            setErrorMessage(t('products:validationSkuExists'));
            setShowError(true);
            setSubmitting(false);
            return;
          }
        }

        await executeWrite(
          // language=SQLite
          `UPDATE products
           SET name = ?,
               sku = ?,
               category = ?,
               sale_price_centimes = ?,
               cost_price_centimes = ?,
               stock_quantity = ?,
               minimum_stock_quantity = ?,
               unit = ?,
               is_active = ?,
               updated_at = datetime('now')
           WHERE id = ?`,
          [
            form.name,
            form.sku,
            form.category,
            form.sale_price_centimes,
            form.cost_price_centimes,
            form.stock_quantity,
            form.minimum_stock_quantity,
            form.unit,
            form.is_active ? 1 : 0,
            form.id,
          ],
        );
        result = { ...form };
      }

      onSave(result);
      onClose();
    } catch (err) {
      setErrorMessage(t('common:error'));
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  }, [form, mode, onSave, onClose, t]);

  const handleArchive = useCallback(async () => {
    if (mode === 'edit' && onArchive) {
      const confirmed = window.confirm(t('products:deleteConfirm'));
      if (confirmed) {
        // Soft-delete: set is_active = false
        await executeWrite(
          // language=SQLite
          `UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?`,
          [form.id],
        );
        onArchive();
        onClose();
      }
    }
  }, [mode, onArchive, form, t, initialProduct]);

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedView style={styles.form}>
          <ThemedText type="title" style={styles.title}>
            {mode === 'create' ? t('products:formTitle') : t('products:formSubtitle')}
          </ThemedText>

          {mode === 'edit' && initialProduct && (
            <ThemedText type="small" style={styles.subtitle}>
              {t('products:editingProduct', { name: initialProduct.name })}
            </ThemedText>
          )}

          <FormField label={t('products:name')}>
            <TextInput
              value={form.name}
              onChangeText={value => handleInputChange('name', value)}
              placeholder={t('products:placeholder')}
              autoCapitalize="words"
              style={styles.input}
            />
          </FormField>

          <FormField label={t('products:sku')}>
            <TextInput
              value={form.sku}
              onChangeText={value => handleInputChange('sku', value)}
              placeholder="FL-001, OI-001, etc."
              keyboardType="default"
              autoCapitalize="characters"
              style={styles.input}
            />
          </FormField>

          <FormField label={t('products:category')}>
            <TextInput
              value={form.category}
              onChangeText={value => handleInputChange('category', value)}
              placeholder="مخبوزات, مطبخ, etc."
              style={styles.input}
            />
          </FormField>

          <FormField label={t('products:salePrice')}>
            <TextInput
              value={form.sale_price_centimes.toString()}
              onChangeText={value => {
                const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
                handleInputChange('sale_price_centimes', num || 0);
              }}
              keyboardType="numeric"
              placeholder="1500 (15.00 DZD)"
              style={styles.input}
            />
            <ThemedText type="small" style={styles.hint}>
              {t('products:salePriceCentimes')}
            </ThemedText>
          </FormField>

          <FormField label={t('products:costPrice')}>
            <TextInput
              value={form.cost_price_centimes.toString()}
              onChangeText={value => {
                const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
                handleInputChange('cost_price_centimes', num || 0);
              }}
              keyboardType="numeric"
              placeholder="900 (9.00 DZD)"
              style={styles.input}
            />
            <ThemedText type="small" style={styles.hint}>
              {t('products:salePriceCentimes')}
            </ThemedText>
          </FormField>

          <FormField label={t('products:stock')}>
            <TextInput
              value={form.stock_quantity.toString()}
              onChangeText={value => {
                const num = parseInt(value, 10);
                handleInputChange('stock_quantity', num || 0);
              }}
              keyboardType="numeric"
              placeholder="0"
              style={styles.input}
            />
          </FormField>

          <FormField label={t('products:minimumStock')}>
            <TextInput
              value={form.minimum_stock_quantity.toString()}
              onChangeText={value => {
                const num = parseInt(value, 10);
                handleInputChange('minimum_stock_quantity', num || 0);
              }}
              keyboardType="numeric"
              placeholder="0"
              style={styles.input}
            />
          </FormField>

          <FormField label={t('products:unit')}>
            <TextInput
              value={form.unit}
              onChangeText={value => handleInputChange('unit', value)}
              style={styles.input}
            >
              <ThemedText type="small">
                {t('products:unitPiece')} | {t('products:unitKg')} | {t('products:unitLiter')} | {t('products:unitPack')} | {t('products:unitBox')} | {t('products:unitOther')}
              </ThemedText>
            </TextInput>
          </FormField>

          {showError && (
            <ThemedView style={styles.errorBanner}>
              <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
            </ThemedView>
          )}

          <ThemedView style={styles.buttonRow}>
            <PrimaryButton
              title={t('products:formSave')}
              loading={submitting}
              onPress={handleSubmit}
              locale={locale}
            />

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <ThemedText type="small" style={styles.cancelText}>
                {t('products:formCancel')}
              </ThemedText>
            </TouchableOpacity>

            {mode === 'edit' && onArchive && (
              <TouchableOpacity style={styles.archiveButton} onPress={handleArchive}>
                <ThemedText type="small" style={styles.archiveText}>
                  {form.is_active ? t('products:archive') : t('products:reactivate')}
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: Colors.light.disabledBackground,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  hint: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: Colors.light.warningLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: Colors.light.destructive,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  archiveButton: {
    flex: 1,
  },
  cancelText: {
    color: Colors.light.textSecondary,
  },
  archiveText: {
    color: Colors.light.destructive,
  },
  form: {
    flex: 1,
    maxWidth: 400,
    padding: 20,
    backgroundColor: 'white',
  },
});