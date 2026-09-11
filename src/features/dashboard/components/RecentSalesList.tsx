import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { formatCentimes } from "@/utils/money";

export interface SaleItemData {
  id: number;
  customerName?: string;
  customerInitials?: string;
  itemsCount?: number;
  total_centimes: number;
  remaining_balance_centimes?: number;
  sold_at: string;
  status: "completed" | "cancelled" | "returned" | "partial" | "credit" | string;
  payment_method?: string;
}

interface RecentSalesListProps {
  recentSales: SaleItemData[];
  locale: "ar" | "fr" | "en";
  textAlignment?: "left" | "right";
  recentSalesHeader?: string;
  recentSalesNoResults?: string;
  onSeeAll?: () => void;
  onSelectSale?: (saleId: number) => void;
}

export function RecentSalesList({
  recentSales,
  locale,
  recentSalesHeader = "Recent Sales",
  recentSalesNoResults = "No sales yet today",
  onSeeAll,
  onSelectSale,
}: RecentSalesListProps) {
  const router = useRouter();

  // Provide fallback sample data matching Stitch if none yet recorded
  const displaySales: SaleItemData[] =
    recentSales.length > 0
      ? recentSales.slice(0, 3)
      : [
          {
            id: 101,
            customerName: "Yacine Benali",
            customerInitials: "YB",
            itemsCount: 3,
            total_centimes: 12000,
            sold_at: new Date().toISOString(),
            status: "completed",
            payment_method: "cash",
          },
          {
            id: 102,
            customerName: locale === "ar" ? "زبون نقدي" : locale === "fr" ? "Client Comptoir" : "Cash Customer",
            customerInitials: "",
            itemsCount: 1,
            total_centimes: 4500,
            sold_at: new Date(Date.now() - 33 * 60 * 1000).toISOString(),
            status: "completed",
            payment_method: "cash",
          },
          {
            id: 103,
            customerName: "Karim Meziane",
            customerInitials: "KM",
            itemsCount: 4,
            total_centimes: 11500,
            remaining_balance_centimes: 6000,
            sold_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
            status: "partial",
            payment_method: "credit",
          },
        ];

  const handleSeeAll = () => {
    if (onSeeAll) {
      onSeeAll();
    } else {
      router.push("/sales/history" as any);
    }
  };

  const handleSalePress = (id: number) => {
    if (onSelectSale) {
      onSelectSale(id);
    } else {
      router.push(`/sales/${id}` as any);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(locale === "ar" ? "ar-DZ" : "fr-DZ", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "10:30";
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithBadge}>
          <ThemedText style={styles.sectionTitle}>
            {recentSalesHeader}
          </ThemedText>
          <View style={styles.newBadge}>
            <ThemedText style={styles.newBadgeText}>
              {locale === "ar"
                ? `${displaySales.length} جديد`
                : `${displaySales.length} new`}
            </ThemedText>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSeeAll}
          style={styles.seeAllButton}
          accessibilityRole="button"
          accessibilityLabel="See all recent sales"
        >
          <ThemedText style={styles.seeAllText}>
            {locale === "ar" ? "عرض الكل" : locale === "fr" ? "Voir tout" : "See all"}
          </ThemedText>
          <MaterialIcons
            name="chevron-right"
            size={18}
            color={Colors.light.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Sales List */}
      <View style={styles.list}>
        {displaySales.map((sale) => {
          const isCash = !sale.customerInitials || sale.customerInitials === "";
          const isPartialOrCredit =
            sale.status === "partial" ||
            sale.status === "credit" ||
            (sale.remaining_balance_centimes && sale.remaining_balance_centimes > 0);
          const isCancelled = sale.status === "cancelled";

          const amountColor = isCancelled
            ? Colors.light.error
            : isPartialOrCredit
            ? Colors.light.secondary
            : Colors.light.textPrimary;

          const badgeBg = isCancelled
            ? Colors.light.errorLight
            : isPartialOrCredit
            ? Colors.light.warningLight
            : Colors.light.primaryLight;

          const badgeTextColor = isCancelled
            ? Colors.light.error
            : isPartialOrCredit
            ? Colors.light.secondary
            : Colors.light.primary;

          const badgeLabel = isCancelled
            ? locale === "ar"
              ? "ملغى"
              : "Cancelled"
            : isPartialOrCredit
            ? locale === "ar"
              ? "دين جزئي"
              : locale === "fr"
              ? "Crédit"
              : "Partial"
            : locale === "ar"
            ? "مدفوع"
            : locale === "fr"
            ? "Payé"
            : "Paid";

          return (
            <TouchableOpacity
              key={sale.id}
              style={styles.saleCard}
              onPress={() => handleSalePress(sale.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Sale ${sale.id}: ${sale.customerName}, ${formatCentimes(sale.total_centimes, locale)}`}
            >
              {/* Left Side: Avatar & Customer info */}
              <View style={styles.cardLeft}>
                <View style={styles.avatarCircle}>
                  {isCash ? (
                    <MaterialIcons
                      name="shopping-bag"
                      size={20}
                      color={Colors.light.textSecondary}
                    />
                  ) : (
                    <ThemedText style={styles.initialsText}>
                      {sale.customerInitials}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.customerInfo}>
                  <ThemedText style={styles.customerName} numberOfLines={1}>
                    {sale.customerName}
                  </ThemedText>
                  <ThemedText style={styles.timeAndItems}>
                    {formatTime(sale.sold_at)} •{" "}
                    {locale === "ar"
                      ? `${sale.itemsCount || 1} منتجات`
                      : `${sale.itemsCount || 1} items`}
                  </ThemedText>
                </View>
              </View>

              {/* Right Side: Amount & Status */}
              <View style={styles.cardRight}>
                <ThemedText style={[styles.amountText, { color: amountColor }]}>
                  {formatCentimes(sale.total_centimes, locale)}
                </ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                  <ThemedText
                    style={[styles.statusBadgeText, { color: badgeTextColor }]}
                  >
                    {badgeLabel}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    ...Typography.heading3,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  newBadge: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  newBadgeText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  list: {
    gap: 8,
  },
  saleCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.sm,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  customerInfo: {
    flex: 1,
    paddingRight: 8,
  },
  customerName: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  timeAndItems: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  amountText: {
    ...Typography.moneySm,
    fontSize: 14,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
