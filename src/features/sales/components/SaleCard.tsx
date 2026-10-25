import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { formatCentimes } from '@/utils/money';
import { formatRelativeDate, formatTime } from '@/utils/dates';
import { useTheme } from '@/hooks/use-theme';

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
  currency?: string;
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
  const { i18n } = useTranslation();
  const theme = useTheme();
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

  // Icon, colors, and badge styling
  let iconName: keyof typeof MaterialIcons.glyphMap = 'payments';
  let iconColor: string = theme.primary;
  let iconBg: string = theme.primaryLight;
  let badgeBg: string = theme.primaryLight;
  let badgeColor: string = theme.primary;
  let badgeText = isArabic ? 'مدفوع' : isFrench ? 'Payé' : 'Paid';
  let subStatusText = isArabic ? 'نقداً' : isFrench ? 'Espèces' : 'Cash';
  let subStatusColor: string = theme.primary;

  if (isCancelled) {
    iconName = 'block';
    iconColor = theme.error;
    iconBg = theme.errorLight;
    badgeBg = theme.errorLight;
    badgeColor = theme.error;
    badgeText = isArabic ? 'ملغى' : isFrench ? 'Annulé' : 'Cancelled';
    subStatusText = isArabic ? 'معاملة ملغاة' : isFrench ? 'Vente annulée' : 'Voided sale';
    subStatusColor = theme.error;
  } else if (isReturned) {
    iconName = 'assignment-return';
    iconColor = theme.textSecondary;
    iconBg = theme.surfaceAlt;
    badgeBg = theme.surfaceAlt;
    badgeColor = theme.textSecondary;
    badgeText = isArabic ? 'مسترجع' : isFrench ? 'Retourné' : 'Returned';
    subStatusText = isArabic ? 'تم إرجاع البضاعة' : isFrench ? 'Réapprovisionné' : 'Restocked';
    subStatusColor = theme.textSecondary;
  } else if (isPartial) {
    iconName = 'pending-actions';
    iconColor = theme.warning;
    iconBg = theme.warningLight;
    badgeBg = theme.warningLight;
    badgeColor = theme.warning;
    badgeText = isArabic ? 'جزئي' : isFrench ? 'Partiel' : 'Partial';
    const dueAmount = formatCentimes(
      sale.remaining_balance_centimes || 0,
      localeParam,
      sale.currency || "DZD",
    );
    subStatusText = isArabic ? `المتبقي عند البيع: ${dueAmount}` : isFrench ? `Initial à la vente: ${dueAmount}` : `At-sale initial: ${dueAmount}`;
    subStatusColor = theme.warning;
  } else if (isCredit) {
    iconName = 'menu-book';
    iconColor = theme.primary;
    iconBg = theme.primaryLight;
    badgeBg = theme.primaryLight;
    badgeColor = theme.primary;
    badgeText = isArabic ? 'دين' : isFrench ? 'Crédit' : 'Credit';
    subStatusText = isArabic ? 'مسجل في دفتر الكريدي' : isFrench ? 'Inscrit au carnet client' : 'Recorded in customer ledger';
    subStatusColor = theme.textSecondary;
  } else {
    // Paid completed
    if (sale.payment_method === 'electronic') {
      iconName = 'credit-card';
      subStatusText = isArabic ? 'دفع إلكتروني' : isFrench ? 'Électronique' : 'Electronic';
      subStatusColor = theme.primary;
    } else {
      iconName = sale.customer_name ? 'receipt-long' : 'payments';
      subStatusText = isArabic ? 'نقداً' : isFrench ? 'Espèces' : 'Cash';
      subStatusColor = theme.primary;
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
  const formattedTotal = formatCentimes(
    sale.total_centimes,
    localeParam,
    sale.currency || "DZD",
  );

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
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}
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
                  { color: theme.textPrimary },
                  isCancelled && [styles.strikeText, { color: theme.textMuted }],
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

            <ThemedText style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
              <ThemedText style={[styles.receiptCode, { color: theme.textPrimary }]}>{receiptCode}</ThemedText>
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
                { color: theme.textPrimary },
                isCancelled && [styles.totalTextCancelled, { color: theme.textMuted }],
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
            color={theme.textMuted}
          />
        </View>
      </View>

      {/* Optional bottom container for items or balance notes */}
      {itemsSnippet.length > 0 && (
        <View style={[styles.itemsBanner, { backgroundColor: theme.surfaceAlt }]}>
          <MaterialIcons
            name="shopping-basket"
            size={15}
            color={theme.textMuted}
          />
          <ThemedText style={[styles.itemsBannerText, { color: theme.textSecondary }]} numberOfLines={1}>
            {itemsSnippet}
          </ThemedText>
        </View>
      )}

      {isPartial && (sale.amount_paid_centimes ?? 0) > 0 && (
        <View style={[styles.partialBanner, { backgroundColor: theme.surfaceAlt }]}>
          <View style={styles.partialBannerLeft}>
            <MaterialIcons
              name="check-circle"
              size={14}
              color={theme.primary}
            />
            <ThemedText style={[styles.partialBannerText, { color: theme.textSecondary }]}>
              {isArabic ? 'المدفوع بالكاسة: ' : isFrench ? 'Payé à la caisse : ' : 'Paid at checkout: '}
              {formatCentimes(sale.amount_paid_centimes || 0, localeParam)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.partialDueText, { color: theme.warning }]}>
            {isArabic ? 'المتبقي عند البيع: ' : isFrench ? 'Initial à la vente : ' : 'At-sale initial: '}
            {formatCentimes(sale.remaining_balance_centimes || 0, localeParam)}
          </ThemedText>
        </View>
      )}

      {isCancelled && sale.note && (
        <View style={[styles.noteBanner, { backgroundColor: theme.surfaceAlt }]}>
          <MaterialIcons
            name="info-outline"
            size={14}
            color={theme.error}
          />
          <ThemedText style={[styles.noteBannerText, { color: theme.textSecondary }]} numberOfLines={1}>
            {sale.note}
          </ThemedText>
        </View>
      )}

      {isReturned && sale.note && (
        <View style={[styles.noteBanner, { backgroundColor: theme.surfaceAlt }]}>
          <MaterialIcons
            name="info-outline"
            size={14}
            color={theme.textSecondary}
          />
          <ThemedText style={[styles.noteBannerText, { color: theme.textSecondary }]} numberOfLines={1}>
            {sale.note}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftColumn: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
    marginRight: Spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  infoWrapper: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  strikeText: {
    textDecorationLine: "line-through",
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metaText: {
    fontSize: 12,
  },
  receiptCode: {
    fontWeight: "600",
  },
  rightColumn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  amountBlock: {
    alignItems: "flex-end",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  totalTextCancelled: {
    textDecorationLine: "line-through",
  },
  subStatusText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  itemsBanner: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemsBannerText: {
    fontSize: 12,
    flex: 1,
  },
  partialBanner: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  partialBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  partialBannerText: {
    fontSize: 12,
  },
  partialDueText: {
    fontSize: 12,
    fontWeight: "600",
  },
  noteBanner: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noteBannerText: {
    fontSize: 12,
    fontStyle: "italic",
    flex: 1,
  },
});
