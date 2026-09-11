import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { getSaleById } from '@/database/repositories/saleRepository';
import { Sale, SaleItem } from '@/types/entities';
export type SaleWithItems = Sale & { customer_name?: string | null; items: SaleItem[] };
import { CancelSaleDialog } from '@/features/sales/components/CancelSaleDialog';
import { ReturnSaleDialog } from '@/features/sales/components/ReturnSaleDialog';
import { formatCentimes } from '@/utils/money';
import { formatDate, formatTime } from '@/utils/dates';

interface SaleDetailScreenProps {
  params?: { id?: string };
  route?: { params?: { id?: string } };
}

export function SaleDetailScreen(props?: SaleDetailScreenProps) {
  const router = useRouter();
  const localParams = useLocalSearchParams<{ id?: string }>();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'fr';
  const isArabic = lang.startsWith('ar');
  const isFrench = lang.startsWith('fr');
  const localeParam = isArabic ? 'ar-DZ' : isFrench ? 'fr-DZ' : 'en-DZ';

  // Determine sale ID from props or URL route params
  const rawId =
    props?.params?.id ||
    props?.route?.params?.id ||
    localParams.id ||
    '0';
  const saleId = parseInt(String(rawId), 10);

  const [sale, setSale] = useState<SaleWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dialog states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const loadSaleData = useCallback(async () => {
    if (!saleId || isNaN(saleId)) {
      setErrorMessage(
        isArabic ? 'معرف المعاملة غير صالح' : isFrench ? 'ID de vente invalide' : 'Invalid sale ID',
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getSaleById(saleId);
      if (!data) {
        setErrorMessage(
          isArabic ? 'المعاملة غير موجودة' : isFrench ? 'Vente non trouvée' : 'Sale not found',
        );
      } else {
        setSale(data as SaleWithItems);
      }
    } catch (err: any) {
      console.error('Failed to load sale:', err);
      setErrorMessage(
        isArabic ? 'حدث خطأ أثناء تحميل تفاصيل البيع' : isFrench ? 'Erreur de chargement' : 'Failed to load sale',
      );
    } finally {
      setIsLoading(false);
    }
  }, [saleId, isArabic, isFrench]);

  useEffect(() => {
    loadSaleData();
  }, [loadSaleData]);

  const handleShareReceipt = async () => {
    if (!sale) return;

    const receiptNo = `#REC-${sale.id}`;
    const dateStr = `${formatDate(sale.sold_at, localeParam)} ${formatTime(
      sale.sold_at,
      localeParam,
    )}`;
    const itemsLines = (sale.saleItems || [])
      .map(
        (it) =>
          `• ${it.product_name_snapshot} (${it.quantity}x) = ${formatCentimes(
            it.line_total_centimes,
            localeParam,
          )}`,
      )
      .join('\n');

    const totalStr = formatCentimes(sale.total_centimes, localeParam);
    const paidStr = formatCentimes(sale.amount_paid_centimes, localeParam);
    const customerStr =
      sale.customer_name ||
      (isArabic ? 'زبون عام' : isFrench ? 'Client comptoir' : 'Walk-in Customer');

    const shareContent = `🧾 Dukkan OS - ${receiptNo}\n📅 ${dateStr}\n👤 ${customerStr}\n------------------------\n${itemsLines}\n------------------------\n💰 Total: ${totalStr}\n💵 Payé: ${paidStr}\nStatut: ${sale.status.toUpperCase()}`;

    try {
      await Share.share({
        message: shareContent,
        title: `Reçu ${receiptNo}`,
      });
    } catch (error) {
      console.error('Share receipt error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>
          {isArabic ? 'جارٍ تحميل تفاصيل الوصل...' : isFrench ? 'Chargement du reçu...' : 'Loading receipt details...'}
        </ThemedText>
      </View>
    );
  }

  if (errorMessage || !sale) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color={Colors.light.error} />
        <ThemedText style={styles.errorText}>
          {errorMessage || (isArabic ? 'المعاملة غير موجودة' : 'Sale not found')}
        </ThemedText>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={18} color="#FFFFFF" />
          <ThemedText style={styles.backButtonText}>
            {isArabic ? 'الرجوع للمبيعات' : isFrench ? 'Retour aux ventes' : 'Back to sales'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const isCancelled = sale.status === 'cancelled';
  const isReturned = sale.status === 'returned';
  const isPartial =
    !isCancelled &&
    !isReturned &&
    (
      (sale.remaining_balance_centimes > 0 && sale.amount_paid_centimes > 0));
  const isCredit =
    !isCancelled &&
    !isReturned &&
    !isPartial &&
    (sale.payment_method === 'credit' ||
      (sale.remaining_balance_centimes > 0 && sale.amount_paid_centimes === 0));
  const isCompleted = !isCancelled && !isReturned;

  // Semantic status colors and titles
  let statusBadgeBg: string = Colors.light.primaryLight;
  let statusBadgeColor: string = Colors.light.primary;
  let statusBadgeText = isArabic ? 'مدفوع بالكامل' : isFrench ? 'PAYÉ' : 'PAID';
  let heroCardBg: string = '#E8F5EE';
  let heroBorderColor: string = '#C7E7D2';

  if (isCancelled) {
    statusBadgeBg = Colors.light.errorLight;
    statusBadgeColor = Colors.light.error;
    statusBadgeText = isArabic ? 'ملغى' : isFrench ? 'ANNULÉ' : 'CANCELLED';
    heroCardBg = '#FEF2F2';
    heroBorderColor = '#FECACA';
  } else if (isReturned) {
    statusBadgeBg = Colors.light.surfaceAlt;
    statusBadgeColor = Colors.light.textSecondary;
    statusBadgeText = isArabic ? 'مسترجع' : isFrench ? 'RETOURNÉ' : 'RETURNED';
    heroCardBg = '#F3F4F6';
    heroBorderColor = '#E5E7EB';
  } else if (isPartial) {
    statusBadgeBg = Colors.light.warningLight;
    statusBadgeColor = Colors.light.secondary;
    statusBadgeText = isArabic ? 'دفع جزئي' : isFrench ? 'PARTIEL' : 'PARTIAL';
    heroCardBg = '#FFFBEB';
    heroBorderColor = '#FDE68A';
  } else if (isCredit) {
    statusBadgeBg = Colors.light.surfaceAlt;
    statusBadgeColor = Colors.light.primaryDark;
    statusBadgeText = isArabic ? 'دين / آجل' : isFrench ? 'CRÉDIT' : 'CREDIT';
    heroCardBg = '#F0EFEA';
    heroBorderColor = '#E2E8F0';
  }

  const receiptNo = `#REC-${sale.id}`;
  const totalStr = formatCentimes(sale.total_centimes, localeParam);
  const subtotalStr = formatCentimes(sale.subtotal_centimes, localeParam);
  const discountStr =
    sale.discount_centimes > 0
      ? formatCentimes(sale.discount_centimes, localeParam)
      : null;
  const amountPaidStr = formatCentimes(sale.amount_paid_centimes, localeParam);
  const remainingDueStr =
    sale.remaining_balance_centimes > 0
      ? formatCentimes(sale.remaining_balance_centimes, localeParam)
      : null;

  const items = sale.saleItems || [];
  const itemsCount = items.length;

  const customerName =
    sale.customer_name ||
    (isArabic ? 'بيع نقدي (زبون عام)' : isFrench ? 'Client comptoir' : 'Cash Customer');

  // Initials for avatar
  const initials = (customerName || 'CS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <View style={styles.screenWrapper}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={Colors.light.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.topAppBarCenter}>
          <ThemedText style={styles.topAppBarSubtitle}>
            {isArabic ? 'تفاصيل الوصل' : isFrench ? 'Détails du reçu' : 'Receipt Details'}
          </ThemedText>
          <ThemedText style={styles.topAppBarTitle}>{receiptNo}</ThemedText>
        </View>

        <TouchableOpacity
          style={styles.shareIconButton}
          onPress={handleShareReceipt}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Share receipt"
        >
          <MaterialIcons
            name="share"
            size={20}
            color={Colors.light.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Main Content ScrollView */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Celebration / Settlement Card */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: heroCardBg, borderColor: heroBorderColor },
          ]}
        >
          <View style={styles.heroHeader}>
            <View style={[styles.statusPill, { backgroundColor: statusBadgeBg }]}>
              <ThemedText
                style={[styles.statusPillText, { color: statusBadgeColor }]}
              >
                {statusBadgeText}
              </ThemedText>
            </View>

            <View style={styles.heroTimeRow}>
              <MaterialIcons
                name="schedule"
                size={14}
                color={Colors.light.textSecondary}
              />
              <ThemedText style={styles.heroTimeText}>
                {formatDate(sale.sold_at, localeParam)} •{' '}
                {formatTime(sale.sold_at, localeParam)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.heroAmountBlock}>
            <ThemedText
              style={[
                styles.heroAmount,
                isCancelled && styles.heroAmountCancelled,
              ]}
            >
              {totalStr}
            </ThemedText>
            <ThemedText style={styles.heroAmountLabel}>
              {isArabic
                ? 'المبلغ الإجمالي للمعاملة'
                : isFrench
                ? 'Montant total du reçu'
                : 'Total Settled Amount'}
            </ThemedText>
          </View>

          {/* Remaining Balance pill if partial or credit */}
          {remainingDueStr && (
            <View style={styles.balanceAlertBanner}>
              <MaterialIcons
                name="error-outline"
                size={16}
                color={Colors.light.error}
              />
              <ThemedText style={styles.balanceAlertText}>
                {isArabic
                  ? `المتبقي في دفتر الديون: ${remainingDueStr}`
                  : isFrench
                  ? `Reste dû au carnet : ${remainingDueStr}`
                  : `Remaining balance due: ${remainingDueStr}`}
              </ThemedText>
            </View>
          )}
        </View>

        {/* 2. Cancellation or Return Banner (if inactive) */}
        {isCancelled && (
          <View style={styles.voidAlertCard}>
            <MaterialIcons
              name="block"
              size={22}
              color={Colors.light.error}
            />
            <View style={styles.voidAlertContent}>
              <ThemedText style={styles.voidAlertTitle}>
                {isArabic ? 'تم إلغاء هذا البيع' : isFrench ? 'Vente annulée' : 'This sale was cancelled'}
              </ThemedText>
              <ThemedText style={styles.voidAlertBody}>
                {sale.note
                  ? sale.note
                  : isArabic
                  ? 'تمت استعادة المنتجات إلى المخزون واستبعاد الإيراد.'
                  : 'Articles retournés au stock. Exclu du chiffre d’affaires.'}
              </ThemedText>
            </View>
          </View>
        )}

        {isReturned && (
          <View style={styles.returnAlertCard}>
            <MaterialIcons
              name="assignment-return"
              size={22}
              color={Colors.light.textSecondary}
            />
            <View style={styles.voidAlertContent}>
              <ThemedText style={styles.returnAlertTitle}>
                {isArabic ? 'تم إرجاع هذا البيع' : isFrench ? 'Vente retournée' : 'This sale was returned'}
              </ThemedText>
              <ThemedText style={styles.returnAlertBody}>
                {sale.note
                  ? sale.note
                  : isArabic
                  ? 'تمت إعادة المنتجات للمخزون وتسجيل الإرجاع.'
                  : 'Articles réintégrés au stock avec succès.'}
              </ThemedText>
            </View>
          </View>
        )}

        {/* 3. Transaction Metadata Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <MaterialIcons
              name="info-outline"
              size={18}
              color={Colors.light.primary}
            />
            <ThemedText style={styles.sectionCardTitle}>
              {isArabic
                ? 'معلومات المعاملة والزبون'
                : isFrench
                ? 'Informations de vente'
                : 'Transaction Details'}
            </ThemedText>
          </View>

          {/* Customer Row */}
          <View style={styles.metaRow}>
            <View style={styles.avatarCircle}>
              <ThemedText style={styles.avatarText}>{initials}</ThemedText>
            </View>
            <View style={styles.metaCol}>
              <ThemedText style={styles.metaLabel}>
                {isArabic ? 'الزبون' : isFrench ? 'Client' : 'Customer'}
              </ThemedText>
              <ThemedText style={styles.metaValue}>{customerName}</ThemedText>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Payment Method Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaIconBox}>
              <MaterialIcons
                name={
                  sale.payment_method === 'electronic'
                    ? 'credit-card'
                    : sale.payment_method === 'credit'
                    ? 'menu-book'
                    : 'payments'
                }
                size={18}
                color={Colors.light.primary}
              />
            </View>
            <View style={styles.metaCol}>
              <ThemedText style={styles.metaLabel}>
                {isArabic ? 'طريقة الدفع' : isFrench ? 'Mode de paiement' : 'Payment Method'}
              </ThemedText>
              <ThemedText style={styles.metaValue}>
                {sale.payment_method === 'electronic'
                  ? isArabic
                    ? 'دفع إلكتروني (بطاقة)'
                    : isFrench
                    ? 'Paiement électronique'
                    : 'Electronic / Card'
                  : sale.payment_method === 'credit'
                  ? isArabic
                    ? 'دين / دفتر الكريدي'
                    : isFrench
                    ? 'Carnet de crédit'
                    : 'Customer credit'
                  : isArabic
                  ? 'نقداً (كاش)'
                  : isFrench
                  ? 'Espèces (Cash)'
                  : 'Cash'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 4. Purchased Items Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <MaterialIcons
              name="shopping-bag"
              size={18}
              color={Colors.light.primary}
            />
            <ThemedText style={styles.sectionCardTitle}>
              {isArabic ? 'السلع المشتراة' : isFrench ? 'Articles achetés' : 'Purchased Items'}
            </ThemedText>
            <View style={styles.itemsCountBadge}>
              <ThemedText style={styles.itemsCountBadgeText}>
                {itemsCount}{' '}
                {isArabic ? 'عناصر' : isFrench ? 'articles' : 'items'}
              </ThemedText>
            </View>
          </View>

          {/* Items List */}
          <View style={styles.itemsListContainer}>
            {items.map((item, index) => {
              const unitPrice = formatCentimes(
                item.unit_sale_price_centimes,
                localeParam,
              );
              const lineTotal = formatCentimes(
                item.line_total_centimes,
                localeParam,
              );

              return (
                <View key={item.id || index}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <ThemedText style={styles.itemName}>
                        {item.product_name_snapshot}
                      </ThemedText>
                      <ThemedText style={styles.itemQuantityPrice}>
                        {item.quantity} × {unitPrice}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.itemTotal}>
                      {lineTotal}
                    </ThemedText>
                  </View>
                  {index < items.length - 1 && <View style={styles.itemDivider} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* 5. Financial Breakdown Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <MaterialIcons
              name="receipt-long"
              size={18}
              color={Colors.light.primary}
            />
            <ThemedText style={styles.sectionCardTitle}>
              {isArabic ? 'الحساب المالي' : isFrench ? 'Détail financier' : 'Financial Breakdown'}
            </ThemedText>
          </View>

          {/* Subtotal */}
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.breakdownLabel}>
              {isArabic ? 'المجموع الفرعي' : isFrench ? 'Sous-total' : 'Subtotal'}
            </ThemedText>
            <ThemedText style={styles.breakdownValue}>{subtotalStr}</ThemedText>
          </View>

          {/* Discount if present */}
          {discountStr && (
            <View style={styles.breakdownRow}>
              <ThemedText style={styles.discountLabel}>
                {isArabic ? 'تخفيض / خصم' : isFrench ? 'Remise accordée' : 'Discount'}
              </ThemedText>
              <ThemedText style={styles.discountValue}>-{discountStr}</ThemedText>
            </View>
          )}

          <View style={styles.cardDivider} />

          {/* Net Total */}
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.totalLabel}>
              {isArabic ? 'المبلغ الصافي' : isFrench ? 'Total TTC' : 'Total'}
            </ThemedText>
            <ThemedText style={styles.totalValue}>{totalStr}</ThemedText>
          </View>

          {/* Paid */}
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.breakdownLabel}>
              {isArabic ? 'المبلغ المدفوع' : isFrench ? 'Montant payé' : 'Amount Paid'}
            </ThemedText>
            <ThemedText style={styles.paidValue}>{amountPaidStr}</ThemedText>
          </View>

          {/* Remaining Balance if any */}
          {remainingDueStr && (
            <View style={styles.breakdownRow}>
              <ThemedText style={styles.dueLabel}>
                {isArabic ? 'المتبقي في الديون' : isFrench ? 'Reste dû (Crédit)' : 'Remaining Due'}
              </ThemedText>
              <ThemedText style={styles.dueValue}>{remainingDueStr}</ThemedText>
            </View>
          )}
        </View>

        {/* 6. Action Controls */}
        {isCompleted && (
          <View style={styles.actionsContainer}>
            <ThemedText style={styles.actionsDisclaimer}>
              {isArabic
                ? 'ملاحظة: إلغاء أو إرجاع البيع يعيد كميات المنتجات إلى المخزون تلقائياً.'
                : isFrench
                ? 'L’annulation ou le retour réintègre automatiquement les articles en stock.'
                : 'Cancelling or returning this sale automatically restores inventory stock counts.'}
            </ThemedText>

            <View style={styles.actionButtonsRow}>
              {/* Return Button */}
              <TouchableOpacity
                style={styles.returnButton}
                onPress={() => setIsReturnModalOpen(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Return sale"
              >
                <MaterialIcons
                  name="assignment-return"
                  size={18}
                  color={Colors.light.primary}
                />
                <ThemedText style={styles.returnButtonText}>
                  {isArabic ? 'إرجاع السلع' : isFrench ? 'Retourner vente' : 'Return Sale'}
                </ThemedText>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsCancelModalOpen(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Cancel sale"
              >
                <MaterialIcons
                  name="block"
                  size={18}
                  color={Colors.light.error}
                />
                <ThemedText style={styles.cancelButtonText}>
                  {isArabic ? 'إلغاء البيع' : isFrench ? 'Annuler vente' : 'Cancel Sale'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 7. Dialog Modals */}
      <CancelSaleDialog
        visible={isCancelModalOpen}
        onRequestClose={() => setIsCancelModalOpen(false)}
        saleId={sale.id}
        saleDetails={{
          receipt_no: receiptNo,
          total_centimes: sale.total_centimes,
          customer_name: sale.customer_name,
          items_count: itemsCount,
        }}
        onCancelSuccess={() => {
          loadSaleData();
        }}
      />

      <ReturnSaleDialog
        visible={isReturnModalOpen}
        onRequestClose={() => setIsReturnModalOpen(false)}
        saleId={sale.id}
        saleDetails={{
          receipt_no: receiptNo,
          total_centimes: sale.total_centimes,
          customer_name: sale.customer_name,
          items_count: itemsCount,
        }}
        onReturnSuccess={() => {
          loadSaleData();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.error,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAppBarCenter: {
    alignItems: 'center',
  },
  topAppBarSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topAppBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  shareIconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.sm,
    gap: Spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroTimeText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  heroAmountBlock: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  heroAmountCancelled: {
    textDecorationLine: 'line-through',
    color: Colors.light.textMuted,
  },
  heroAmountLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  balanceAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  balanceAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondary,
    flex: 1,
  },
  voidAlertCard: {
    backgroundColor: Colors.light.errorLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  voidAlertContent: {
    flex: 1,
    gap: 2,
  },
  voidAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.error,
  },
  voidAlertBody: {
    fontSize: 12,
    color: Colors.light.error,
    lineHeight: 16,
  },
  returnAlertCard: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  returnAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  returnAlertBody: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    gap: Spacing.sm,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    flex: 1,
  },
  itemsCountBadge: {
    backgroundColor: Colors.light.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  itemsCountBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  metaIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 4,
  },
  itemsListContainer: {
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemLeft: {
    flex: 1,
    gap: 2,
    marginRight: Spacing.md,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  itemQuantityPrice: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginTop: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  discountLabel: {
    fontSize: 13,
    color: Colors.light.error,
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.error,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  paidValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  dueLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.error,
  },
  dueValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.error,
  },
  actionsContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionsDisclaimer: {
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  returnButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  returnButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.errorLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: Colors.light.error,
    fontSize: 14,
    fontWeight: '700',
  },
});
