import { useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FormField } from '@/components/ui/FormField';
import { executeWrite, executeRead } from '@/database/database';

export default function ProductCreateScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    sale_price_centimes: 0,
    cost_price_centimes: 0,
    stock_quantity: 0,
    minimum_stock_quantity: 0,
    unit: 'pcs',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if SKU already exists
  const checkSkuExists = useCallback(async (sku: string) => {
    if (!sku) return false;
    try {
      const rows: any[] = await executeRead(
        `SELECT id FROM products WHERE sku = ?`,
        [sku],
      );
      return rows.length > 0;
    } catch (e) {
      return false;
    }
  }, []);

  const handleInputChange = useCallback((key: keyof typeof form, value: any) => {
    setForm({ ...form, [key]: value });
  }, [form]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setShowError(false);

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

    // Check SKU uniqueness
    const skuExists = await checkSkuExists(form.sku);
    if (skuExists) {
      setErrorMessage(t('products:validationSkuExists'));
      setShowError(true);
      setSubmitting(false);
      return;
    }

    try {
      await executeWrite(
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
      (navigation as any).back();
    } catch (err) {
      setErrorMessage(t('common:error'));
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  }, [form, checkSkuExists, navigation, t]);

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedView style={styles.form}>
          <ThemedText type="title" style={styles.title}>
            {t('products:formTitle')}
          </ThemedText>

          <ThemedText type="subtitle" style={styles.subtitle}>
            {t('products:formSubtitle')}
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
            title={t('products:formSave')}
            loading={submitting}
            onPress={handleSubmit}
            locale="en"
          />

          <TouchableOpacity style={styles.cancelButton} onPress={() => (navigation as any).back()}>
            <ThemedText type="small" style={styles.cancelText}>
              {t('products:formCancel')}
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
    backgroundColor: '#F8F7F4',
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
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
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
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
  cancelButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  cancelText: {
    color: '#6B7280',
  },
  content: {
    flexGrow: 1,
    maxWidth: 400,
    width: '100%',
    padding: 20,
  },
});