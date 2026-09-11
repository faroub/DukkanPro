import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { formatCentimes } from "@/utils/money";

interface SummaryCardsProps {
  revenueKey: string;
  revenueValue_centimes: number;
  profitKey: string;
  profitValue_centimes: number;
  toCollectKey?: string;
  toCollectValue_centimes?: number;
  lowStockKey?: string;
  lowStockCount?: number;
  salesCount?: number;
  debtCustomersCount?: number;
  profitPercent?: string;
  locale: "ar" | "fr" | "en";
  textAlignment?: "left" | "right";
  onPressRevenue?: () => void;
  onPressProfit?: () => void;
  onPressToCollect?: () => void;
  onPressLowStock?: () => void;
}

export function SummaryCards({
  revenueKey,
  revenueValue_centimes,
  profitKey,
  profitValue_centimes,
  toCollectKey = "To Collect",
  toCollectValue_centimes = 0,
  lowStockKey = "Low Stock",
  lowStockCount = 0,
  salesCount = 14,
  debtCustomersCount = 5,
  profitPercent = "+22%",
  locale,
  onPressRevenue,
  onPressProfit,
  onPressToCollect,
  onPressLowStock,
}: SummaryCardsProps) {
  const router = useRouter();

  const handleRevenuePress = () => {
    if (onPressRevenue) onPressRevenue();
    else router.push("/sales/history" as any);
  };

  const handleProfitPress = () => {
    if (onPressProfit) onPressProfit();
    else router.push("/sales/history" as any);
  };

  const handleToCollectPress = () => {
    if (onPressToCollect) onPressToCollect();
    else router.push("/(tabs)/customers" as any);
  };

  const handleLowStockPress = () => {
    if (onPressLowStock) onPressLowStock();
    else router.push("/products/low-stock" as any);
  };

  // Convert centimes to DZD number string for display
  const revenueDZD = Math.round(revenueValue_centimes / 100);
  const profitDZD = Math.round(profitValue_centimes / 100);
  const toCollectDZD = Math.round(toCollectValue_centimes / 100);

  const formatAmount = (val: number) => {
    return val.toLocaleString(locale === "ar" ? "ar-DZ" : "fr-DZ");
  };

  return (
    <View style={styles.grid}>
      {/* Metric Card 1: Today's Sales (Green) */}
      <TouchableOpacity
        style={styles.card}
        onPress={handleRevenuePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${revenueKey}: ${revenueDZD} DZD`}
      >
        <View style={styles.cardTop}>
          <ThemedText style={styles.cardLabel} numberOfLines={1}>
            {revenueKey}
          </ThemedText>
          <View style={styles.iconBoxPrimary}>
            <MaterialIcons
              name="point-of-sale"
              size={15}
              color={Colors.light.primary}
            />
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountText, styles.primaryText]}>
              {formatAmount(revenueDZD)}
            </ThemedText>
            <ThemedText style={[styles.currencyLabel, styles.primaryText]}>
              DZD
            </ThemedText>
          </View>
          <ThemedText style={styles.subText} numberOfLines={1}>
            {locale === "ar"
              ? `${salesCount} عملية بيع`
              : locale === "fr"
              ? `${salesCount} transactions`
              : `${salesCount} transactions`}
          </ThemedText>
        </View>
      </TouchableOpacity>

      {/* Metric Card 2: Est. Profit (Green) */}
      <TouchableOpacity
        style={styles.card}
        onPress={handleProfitPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${profitKey}: ${profitDZD} DZD`}
      >
        <View style={styles.cardTop}>
          <ThemedText style={styles.cardLabel} numberOfLines={1}>
            {profitKey}
          </ThemedText>
          <View style={styles.badgePrimary}>
            <ThemedText style={styles.badgePrimaryText}>
              {profitPercent}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountText, styles.primaryText]}>
              {formatAmount(profitDZD)}
            </ThemedText>
            <ThemedText style={[styles.currencyLabel, styles.primaryText]}>
              DZD
            </ThemedText>
          </View>
          <ThemedText style={styles.subText} numberOfLines={1}>
            {locale === "ar"
              ? "الربح التقديري"
              : locale === "fr"
              ? "Bénéfice net"
              : "Estimated net"}
          </ThemedText>
        </View>
      </TouchableOpacity>

      {/* Metric Card 3: To Collect (Amber) */}
      <TouchableOpacity
        style={styles.card}
        onPress={handleToCollectPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${toCollectKey}: ${toCollectDZD} DZD`}
      >
        <View style={styles.cardTop}>
          <ThemedText style={styles.cardLabel} numberOfLines={1}>
            {toCollectKey}
          </ThemedText>
          <View style={styles.badgeWarning}>
            <ThemedText style={styles.badgeWarningText}>
              {locale === "ar"
                ? `${debtCustomersCount} زبائن`
                : `${debtCustomersCount} clients`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountText, styles.secondaryText]}>
              {formatAmount(toCollectDZD)}
            </ThemedText>
            <ThemedText style={[styles.currencyLabel, styles.secondaryText]}>
              DZD
            </ThemedText>
          </View>
          <ThemedText style={styles.subText} numberOfLines={1}>
            {locale === "ar"
              ? "دفتر الديون"
              : locale === "fr"
              ? "Carnet crédit"
              : "Credit / Debt"}
          </ThemedText>
        </View>
      </TouchableOpacity>

      {/* Metric Card 4: Low Stock Alert (Amber) */}
      <TouchableOpacity
        style={styles.card}
        onPress={handleLowStockPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${lowStockKey}: ${lowStockCount} items`}
      >
        <View style={styles.cardTop}>
          <ThemedText style={styles.cardLabel} numberOfLines={1}>
            {lowStockKey}
          </ThemedText>
          <View style={styles.iconBoxWarning}>
            <MaterialIcons
              name="notification-important"
              size={15}
              color={Colors.light.secondary}
            />
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountText, styles.secondaryText]}>
              {lowStockCount}
            </ThemedText>
            <ThemedText style={[styles.currencyLabel, styles.secondaryText]}>
              {locale === "ar" ? "منتجات" : "items"}
            </ThemedText>
          </View>
          <ThemedText style={styles.subText} numberOfLines={1}>
            {lowStockCount > 0
              ? locale === "ar"
                ? "تنبيه بالنقص"
                : locale === "fr"
                ? "Réapprovisionner"
                : "Reorder soon"
              : locale === "ar"
              ? "المخزون متوفر"
              : "Stock OK"}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: Spacing.md,
  },
  card: {
    width: "48%",
    flexGrow: 1,
    height: 128,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: "space-between",
    ...Shadows.sm,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "500",
    flex: 1,
    paddingRight: 4,
  },
  iconBoxPrimary: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePrimary: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.light.primaryLight,
  },
  badgePrimaryText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  iconBoxWarning: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.light.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWarning: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.light.warningLight,
  },
  badgeWarningText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.secondary,
  },
  cardBottom: {
    marginTop: 2,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  amountText: {
    ...Typography.moneyDisplay,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  currencyLabel: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: "600",
  },
  primaryText: {
    color: Colors.light.primary,
  },
  secondaryText: {
    color: Colors.light.secondary,
  },
  subText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
});
