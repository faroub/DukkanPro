import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
  locale: "ar" | "fr" | "en";
  textAlignment: "left" | "right";
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
  locale,
  textAlignment,
}: SummaryCardsProps) {
  return (
    <View style={styles.grid}>
      {/* Card 1: Today's Sales */}
      <ThemedView style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardLabel} numberOfLines={1}>
            {revenueKey}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: Colors.light.primaryLight }]}>
            <ThemedText style={[styles.badgeText, { color: Colors.light.primary }]}>DZD</ThemedText>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <ThemedText style={[styles.cardValue, { color: Colors.light.primary }]}>
            {formatCentimes(revenueValue_centimes, locale)}
          </ThemedText>
        </View>
      </ThemedView>

      {/* Card 2: Est. Profit */}
      <ThemedView style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardLabel} numberOfLines={1}>
            {profitKey}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: Colors.light.primaryLight }]}>
            <ThemedText style={[styles.badgeText, { color: Colors.light.primary }]}>Net</ThemedText>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <ThemedText style={[styles.cardValue, { color: Colors.light.primary }]}>
            {formatCentimes(profitValue_centimes, locale)}
          </ThemedText>
        </View>
      </ThemedView>

      {/* Card 3: To Collect (Carnet crédit) */}
      <ThemedView style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardLabel} numberOfLines={1}>
            {toCollectKey}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: Colors.light.warningLight }]}>
            <ThemedText style={[styles.badgeText, { color: Colors.light.warning }]}>Credit</ThemedText>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <ThemedText style={[styles.cardValue, { color: Colors.light.warning }]}>
            {formatCentimes(toCollectValue_centimes, locale)}
          </ThemedText>
        </View>
      </ThemedView>

      {/* Card 4: Low Stock Alert */}
      <ThemedView style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardLabel} numberOfLines={1}>
            {lowStockKey}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: lowStockCount > 0 ? Colors.light.warningLight : Colors.light.primaryLight }]}>
            <ThemedText style={[styles.badgeText, { color: lowStockCount > 0 ? Colors.light.warning : Colors.light.primary }]}>
              {lowStockCount > 0 ? "Alert" : "OK"}
            </ThemedText>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <ThemedText style={[styles.cardValue, { color: lowStockCount > 0 ? Colors.light.warning : Colors.light.textPrimary }]}>
            {lowStockCount}
          </ThemedText>
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: Spacing.lg,
  },
  card: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    minHeight: 110,
    justifyContent: "space-between",
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  cardLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardBottom: {
    marginTop: Spacing.xs,
  },
  cardValue: {
    ...Typography.moneyDisplay,
    fontSize: 20,
    lineHeight: 26,
  },
});
