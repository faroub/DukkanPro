import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardType } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FormField } from '@/components/ui/FormField';
import { executeWrite, executeRead } from '@/database/database';
import { formatCentimes } from '@/utils/money';

export interface ProductFormProps {
  onSave: (product: {
    name: string;
    sku: string | null;
    category: string | null;
    sale_price_centimes: number;
    cost_price_centimes: number;
    stock_quantity: number;
    minimum_stock_quantity: number;
    unit: string;
    is_active: boolean;
  }) => void;
  onClose: () => void;
  initialValues?: {
    name: string;
    sku: string | null;
    category: string | null;
    sale_price_centimes: number;
    cost_price_centimes: number;
    stock_quantity: number;
    minimum_stock_quantity: number;
    unit: string;
    is_active: boolean;
  };
  mode: 'create' | 'edit';
}

export function ProductForm({ onSave, onClose, initialValues, mode }: ProductFormProps) {
  const [form, setForm] = useState({
    name: initialValues?.name || '',
    sku: initialValues?.sku || '',
    category: initialValues?.category || '',
    sale_price_centimes: initialValues?.sale_price_centimes || 0,
    cost_price_centimes: initialValues?.cost_price_centimes || 0,
    stock_quantity: initialValues?.stock_quantity || 0,
    minimum_stock_quantity: initialValues?.minimum_stock_quantity || 0,
    unit: initialValues?.unit || 'pcs',
    is_active: initialValues?.is_active !== false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { t } = useTranslation();

  const handleInputChange = useCallback((key: keyof typeof form, value: any) => {
    setForm({ ...form, [key]: value });
  }, [form]);

  // Parse DZD string to centimes integer
  const parseDzdToCentimes = (value: string): number => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const handleSubmit = useCallback(async () => {
    // Validate required fields
    if (!form.name?.trim()) {
      setErrorMessage(t('products:validationRequired').replace('This field is required', t('products:name')));
      setShowError(true);
      setSubmitting(false);
      return;
    }

    if (!form.sku?.trim()) {
      setErrorMessage(t('products:validationRequired').replace('This field is required', t('products:sku')));
      setShowError(true);
      setSubmitting(false);
      return;
    }

    try {
      await onSave({
        name: form.name,
        sku: form.sku || null,
        category: form.category || null,
        sale_price_centimes: form.sale_price_centimes,
        cost_price_centimes: form.cost_price_centimes,
        stock_quantity: form.stock_quantity,
        minimum_stock_quantity: form.minimum_stock_quantity,
        unit: form.unit,
        is_active: form.is_active,
      });
      onClose();
    } catch (err) {
      setErrorMessage(t('common:error'));
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  }, [form, onSave, onClose, t]);

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedView style={styles.form}>
          <ThemedText type="title" style={styles.title}>
            {t(mode === 'create' ? 'products:formTitle' : 'products:formTitle')}
          </ThemedText>

          <ThemedText type="subtitle" style={styles.subtitle}>
            {t(mode === 'create' ? 'products:formSubtitle' : 'products:formSubtitle')}
          </ThemedText>

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
                const num = parseDzdToCentimes(value);
                handleInputChange('sale_price_centimes', num);
              }}
              keyboardType="numeric"
              placeholder={t('products:placeholder')}
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
                const num = parseDzdToCentimes(value);
                handleInputChange('cost_price_centimes', num);
              }}
              keyboardType="numeric"
              placeholder={t('products:placeholder')}
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
              <ThemedText type="small" style={styles.hint}>
                {t('products:unitPiece')} | {t('products:unitKg')} | {t('products:unitLiter')} | {t('products:unitPack')} | {t('products:unitBox')} | {t('products:unitOther')}
              </ThemedText>
            </TextInput>
          </FormField>

          {showError && (
            <ThemedView style={styles.errorBanner}>
              <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
            </ThemedView>
          )}

          <PrimaryButton
            title={t(mode === 'create' ? 'products:formSave' : 'products:formSave')}
            loading={submitting}
            onPress={handleSubmit}
            locale="en"
          />

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <ThemedText type="small" style={styles.cancelText}>
              {t(mode === 'create' ? 'products:formCancel' : 'products:formCancel')}
            </ThemedText>
          </TouchableOpacity>
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
    padding: 20,
    maxWidth: 400,
    width: '100%',
  },
  form: {
    flexGrow: 1,
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
  cancelButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.light.textSecondary,
  },
});