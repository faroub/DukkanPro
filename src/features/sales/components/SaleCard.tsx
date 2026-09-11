import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { formatCentimes } from '@/utils/money';
import { formatRelativeDate, formatTime } from '@/utils/dates';

export interface SaleCardData {
  id: number;
  customer_id?: number | null;
  customer_name?: string | null;
  status: 'completed' | 'cancelled' | 'returned' | 'partial' | string;
  subtotal_centimes?: number;
  discount_centimes?: number;
  total_centimes: number;
  amount_paid_centimes?: number;
  remaining_balance_centimes?: number;
  payment_method?: string;
  note?: string | null;
  sold_at: string;
  receipt_no?: string;
  saleItems?: Array<{
    id?: number;
    product_name_snapshot: string;
    quantity: number;
    unit_sale_price_centimes?: number;
    line_total_centimes?: number;
  }>;
}

interface SaleCardProps {
  sale: SaleCardData;
  onPress?: () => void;
}

export function SaleCard({ sale, onPress }: SaleCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'fr';
  const isArabic = lang.startsWith('ar');
  const isFrench = lang.startsWith('fr');
  const localeParam = isArabic ? 'ar-DZ' : isFrench ? 'fr-DZ' : 'en-DZ';

  const isCancelled = sale.status === 'cancelled';
  const isReturned = sale.status === 'returned';
  const isPartial =
    !isCancelled &&
    !isReturned &&
    (sale.status === 'partial' ||
      ((sale.remaining_balance_centimes ?? 0) > 0 &&
        (sale.amount_paid_centimes ?? 0) > 0));
  const isCredit =
    !isCancelled &&
    !isReturned &&
    !isPartial &&
    (sale.payment_method === 'credit' ||
      ((sale.remaining_balance_centimes ?? 0) > 0 &&
        (sale.amount_paid_centimes ?? 0) === 0));
  const isPaid = !isCancelled && !isReturned && !isPartial && !isCredit;

  // Icon, colors, and badge styling
  let iconName: keyof typeof MaterialIcons.glyphMap = 'payments';
  let iconColor = Colors.light.primary;
  let iconBg = Colors.light.primaryLight;
  let badgeBg = Colors.light.primaryLight;
  let badgeColor = Colors.light.primary;
  let badgeText = isArabic ? 'مدفوع' : isFrench ? 'Payé' : 'Paid';
  let subStatusText = isArabic ? 'نقداً' : isFrench ? 'Espèces' : 'Cash';
  let subStatusColor = Colors.light.primary;

  if (isCancelled) {
    iconName = 'block';
    iconColor = Colors.light.error;
    iconBg = Colors.light.errorLight;
    badgeBg = Colors.light.errorLight;
    badgeColor = Colors.light.error;
    badgeText = isArabic ? 'ملغى' : isFrench ? 'Annulé' : 'Cancelled';
    subStatusText = isArabic ? 'معاملة ملغاة' : isFrench ? 'Vente annulée' : 'Voided sale';
    subStatusColor = Colors.light.error;
  } else if (isReturned) {
    iconName = 'assignment-return';
    iconColor = Colors.light.textSecondary;
    iconBg = Colors.light.surfaceAlt;
    badgeBg = Colors.light.surfaceAlt;
    badgeColor = Colors.light.textSecondary;
    badgeText = isArabic ? 'مسترجع' : isFrench ? 'Retourné' : 'Returned';
    subStatusText = isArabic ? 'تم إرجاع البضاعة' : isFrench ? 'Réapprovisionné' : 'Restocked';
    subStatusColor = Colors.light.textSecondary;
  } else if (isPartial) {
    iconName = 'pending-actions';
    iconColor = Colors.light.warning;
    iconBg = Colors.light.warningLight;
    badgeBg = Colors.light.warningLight;
    badgeColor = Colors.light.secondary;
    badgeText = isArabic ? 'جزئي' : isFrench ? 'Partiel' : 'Partial';
    const dueAmount = formatCentimes(sale.remaining_balance_centimes || 0, localeParam);
    subStatusText = isArabic ? `المتبقي: ${dueAmount}` : `Dû: ${dueAmount}`;
    subStatusColor = Colors.light.error;
  } else if (isCredit) {
    iconName = 'menu-book';
    iconColor = Colors.light.primaryDark;
    iconBg = Colors.light.surfaceAlt;
    badgeBg = Colors.light.surfaceAlt;
    badgeColor = Colors.light.primaryDark;
    badgeText = isArabic ? 'دين' : isFrench ? 'Crédit' : 'Credit';
    subStatusText = isArabic ? 'على دفتر الديون' : isFrench ? 'Carnet de dette' : 'Unpaid credit';
    subStatusColor = Colors.light.textSecondary;
  } else {
    // Paid completed
    if (sale.payment_method === 'electronic') {
      iconName = 'credit-card';
      subStatusText = isArabic ? 'دفع إلكتروني' : isFrench ? 'Électronique' : 'Electronic';
      subStatusColor = Colors.light.primary;
    } else {
      iconName = sale.customer_name ? 'receipt-long' : 'payments';
      subStatusText = isArabic ? 'نقداً' : isFrench ? 'Espèces' : 'Cash';
      subStatusColor = Colors.light.primary;
    }
  }

  // Customer display name
  const displayName =
    sale.customer_name ||
    (isArabic ? 'بيع نقدي (الزبون)' : isFrench ? 'Vente au comptoir' : 'Cash Sale');

  // Receipt & Date formatting
  const receiptCode = sale.receipt_no || `#REC-${sale.id}`;
  const relativeDateStr = formatRelativeDate(sale.sold_at, localeParam);
  const timeStr = formatTime(sale.sold_at, localeParam);
  const dateDisplay = `${relativeDateStr}, ${timeStr}`;

  // Amount formatted
  const formattedTotal = formatCentimes(sale.total_centimes, localeParam);

  // Items summary snippet
  const itemsList = sale.saleItems || [];
  const itemsCount = itemsList.length;
  let itemsSnippet = '';
  if (itemsCount > 0) {
    const itemNames = itemsList
      .slice(0, 3)
      .map((it) => it.product_name_snapshot)
      .filter(Boolean)
      .join(', ');
    itemsSnippet = `${itemsCount} ${
      isArabic ? 'عناصر' : isFrench ? 'articles' : 'items'
    }${itemNames ? ` (${itemNames}${itemsCount > 3 ? '...' : ''})` : ''}`;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Sale ${receiptCode} for ${displayName}`}
    >
      <View style={styles.topRow}>
        {/* Left column: icon + names + metadata */}
        <View style={styles.leftColumn}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <MaterialIcons name={iconName} size={20} color={iconColor} />
          </View>

          <View style={styles.infoWrapper}>
            <View style={styles.titleRow}>
              <ThemedText
                style={[
                  styles.customerName,
                  isCancelled && styles.strikeText,
                ]}
                numberOfLines={1}
              >
                {displayName}
              </ThemedText>

              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <ThemedText style={[styles.badgeText, { color: badgeColor }]}>
                  {badgeText}
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.metaText} numberOfLines={1}>
              <ThemedText style={styles.receiptCode}>{receiptCode}</ThemedText>
              {' • '}
              {dateDisplay}
            </ThemedText>
          </View>
        </View>

        {/* Right column: money + subtext + chevron */}
        <View style={styles.rightColumn}>
          <View style={styles.amountBlock}>
            <ThemedText
              style={[
                styles.totalText,
                isCancelled && styles.totalTextCancelled,
              ]}
            >
              {formattedTotal}
            </ThemedText>
            <ThemedText
              style={[styles.subStatusText, { color: subStatusColor }]}
              numberOfLines={1}
            >
              {subStatusText}
            </ThemedText>
          </View>

          <MaterialIcons
            name="chevron-right"
            size={20}
            color={Colors.light.textMuted}
          />
        </View>
      </View>

      {/* Optional bottom container for items or balance notes */}
      {itemsSnippet.length > 0 && (
        <View style={styles.itemsBanner}>
          <MaterialIcons
            name="shopping-basket"
            size={15}
            color={Colors.light.textMuted}
          />
          <ThemedText style={styles.itemsBannerText} numberOfLines={1}>
            {itemsSnippet}
          </ThemedText>
        </View>
      )}

      {isPartial && (sale.amount_paid_centimes ?? 0) > 0 && (
        <View style={styles.partialBanner}>
          <View style={styles.partialBannerLeft}>
            <MaterialIcons
              name="check-circle"
              size={14}
              color={Colors.light.primary}
            />
            <ThemedText style={styles.partialBannerText}>
              {isArabic ? 'المدفوع: ' : isFrench ? 'Payé : ' : 'Paid: '}
              {formatCentimes(sale.amount_paid_centimes || 0, localeParam)}
            </ThemedText>
          </View>
          <ThemedText style={styles.partialDueText}>
            {isArabic ? 'المتبقي: ' : isFrench ? 'Reste : ' : 'Due: '}
            {formatCentimes(sale.remaining_balance_centimes || 0, localeParam)}
          </ThemedText>
        </View>
      )}

      {isCancelled && sale.note && (
        <View style={styles.noteBanner}>
          <MaterialIcons
            name="info-outline"
            size={14}
            color={Colors.light.error}
          />
          <ThemedText style={styles.noteBannerText} numberOfLines={1}>
            {sale.note}
          </ThemedText>
        </View>
      )}

      {isReturned && sale.note && (
        <View style={styles.noteBanner}>
          <MaterialIcons
            name="info-outline"
            size={14}
            color={Colors.light.textSecondary}
          />
          <ThemedText style={styles.noteBannerText} numberOfLines={1}>
            {sale.note}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
    marginRight: Spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrapper: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    flexShrink: 1,
  },
  strikeText: {
    textDecorationLine: 'line-through',
    color: Colors.light.textMuted,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  receiptCode: {
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    letterSpacing: -0.2,
  },
  totalTextCancelled: {
    textDecorationLine: 'line-through',
    color: Colors.light.textMuted,
  },
  subStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  itemsBanner: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsBannerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  partialBanner: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partialBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partialBannerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  partialDueText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.error,
  },
  noteBanner: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteBannerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
});