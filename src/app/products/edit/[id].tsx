import { useRoute, useNavigation } from '@expo/router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FormField } from '@/components/ui/FormField';
import { executeWrite, executeRead } from '@/database/database';

export default function ProductEditScreen() {
  const { params } = useRoute();
  const productId = params?.id;
  const { t } = useTranslation();
  const navigation = useNavigation();

  if (!productId) {
    navigation.back();
    return null;
  }

  // Load product data
  const [product, setProduct] = useState({
    id: productId,
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
          [Number(productId)],
        );
        if (rows.length > 0) {
          const r = rows[0];
          setProduct({
            id: r.id,
            name: r.name,
            sku: r.sku || '',
            category: r.category || '',
            sale_price_centimes: r.sale_price_centimes,
            cost_price_centimes: r.cost_price_centimes,
            stock_quantity: r.stock_quantity,
            minimum_stock_quantity: r.minimum_stock_quantity,
            unit: r.unit || 'pcs',
            is_active: r.is_active !== 0,
          });
        }
      } catch (err) {
        setErrorMessage(t('common:error'));
        setShowError(true);
      }
    })();
  }, [productId, t]);

  const handleInputChange = useCallback((key: keyof typeof product) => {
    return (value: any) => {
      setProduct({ ...product, [key]: value });
    };
  }, [product]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setShowError(false);

    // Validate required fields
    if (!product.name?.trim()) {
      setErrorMessage(t('products:validationRequired').replace('This field is required', t('products:name')));
      setShowError(true);
      setSubmitting(false);
      return;
    }

    if (!product.sku?.trim()) {
      setErrorMessage(t('products:validationRequired').replace('This field is required', t('products:sku')));
      setShowError(true);
      setSubmitting(false);
      return;
    }

    // Check SKU uniqueness (excluding current product)
    try {
      const rows: any[] = await executeRead(
        `SELECT id FROM products WHERE sku = ? AND id != ?`,
        [product.sku, product.id],
      );
      if (rows.length > 0) {
        setErrorMessage(t('products:validationSkuExists'));
        setShowError(true);
        setSubmitting(false);
        return;
      }
    } catch (e) {
      // Ignore check errors, proceed with update
    }

    try {
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
          product.name,
          product.sku,
          product.category,
          product.sale_price_centimes,
          product.cost_price_centimes,
          product.stock_quantity,
          product.minimum_stock_quantity,
          product.unit,
          product.is_active ? 1 : 0,
          product.id,
        ],
      );
      navigation.back();
    } catch (err) {
      setErrorMessage(t('common:error'));
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  }, [product, navigation, t, productId]);

  const handleArchive = useCallback(async () => {
    try {
      await executeWrite(
        // language=SQLite
        `UPDATE products
         SET is_active = 0,
             updated_at = datetime('now')
         WHERE id = ?`,
        [product.id],
      );
      navigation.back();
    } catch (err) {
      setErrorMessage(t('common:error'));
      setShowError(true);
    }
  }, [product.id, navigation, t]);

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
              value={product.name}
              onChangeText={handleInputChange('name')}
              placeholder={t('products:placeholder')}
              autoCapitalize="words"
              style={styles.input}
            />
          </FormField>

          <FormField label={t('products:sku')}>
            <TextInput
              value={product.sku}
              onChangeText={handleInputChange('sku')}
              placeholder="FL-001, OI-001, etc."
              keyboardType="default"
              autoCapitalize="characters"
              style={styles.input}
            />
          </FormField>

          <FormField label={t('products:category')}>
            <TextInput
              value={product.category}
              onChangeText={handleInputChange('category')}
              placeholder="مخبوزات, مطبخ, etc."
              style={styles.input}
            />
          </FormField>

          <FormField label={t('products:salePrice')}>
            <TextInput
              value={product.sale_price_centimes.toString()}
              onChangeText={handleInputChange('sale_price_centimes')}
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
              value={product.cost_price_centimes.toString()}
              onChangeText={handleInputChange('cost_price_centimes')}
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
              value={product.stock_quantity.toString()}
              onChangeText={handleInputChange('stock_quantity')}
              keyboardType="numeric"
              placeholder="0"
              style={styles.input}
            />
          </FormField>

          <FormField label={t('products:minimumStock')}>
            <TextInput
              value={product.minimum_stock_quantity.toString()}
              onChangeText={handleInputChange('minimum_stock_quantity')}
              keyboardType="numeric"
              placeholder="0"
              style={styles.input}
            />
          </FormField>

          <FormField label={t('products:unit')}>
            <TextInput
              value={product.unit}
              onChangeText={handleInputChange('unit')}
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
              locale="en"
            />

            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.back()}>
              <ThemedText type="small" style={styles.cancelText}>
                {t('products:formCancel')}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.archiveButton} onPress={() => handleArchive()}>
              <ThemedText type="small" style={styles.archiveText}>
                {product.is_active ? t('products:archive') : t('products:reactivate')}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
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
    color: '#6B7280',
  },
  archiveText: {
    color: '#B91C1C',
  },
});