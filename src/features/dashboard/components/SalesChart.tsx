import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { formatCentimes } from "@/utils/money";

interface SalesChartProps {
  data?: { date: string; total: number }[];
  title?: string;
  locale?: "ar" | "fr" | "en";
}

export function SalesChart({
  data = [],
  title = "7-Day Sales Trend",
  locale = "fr",
}: SalesChartProps) {
  // Default placeholder days if data is empty
  const chartData = data.length > 0
    ? data
    : [
        { date: "Lun", total: 18000 },
        { date: "Mar", total: 24000 },
        { date: "Mer", total: 12000 },
        { date: "Jeu", total: 28000 },
        { date: "Ven", total: 35000 },
        { date: "Sam", total: 42000 },
        { date: "Dim", total: 28000 },
      ];

  const maxVal = Math.max(...chartData.map((d) => d.total), 10000);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.subtitle}>
          Peak: {formatCentimes(maxVal, locale)}
        </ThemedText>
      </View>

      <View style={styles.chartArea}>
        {chartData.map((item, index) => {
          const heightPercent = Math.max(10, Math.round((item.total / maxVal) * 100));
          const isHighest = item.total === maxVal;
          const dayLabel = item.date.length > 5 ? item.date.slice(-2) : item.date;

          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: isHighest
                        ? Colors.light.primary
                        : Colors.light.primaryDark,
                      opacity: isHighest ? 1 : 0.8,
                    },
                  ]}
                />
              </View>
              <ThemedText style={styles.barLabel} numberOfLines={1}>
                {dayLabel}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.label,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    paddingTop: Spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    marginHorizontal: 3,
  },
  barTrack: {
    flex: 1,
    width: "100%",
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: BorderRadius.sm,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: BorderRadius.sm,
    minHeight: 6,
  },
  barLabel: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: Spacing.xs,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
