import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();

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
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={handleRevenuePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${revenueKey}: ${revenueDZD} DZD`}
      >
        <View style={styles.cardTop}>
          <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            {revenueKey}
          </ThemedText>
          <View style={[styles.iconBoxPrimary, { backgroundColor: theme.primaryLight }]}>
            <MaterialIcons
              name="point-of-sale"
              size={15}
              color={theme.primary}
            />
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountText, { color: theme.primary }]}>
              {formatAmount(revenueDZD)}
            </ThemedText>
            <ThemedText style={[styles.currencyLabel, { color: theme.primary }]}>
              DZD
            </ThemedText>
          </View>
          <ThemedText style={[styles.subText, { color: theme.textSecondary }]} numberOfLines={1}>
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
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={handleProfitPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${profitKey}: ${profitDZD} DZD`}
      >
        <View style={styles.cardTop}>
          <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            {profitKey}
          </ThemedText>
          <View style={[styles.badgePrimary, { backgroundColor: theme.primaryLight }]}>
            <ThemedText style={[styles.badgePrimaryText, { color: theme.primary }]}>
              {profitPercent}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountText, { color: theme.primary }]}>
              {formatAmount(profitDZD)}
            </ThemedText>
            <ThemedText style={[styles.currencyLabel, { color: theme.primary }]}>
              DZD
            </ThemedText>
          </View>
          <ThemedText style={[styles.subText, { color: theme.textSecondary }]} numberOfLines={1}>
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
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={handleToCollectPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${toCollectKey}: ${toCollectDZD} DZD`}
      >
        <View style={styles.cardTop}>
          <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            {toCollectKey}
          </ThemedText>
          <View style={[styles.badgeWarning, { backgroundColor: theme.warningLight }]}>
            <ThemedText style={[styles.badgeWarningText, { color: theme.secondary }]}>
              {locale === "ar"
                ? `${debtCustomersCount} زبائن`
                : `${debtCustomersCount} clients`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountText, { color: theme.secondary }]}>
              {formatAmount(toCollectDZD)}
            </ThemedText>
            <ThemedText style={[styles.currencyLabel, { color: theme.secondary }]}>
              DZD
            </ThemedText>
          </View>
          <ThemedText style={[styles.subText, { color: theme.textSecondary }]} numberOfLines={1}>
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
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={handleLowStockPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${lowStockKey}: ${lowStockCount} items`}
      >
        <View style={styles.cardTop}>
          <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            {lowStockKey}
          </ThemedText>
          <View style={[styles.iconBoxWarning, { backgroundColor: theme.warningLight }]}>
            <MaterialIcons
              name="notification-important"
              size={15}
              color={theme.secondary}
            />
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountText, { color: theme.secondary }]}>
              {lowStockCount}
            </ThemedText>
            <ThemedText style={[styles.currencyLabel, { color: theme.secondary }]}>
              {locale === "ar" ? "منتجات" : "items"}
            </ThemedText>
          </View>
          <ThemedText style={[styles.subText, { color: theme.textSecondary }]} numberOfLines={1}>
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
    borderWidth: 1,
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
    fontWeight: "500",
    flex: 1,
    paddingRight: 4,
  },
  iconBoxPrimary: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePrimary: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePrimaryText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "700",
  },
  iconBoxWarning: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWarning: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeWarningText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "700",
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
  subText: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: 1,
  },
});
