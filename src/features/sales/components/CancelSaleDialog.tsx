import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { cancel } from '@/database/repositories/saleRepository';
import { formatCentimes } from '@/utils/money';

interface CancelSaleDialogProps {
  visible: boolean;
  onRequestClose: () => void;
  saleId: number;
  saleDetails?: {
    receipt_no?: string;
    total_centimes?: number;
    customer_name?: string | null;
    items_count?: number;
  };
  onCancelSuccess: () => void;
}

export function CancelSaleDialog({
  visible,
  onRequestClose,
  saleId,
  saleDetails,
  onCancelSuccess,
}: CancelSaleDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'fr';
  const isArabic = lang.startsWith('ar');
  const isFrench = lang.startsWith('fr');
  const localeParam = isArabic ? 'ar-DZ' : isFrench ? 'fr-DZ' : 'en-DZ';

  const quickReasons = [
    {
      key: 'customer_change_mind',
      label: isArabic
        ? 'الزبون غير رأيه'
        : isFrench
        ? "Changement d'avis du client"
        : 'Customer changed mind',
    },
    {
      key: 'double_entry',
      label: isArabic
        ? 'إدخال مزدوج بالخطأ'
        : isFrench
        ? 'Saisie en double accidentelle'
        : 'Accidental double entry',
    },
    {
      key: 'pricing_error',
      label: isArabic
        ? 'خطأ في السعر'
        : isFrench
        ? 'Erreur de prix / remise'
        : 'Pricing or discount error',
    },
    {
      key: 'defective',
      label: isArabic
        ? 'بضاعة غير صالحة'
        : isFrench
        ? 'Produit défectueux / avarié'
        : 'Defective product',
    },
  ];

  const [reason, setReason] = useState<string>('');
  const [selectedQuickKey, setSelectedQuickKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectQuickReason = (item: { key: string; label: string }) => {
    setSelectedQuickKey(item.key);
    setReason(item.label);
  };

  const handleConfirmCancel = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      Alert.alert(
        isArabic ? 'تنبيه' : isFrench ? 'Attention' : 'Required',
        isArabic
          ? 'يرجى تحديد أو إدخال سبب الإلغاء'
          : isFrench
          ? "Veuillez entrer un motif d'annulation"
          : 'Please enter a cancellation reason',
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await cancel(saleId, trimmed);
      setIsSubmitting(false);
      onRequestClose();
      onCancelSuccess();
    } catch (err: any) {
      setIsSubmitting(false);
      const message =
        err.message?.includes('already')
          ? isArabic
            ? 'هذه المعاملة ملغاة بالفعل'
            : isFrench
            ? 'Cette vente est déjà annulée'
            : 'This sale is already cancelled'
          : err.message?.includes('not found')
          ? isArabic
            ? 'المعاملة غير موجودة'
            : isFrench
            ? 'Vente introuvable'
            : 'Sale not found'
          : isArabic
          ? 'فشل إلغاء المعاملة'
          : isFrench
          ? "Échec de l'annulation"
          : 'Cancellation failed';
      Alert.alert(
        isArabic ? 'خطأ' : isFrench ? 'Erreur' : 'Error',
        message,
      );
    }
  };

  const receiptTag =
    saleDetails?.receipt_no || `#REC-${saleId}`;
  const totalAmountStr = saleDetails?.total_centimes
    ? formatCentimes(saleDetails.total_centimes, localeParam)
    : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.card}>
              {/* Header Icon + Title */}
              <View style={styles.header}>
                <View style={styles.warningIconCircle}>
                  <MaterialIcons
                    name="warning"
                    size={28}
                    color={Colors.light.error}
                  />
                </View>
                <ThemedText style={styles.title}>
                  {isArabic
                    ? 'هل تريد إلغاء هذا البيع؟'
                    : isFrench
                    ? 'Annuler cette vente ?'
                    : 'Cancel this sale?'}
                </ThemedText>
                <View style={styles.saleChip}>
                  <ThemedText style={styles.saleChipText}>
                    {receiptTag}
                    {totalAmountStr ? ` • ${totalAmountStr}` : ''}
                    {saleDetails?.customer_name
                      ? ` • ${saleDetails.customer_name}`
                      : ''}
                  </ThemedText>
                </View>
              </View>

              {/* Warning Callout Box */}
              <View style={styles.callout}>
                <MaterialIcons
                  name="inventory"
                  size={20}
                  color={Colors.light.secondary}
                  style={styles.calloutIcon}
                />
                <View style={styles.calloutContent}>
                  <ThemedText style={styles.calloutTitle}>
                    {isArabic
                      ? 'ستتم استعادة المخزون تلقائياً'
                      : isFrench
                      ? 'Le stock sera restauré'
                      : 'Stock will be restored'}
                  </ThemedText>
                  <ThemedText style={styles.calloutBody}>
                    {isArabic
                      ? 'تتم استعادة المنتجات إلى المخزون تلقائياً، واستبعاد هذه المعاملة من الحسابات والإيرادات نهائياً.'
                      : isFrench
                      ? 'Les articles seront restitués au stock. La vente sera exclue du chiffre d’affaires. Cette action est irréversible.'
                      : 'Restores inventory units automatically. The sale is marked cancelled and excluded from revenue. Cannot be undone.'}
                  </ThemedText>
                </View>
              </View>

              {/* Reason Selection */}
              <View style={styles.reasonSection}>
                <View style={styles.reasonLabelRow}>
                  <ThemedText style={styles.reasonLabel}>
                    {isArabic
                      ? 'سبب الإلغاء *'
                      : isFrench
                      ? "Motif de l'annulation *"
                      : 'Reason for cancellation *'}
                  </ThemedText>
                  <ThemedText style={styles.requiredBadge}>
                    {isArabic ? 'إجباري' : isFrench ? 'Requis' : 'Required'}
                  </ThemedText>
                </View>

                {/* Quick select chips */}
                <View style={styles.chipsWrap}>
                  {quickReasons.map((item) => {
                    const isSelected = selectedQuickKey === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.reasonChip,
                          isSelected && styles.reasonChipSelected,
                        ]}
                        onPress={() => handleSelectQuickReason(item)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <MaterialIcons
                            name="check"
                            size={14}
                            color={Colors.light.primary}
                          />
                        )}
                        <ThemedText
                          style={[
                            styles.reasonChipText,
                            isSelected && styles.reasonChipTextSelected,
                          ]}
                        >
                          {item.label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Note / Reason TextInput */}
                <TextInput
                  value={reason}
                  onChangeText={(val) => {
                    setReason(val);
                    if (selectedQuickKey) setSelectedQuickKey(null);
                  }}
                  placeholder={
                    isArabic
                      ? 'أو اكتب سبباً مخصصاً...'
                      : isFrench
                      ? 'Ou écrivez un motif personnalisé...'
                      : 'Or enter custom cancellation note...'
                  }
                  placeholderTextColor={Colors.light.textMuted}
                  style={styles.textInput}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!reason.trim() || isSubmitting) && styles.disabledButton,
                  ]}
                  onPress={handleConfirmCancel}
                  disabled={!reason.trim() || isSubmitting}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm cancellation"
                >
                  <MaterialIcons name="delete-forever" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.confirmButtonText}>
                    {isSubmitting
                      ? isArabic
                        ? 'جارٍ الإلغاء...'
                        : isFrench
                        ? 'Annulation en cours...'
                        : 'Cancelling...'
                      : isArabic
                      ? 'تأكيد الإلغاء'
                      : isFrench
                      ? "Confirmer l'annulation"
                      : 'Confirm Cancellation'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={onRequestClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Keep sale"
                >
                  <ThemedText style={styles.dismissButtonText}>
                    {isArabic
                      ? 'الاحتفاظ بالبيع'
                      : isFrench
                      ? 'Conserver la vente'
                      : 'Keep Sale'}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Security Audit Footer */}
              <View style={styles.auditFooter}>
                <MaterialIcons
                  name="verified-user"
                  size={14}
                  color={Colors.light.textMuted}
                />
                <ThemedText style={styles.auditFooterText}>
                  {isArabic
                    ? 'عملية مسجلة في سجل النظام المحلي الآمن'
                    : isFrench
                    ? 'Journalisé en local • Rétablissement sûr du stock'
                    : 'Audited in local journal • Safe offline stock restoration'}
                </ThemedText>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(21, 28, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
    gap: Spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  warningIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    textAlign: 'center',
  },
  saleChip: {
    backgroundColor: Colors.light.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  saleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  callout: {
    backgroundColor: Colors.light.warningLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  calloutIcon: {
    marginTop: 2,
  },
  calloutContent: {
    flex: 1,
    gap: 2,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.secondary,
  },
  calloutBody: {
    fontSize: 12,
    color: Colors.light.secondary,
    lineHeight: 17,
  },
  reasonSection: {
    gap: Spacing.xs,
  },
  reasonLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.error,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reasonChip: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reasonChipSelected: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
  },
  reasonChipText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  reasonChipTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.light.textPrimary,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    gap: Spacing.xs,
    marginTop: 4,
  },
  confirmButton: {
    height: 48,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.light.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dismissButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  auditFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 10,
  },
  auditFooterText: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
});