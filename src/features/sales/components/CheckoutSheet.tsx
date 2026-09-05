import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Modal } from '@react-native-community/masked-view';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/icon-button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCentimes } from '@/utils/money';

interface CheckoutSheetProps {
  visible: boolean;
  onRequestClose: () => void;
  onCheckout: (paymentDetails: {
    method: 'cash' | 'electronic' | 'mixed' | 'partial' | 'credit';
    amountPaid?: number;
    note?: string;
  }) => void;
  cartTotal: number;
  isSaving: boolean;
  error?: string | null;
}

export function CheckoutSheet({
  visible,
  onRequestClose,
  onCheckout,
  cartTotal,
  isSaving,
  error,
}: CheckoutSheetProps) {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'electronic' | 'mixed' | 'partial' | 'credit'>('cash');
  const [note, setNote] = useState<string>('');

  const handleConfirm = () => {
    onCheckout({
      method: paymentMethod,
      note,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#fff', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <ThemedText type="title">{t('sell.checkout')}</ThemedText>
            <IconButton onPress={onRequestClose} icon="x-mark" size={20} color="gray" />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <ThemedText type="heading">{t('sell.total')}</ThemedText>
            <ThemedText type="heading" style={{ fontWeight: '600', color: '#28a745' }}>
              {formatCentimes(cartTotal)}
            </ThemedText>
          </View>

          <View style={{ marginBottom: 16 }}>
            <ThemedText type="body" style={{ marginBottom: 8 }}>
              {t('sell.payment_method')}
            </ThemedText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {[
                { value: 'cash', label: t('sell.cash'), icon: 'cash' },
                { value: 'electronic', label: t('sell.electronic'), icon: 'credit-card' },
                { value: 'credit', label: t('sell.credit'), icon: 'account-clock' },
              ].map((method) => (
                <Pressable
                  key={method.value}
                  onPress={() => setPaymentMethod(method.value as any)}
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === method.value && styles.paymentMethodButtonSelected,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={method.icon}
                    size={20}
                    color={paymentMethod === method.value ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === method.value && styles.paymentMethodTextSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <ThemedText type="body" style={{ marginBottom: 8 }}>
              {t('sell.note')}
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('sell.add_note')}
              style={styles.input}
              multiline
            />
          </View>

          {error && (
            <ThemedText type="body" style={{ color: '#dc3545', marginBottom: 16 }}>
              {error}
            </ThemedText>
          )}

          <Pressable
            onPress={handleConfirm}
            style={[
              styles.confirmButton,
              isSaving && styles.confirmButtonDisabled,
            ]}
            disabled={isSaving}
          >
            <ThemedText type="body" style={{ color: '#fff', fontWeight: '600' }}>
              {isSaving ? t('sell.saving') : t('sell.confirm_payment')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 8,
    marginBottom: 8,
  },
  paymentMethodButtonSelected: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  paymentMethodTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  confirmButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#cccccc',
  },
};