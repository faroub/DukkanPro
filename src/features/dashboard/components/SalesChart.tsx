import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";

interface SalesChartProps {
  data?: { date: string; total: number }[];
  title?: string;
  subtitle?: string;
  locale?: "ar" | "fr" | "en";
}

export function SalesChart({
  data = [],
  title = "7-Day Sales Activity",
  subtitle = "Weekly performance",
  locale = "fr",
}: SalesChartProps) {
  // Default 7-day data matching Stitch design
  const chartData =
    data.length === 7
      ? data
      : [
          { date: locale === "ar" ? "الجمعة" : locale === "fr" ? "Ven" : "Fri", total: 19000 },
          { date: locale === "ar" ? "السبت" : locale === "fr" ? "Sam" : "Sat", total: 31000 },
          { date: locale === "ar" ? "الأحد" : locale === "fr" ? "Dim" : "Sun", total: 24000 },
          { date: locale === "ar" ? "الإثنين" : locale === "fr" ? "Lun" : "Mon", total: 18000 },
          { date: locale === "ar" ? "الثلاثاء" : locale === "fr" ? "Mar" : "Tue", total: 26000 },
          { date: locale === "ar" ? "الأربعاء" : locale === "fr" ? "Mer" : "Wed", total: 22500 },
          { date: locale === "ar" ? "اليوم" : locale === "fr" ? "Aujourd'hui" : "Today", total: 28000 },
        ];

  const maxVal = Math.max(...chartData.map((d) => d.total), 10000);
  const totalSum = chartData.reduce((acc, curr) => acc + curr.total, 0);
  const avgDZD = Math.round(totalSum / 7 / 100);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        </View>
        <View style={styles.avgBadge}>
          <ThemedText style={styles.avgBadgeText}>
            {locale === "ar"
              ? `المعدل: ${avgDZD} دج`
              : `Avg: ${avgDZD} DZD`}
          </ThemedText>
        </View>
      </View>

      {/* Chart Bars */}
      <View style={styles.chartContainer}>
        {chartData.map((item, index) => {
          const isToday = index === chartData.length - 1;
          const heightPercent = Math.max(12, Math.round((item.total / maxVal) * 100));

          return (
            <View key={index} style={styles.column}>
              {/* Bar track and fill */}
              <View style={styles.barWrapper}>
                {isToday && <View style={styles.todayIndicatorDot} />}
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: isToday
                        ? Colors.light.primary
                        : Colors.light.primaryLight,
                    },
                  ]}
                />
              </View>

              {/* Day Label */}
              <ThemedText
                style={[
                  styles.dayLabel,
                  isToday && styles.todayLabel,
                ]}
                numberOfLines={1}
              >
                {item.date}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.label,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  avgBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.light.surfaceAlt,
  },
  avgBadgeText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 116,
    paddingTop: 10,
    gap: 6,
  },
  column: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
  },
  todayIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginBottom: 4,
  },
  barFill: {
    width: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 10,
  },
  dayLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  todayLabel: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
});
