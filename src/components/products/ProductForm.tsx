import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FormField } from '@/components/ui/FormField';
import { executeWrite, executeRead } from '@/database/database';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();
  const [form, setForm] = useState({
    name: initialProduct?.name || '',
    sku: initialProduct?.sku || '',
    category: initialProduct?.category || '',
    sale_price_centimes: initialProduct?.sale_price_centimes || 0,
    cost_price_centimes: initialProduct?.cost_price_centimes || 0,
    stock_quantity: mode === 'create' ? (initialProduct?.stock_quantity || 0) : (initialProduct?.stock_quantity || 0),
    minimum_stock_quantity: mode === 'create' ? (initialProduct?.minimum_stock_quantity || 0) : (initialProduct?.minimum_stock_quantity || 0),
    unit: initialProduct?.unit || 'pcs',
    is_active: initialProduct?.is_active ?? true,
    id: mode === 'edit' ? (initialProduct?.id || undefined) : undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialProduct) {
      const timer = setTimeout(() => {
        setForm((prev) => ({
          ...prev,
          name: initialProduct.name ?? prev.name,
          sku: initialProduct.sku ?? prev.sku,
          category: initialProduct.category ?? prev.category,
          sale_price_centimes: initialProduct.sale_price_centimes ?? prev.sale_price_centimes,
          cost_price_centimes: initialProduct.cost_price_centimes ?? prev.cost_price_centimes,
          stock_quantity: initialProduct.stock_quantity ?? prev.stock_quantity,
          minimum_stock_quantity: initialProduct.minimum_stock_quantity ?? prev.minimum_stock_quantity,
          unit: initialProduct.unit ?? prev.unit,
          is_active: initialProduct.is_active ?? prev.is_active,
          id: initialProduct.id ?? prev.id,
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mode, initialProduct]);

  const handleInputChange = useCallback((key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

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
        const rows: any[] = await executeRead(
          `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
               stock_quantity, minimum_stock_quantity, unit, is_active,
               created_at, updated_at FROM products WHERE id = (SELECT MAX(id) FROM products)`,
          [],
        );
        result = rows[0];
      } else {
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
        await executeWrite(
          `UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?`,
          [form.id],
        );
        onArchive();
        onClose();
      }
    }
  }, [mode, onArchive, form, t]);

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
            {mode === 'create' ? t('products:formTitle') : t('products:formSubtitle')}
          </ThemedText>

          {mode === 'edit' && initialProduct && (
            <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t('products:editingProduct', { name: initialProduct.name })}
            </ThemedText>
          )}

          <FormField label={t('products:name')}>
            <TextInput
              value={form.name}
              onChangeText={value => handleInputChange('name', value)}
              placeholder={t('products:placeholder')}
              placeholderTextColor={theme.textMuted}
              autoCapitalize="words"
              style={inputStyle}
            />
          </FormField>

          <FormField label={t('products:sku')}>
            <TextInput
              value={form.sku}
              onChangeText={value => handleInputChange('sku', value)}
              placeholder="FL-001, OI-001, etc."
              placeholderTextColor={theme.textMuted}
              keyboardType="default"
              autoCapitalize="characters"
              style={inputStyle}
            />
          </FormField>

          <FormField label={t('products:category')}>
            <TextInput
              value={form.category}
              onChangeText={value => handleInputChange('category', value)}
              placeholder="مخبوزات, مطبخ, etc."
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
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
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
            />
            <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
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
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
            />
            <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
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
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
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
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
            />
          </FormField>

          <FormField label={t('products:unit')}>
            <TextInput
              value={form.unit}
              onChangeText={value => handleInputChange('unit', value)}
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
            />
          </FormField>

          {showError && (
            <ThemedView style={[styles.errorBanner, { backgroundColor: theme.errorLight }]}>
              <ThemedText style={{ color: theme.error, fontSize: 12 }}>{errorMessage}</ThemedText>
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
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {t('products:formCancel')}
              </ThemedText>
            </TouchableOpacity>

            {mode === 'edit' && onArchive && (
              <TouchableOpacity style={styles.archiveButton} onPress={handleArchive}>
                <ThemedText type="small" style={{ color: theme.error }}>
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
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 16,
  },
  hint: {
    fontSize: 10,
    marginTop: 4,
  },
  errorBanner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
  form: {
    flex: 1,
    maxWidth: 400,
    padding: 20,
    borderRadius: 12,
  },
});
