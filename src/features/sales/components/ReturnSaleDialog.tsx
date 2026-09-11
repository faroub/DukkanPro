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
import { returnSale } from '@/database/repositories/saleRepository';
import { formatCentimes } from '@/utils/money';

interface ReturnSaleDialogProps {
  visible: boolean;
  onRequestClose: () => void;
  saleId: number;
  saleDetails?: {
    receipt_no?: string;
    total_centimes?: number;
    customer_name?: string | null;
    items_count?: number;
  };
  onReturnSuccess: () => void;
}

export function ReturnSaleDialog({
  visible,
  onRequestClose,
  saleId,
  saleDetails,
  onReturnSuccess,
}: ReturnSaleDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'fr';
  const isArabic = lang.startsWith('ar');
  const isFrench = lang.startsWith('fr');
  const localeParam = isArabic ? 'ar-DZ' : isFrench ? 'fr-DZ' : 'en-DZ';

  const quickReasons = [
    {
      key: 'defective',
      label: isArabic
        ? 'منتج معيب أو تالف'
        : isFrench
        ? 'Produit défectueux / abîmé'
        : 'Defective or damaged product',
    },
    {
      key: 'customer_return',
      label: isArabic
        ? 'إرجاع من الزبون (سليم)'
        : isFrench
        ? 'Retour client (non utilisé)'
        : 'Customer return (unused)',
    },
    {
      key: 'wrong_item',
      label: isArabic
        ? 'منتج خاطئ'
        : isFrench
        ? 'Mauvais article acheté'
        : 'Wrong item purchased',
    },
    {
      key: 'expired',
      label: isArabic
        ? 'منتج قريب أو منتهي الصلاحية'
        : isFrench
        ? 'Produit périmé'
        : 'Expired product',
    },
  ];

  const [reason, setReason] = useState<string>('');
  const [selectedQuickKey, setSelectedQuickKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectQuickReason = (item: { key: string; label: string }) => {
    setSelectedQuickKey(item.key);
    setReason(item.label);
  };

  const handleConfirmReturn = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      Alert.alert(
        isArabic ? 'تنبيه' : isFrench ? 'Attention' : 'Required',
        isArabic
          ? 'يرجى إدخال أو تحديد سبب الإرجاع'
          : isFrench
          ? 'Veuillez entrer un motif de retour'
          : 'Please enter a return reason',
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await returnSale(saleId, trimmed);
      setIsSubmitting(false);
      onRequestClose();
      onReturnSuccess();
    } catch (err: any) {
      setIsSubmitting(false);
      const message =
        err.message?.includes('already')
          ? isArabic
            ? 'هذه المعاملة تم إرجاعها أو إلغاؤها مسبقاً'
            : isFrench
            ? 'Cette vente a déjà été retournée ou annulée'
            : 'This sale was already returned or cancelled'
          : err.message?.includes('not found')
          ? isArabic
            ? 'المعاملة غير موجودة'
            : isFrench
            ? 'Vente introuvable'
            : 'Sale not found'
          : isArabic
          ? 'فشل تسجيل إرجاع المعاملة'
          : isFrench
          ? 'Échec du traitement du retour'
          : 'Return failed';
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
                <View style={styles.returnIconCircle}>
                  <MaterialIcons
                    name="assignment-return"
                    size={28}
                    color={Colors.light.primary}
                  />
                </View>
                <ThemedText style={styles.title}>
                  {isArabic
                    ? 'هل تريد تسجيل إرجاع هذا البيع؟'
                    : isFrench
                    ? 'Effectuer un retour ?'
                    : 'Process a return?'}
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

              {/* Restock Callout Box */}
              <View style={styles.callout}>
                <MaterialIcons
                  name="restore"
                  size={20}
                  color={Colors.light.primary}
                  style={styles.calloutIcon}
                />
                <View style={styles.calloutContent}>
                  <ThemedText style={styles.calloutTitle}>
                    {isArabic
                      ? 'ستتم إعادة المنتجات للمخزون'
                      : isFrench
                      ? 'Le stock sera réintégré'
                      : 'Inventory will be restocked'}
                  </ThemedText>
                  <ThemedText style={styles.calloutBody}>
                    {isArabic
                      ? 'تتم إضافة كميات العناصر المرجعة إلى رصيد المخزون، وتسجيل البيع كمعاملة مسترجعة مع توثيق السبب.'
                      : isFrench
                      ? 'Toutes les unités de cette vente seront rajoutées au stock disponible. La vente passera au statut retourné.'
                      : 'All items will be re-added to active stock. Sale status updates to returned.'}
                  </ThemedText>
                </View>
              </View>

              {/* Reason Selection */}
              <View style={styles.reasonSection}>
                <View style={styles.reasonLabelRow}>
                  <ThemedText style={styles.reasonLabel}>
                    {isArabic
                      ? 'سبب الإرجاع *'
                      : isFrench
                      ? 'Motif du retour *'
                      : 'Reason for return *'}
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
                      ? 'أو اكتب تفاصيل الإرجاع...'
                      : isFrench
                      ? 'Ou précisez la raison du retour...'
                      : 'Or enter custom return reason...'
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
                  onPress={handleConfirmReturn}
                  disabled={!reason.trim() || isSubmitting}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm return"
                >
                  <MaterialIcons name="assignment-return" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.confirmButtonText}>
                    {isSubmitting
                      ? isArabic
                        ? 'جارٍ التسجيل...'
                        : isFrench
                        ? 'Traitement...'
                        : 'Processing...'
                      : isArabic
                      ? 'تأكيد الإرجاع'
                      : isFrench
                      ? 'Confirmer le retour'
                      : 'Confirm Return'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={onRequestClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <ThemedText style={styles.dismissButtonText}>
                    {isArabic
                      ? 'إلغاء'
                      : isFrench
                      ? 'Annuler'
                      : 'Cancel'}
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
                    ? 'عملية آمنة وموثقة في سجل المخزون المحلي'
                    : isFrench
                    ? 'Opération sécurisée • Stock mis à jour automatiquement'
                    : 'Audited in local journal • Stock updated automatically'}
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
  returnIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primaryLight,
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
    backgroundColor: Colors.light.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#C7E7D2',
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
    color: Colors.light.primaryDark,
  },
  calloutBody: {
    fontSize: 12,
    color: Colors.light.primaryDark,
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
    backgroundColor: Colors.light.primary,
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