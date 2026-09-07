import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { cancel } from '@/database/repositories/saleRepository';
import { formatCentimes } from '@/utils/money';

interface CancelSaleDialogProps {
  visible: boolean;
  onRequestClose: () => void;
  saleId: number;
  onCancel: () => void;
}

export function CancelSaleDialog({
  visible,
  onRequestClose,
  saleId,
  onCancel,
}: CancelSaleDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<string>('');

  const handleCancel = async () => {
    if (!reason.trim()) {
      Alert.alert(t('common.error'), t('sales.cancel_reason_required'));
      return;
    }

    try {
      await cancel(saleId, reason);
      onCancel();
      onRequestClose();
    } catch (err: any) {
      const message =
        err.message.includes('already')
          ? t('sales.cancel_already_cancelled')
          : err.message.includes('not found')
          ? t('sales.sale_not_found')
          : t('sales.cancel_failed');
      Alert.alert(t('common.error'), message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <ThemedView type="background" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <ThemedView type="surface" style={{ flex: 1, borderRadius: 16, padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <ThemedText type="title" style={{ fontSize: 20 }}>
              {t('sales.cancel_sale')}
            </ThemedText>
            <Pressable style={{ padding: 8 }} onPress={onRequestClose}>
              <ThemedText type="body" style={{ color: Colors.light.textSecondary }}>×</ThemedText>
            </Pressable>
          </View>

          <View style={{ marginBottom: 16 }}>
            <ThemedText type="body" style={{ marginBottom: 8 }}>
              {t('sales.cancel_reason')}
            </ThemedText>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder={t('sales.cancel_reason_placeholder')}
              keyboardType="default"
              multiline={true}
              numberOfLines={3}
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 }}>
            <Pressable style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#f8f9fa' }} onPress={onRequestClose}>
              <ThemedText type="body" style={{ color: Colors.light.textSecondary }}>
                {t('common.cancel')}
              </ThemedText>
            </Pressable>
            <Pressable style={{ padding: 12, borderRadius: 8, backgroundColor: '#dc3545', marginLeft: 8 }} onPress={handleCancel} disabled={!reason.trim()}>
              <ThemedText type="body" style={{ color: Colors.light.textPrimary, fontWeight: '600' }}>
                {t('common.confirm')}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}