import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardType } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FormField } from '@/components/ui/FormField';
import { executeWrite } from '@/database/database';
import { adjustStock } from '@/database/repositories/productRepository';
import { formatCentimes } from '@/utils/money';

export interface StockAdjustmentFormProps {
  productId: number;
  productName: string;
  currentStock: number;
  onAdjust: (quantityChange: number, reason: string) => void;
  onClose: () => void;
}

export function StockAdjustmentForm({
  productId,
  productName,
  currentStock,
  onAdjust,
  onClose,
}: StockAdjustmentFormProps) {
  const [form, setForm] = useState({
    quantity: 0,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { t } = useTranslation();

  const handleInputChange = useCallback((key: keyof typeof form, value: any) => {
    setForm({ ...form, [key]: value });
  }, [form]);

  const handleSubmit = useCallback(async () => {
    const { quantity, reason } = form;

    if (!reason?.trim()) {
      setErrorMessage(t('products:adjustmentReason'));
      setShowError(true);
      setSubmitting(false);
      return;
    }

    // Calculate new stock: positive quantity adds, negative removes
    const newStock = currentStock + quantity;

    // Check if stock would go negative (unless enabled in settings)
    // For now, we allow negative only if explicitly enabled
    // We'll clamp to 0 at the repository level, but show warning here

    try {
      await onAdjust(quantity, reason);
      onClose();
    } catch (err) {
      setErrorMessage(t('common:error'));
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  }, [form, onAdjust, onClose, t, currentStock]);

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedView style={styles.form}>
          <ThemedText type="title" style={styles.title}>
            {t('products:adjustmentTitle')}
          </ThemedText>

          <ThemedText type="small" style={styles.subtitle}>
            {t('products:currentStock', { stock: currentStock })}
          </ThemedText>

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
              value={form.quantity.toString()}
              onChangeText={value => {
                const num = parseInt(value, 10);
                handleInputChange('quantity', num || 0);
              }}
              keyboardType="numeric"
              placeholder={t('products:adjustmentPositive')}
              style={styles.input}
            >
              <ThemedText type="small" style={styles.hint}>
                {t('products:adjustmentPositive')} ( + ) | {t('products:adjustmentNegative')} ( - )
              </ThemedText>
            </TextInput>
          </FormField>

          {showError && (
            <ThemedView style={styles.errorBanner}>
              <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
            </ThemedView>
          )}

          <PrimaryButton
            title={t('products:adjustmentSuccess')}
            loading={submitting}
            onPress={handleSubmit}
            locale="en"
          />

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
    padding: 20,
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
    color: '#B91C1C',
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