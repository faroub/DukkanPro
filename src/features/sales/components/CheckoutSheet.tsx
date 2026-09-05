import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, Modal, FlatList } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/IconButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCentimes } from '@/utils/money';
import { useCartStore } from '@/stores/cartStore';

interface CheckoutSheetProps {
  visible: boolean;
  onRequestClose: () => void;
  onCheckout: (paymentDetails: {
    method: 'cash' | 'electronic' | 'mixed' | 'partial' | 'credit';
    amountPaid?: number;
    note?: string;
    customerId?: number;
  }) => void;
  cartTotal: number;
  isSaving: boolean;
  error?: string | null;
  setPaymentMethod?: any;
  customerId?: number;
  setCustomerId?: any;
  note?: string;
  setNote?: any;
  t?: any;
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
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  // Get customers from storage or state - for now use a simple approach
  const [customers, setCustomers] = useState<Array<{ id: number; name: string }>>([
    { id: 1, name: 'علی رمضان' },
    { id: 2, name: 'سعاد أحمد' },
  ]);

  const handleConfirm = useCallback(() => {
    let paymentDetails: {
      method: 'cash' | 'electronic' | 'mixed' | 'partial' | 'credit';
      amountPaid?: number;
      note?: string;
      customerId?: number;
    } = {
      method: paymentMethod,
      note,
    };

    // For partial payment, require amount paid
    if (paymentMethod === 'partial' && amountPaid <= 0) {
      // Show error - need amount
      return;
    }

    if (paymentMethod === 'partial') {
      paymentDetails.amountPaid = amountPaid;
    }

    // For credit and partial, require customer
    if (paymentMethod === 'credit' || paymentMethod === 'partial') {
      if (!customerId) {
        setShowCustomerSelector(true);
        return;
      }
      paymentDetails.customerId = customerId;
    }

    onCheckout(paymentDetails);
  }, [paymentMethod, amountPaid, note, customerId, onCheckout]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#fff', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <ThemedText type="title">{t('sell.checkout')}</ThemedText>
            <IconButton onPress={onRequestClose} icon="delete" size={20} accessibleLabel="close" />
          </View>

          <View style={{ marginBottom: 16 }}>
            <ThemedText type="body">{t('sell.total')}</ThemedText>
            <ThemedText type="body" style={{ fontWeight: '600', color: '#28a745' }}>
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
                { value: 'mixed', label: t('sell.mixed'), icon: 'merge' },
                { value: 'partial', label: t('sell.partial'), icon: 'phone' },
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
                    name={method.icon as any}
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

          {/* Partial payment amount input - shown only when partial is selected */}
          {paymentMethod === 'partial' && (
            <View style={{ marginBottom: 16 }}>
              <ThemedText type="body" style={{ marginBottom: 8 }}>
                {t('sell.amount_paid')}
              </ThemedText>
              <TextInput
                value={amountPaid.toString()}
                onChangeText={(text) => {
                  const val = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
                  setAmountPaid(val);
                }}
                placeholder={t('sell.amount_paid_placeholder')}
                style={styles.input}
                keyboardType="number-pad"
              />
            </View>
          )}

          {/* Customer selector for credit and partial payment */}
          {showCustomerSelector && (
            <View style={{ marginBottom: 16, maxHeight: 200 }}>
              <ThemedText type="body" style={{ marginBottom: 8 }}>
                {t('sell.select_customer')}
              </ThemedText>
              <FlatList
                data={customers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setCustomerId(item.id);
                      setShowCustomerSelector(false);
                    }}
                    style={{ padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8 }}
                  >
                    <ThemedText type="body">{item.name}</ThemedText>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            </View>
          )}

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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 8,
    marginBottom: 8,
  },
  paymentMethodButtonSelected: {
    backgroundColor: '#1B6B3A',
    borderColor: '#1B6B3A',
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
    width: '100%' as const,
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#1B6B3A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonDisabled: {
    backgroundColor: '#cccccc',
  },
};