import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatCentimes } from "@/utils/money";
import { MaterialIcons } from "@expo/vector-icons";

interface SalesChartProps {
  data?: { date: string; total: number }[];
  title?: string;
  subtitle?: string;
  locale?: "ar" | "fr" | "en";
}

const YEARS = [2026, 2025, 2024];

const MONTHS_FR = [
  "Janv",
  "Févr",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sept",
  "Oct",
  "Nov",
  "Déc",
];

const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_AR = [
  "جانفي",
  "فيفري",
  "مارس",
  "أفريل",
  "ماي",
  "جويلية",
  "أوت",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export function SalesChart({
  data = [],
  title,
  subtitle,
  locale = "fr",
}: SalesChartProps) {
  const theme = useTheme();
  const [chartType, setChartType] = useState<"bar" | "area">("bar");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 8 = Sept (0-indexed)

  const monthNames =
    locale === "ar"
      ? MONTHS_AR
      : locale === "en"
      ? MONTHS_EN
      : MONTHS_FR;

  // Generate deterministic dataset for selected month & year if data is not provided or empty
  const yearStr = selectedYear.toString();
  const monthStr = (selectedMonth + 1).toString().padStart(2, "0");
  const filterPrefix = `${yearStr}-${monthStr}`;

  const filteredRawData = data.filter((item) => item.date.startsWith(filterPrefix));

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const chartDataset =
    filteredRawData.length > 0
      ? filteredRawData
      : Array.from({ length: Math.min(daysInMonth, 12) }, (_, i) => {
          const dayNum = Math.min(i * 2 + 1, daysInMonth);
          const dayStr = dayNum.toString().padStart(2, "0");
          const date = `${filterPrefix}-${dayStr}`;
          // Pseudo random reproducible sales amount based on date sum
          const seed = (selectedYear * 12 + selectedMonth + dayNum) * 37;
          const total = 12000 + (seed % 28000);
          return { date, total };
        });

  // Format date helper for X-axis labels
  const formatDayLabel = (dateStr: string, index: number, isLast: boolean) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        return `${monthNames[selectedMonth]} ${day}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formattedData = chartDataset.map((item, index) => {
    const isToday =
      item.date === "2026-09-12" || index === chartDataset.length - 1;
    const amountInDZD = Math.round(item.total / 100);
    return {
      date: item.date,
      label: formatDayLabel(item.date, index, isToday),
      totalCentimes: item.total,
      amount: amountInDZD,
      isToday,
    };
  });

  const totalSumCentimes = formattedData.reduce(
    (acc, curr) => acc + curr.totalCentimes,
    0
  );
  const avgDZD = Math.round(
    totalSumCentimes / (formattedData.length || 1) / 100
  );
  const peakDZD = Math.max(...formattedData.map((d) => d.amount), 0);

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <View
          style={[
            styles.tooltipContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemedText style={[styles.tooltipLabel, { color: theme.textSecondary }]}>
            {item.label} ({item.date})
          </ThemedText>
          <ThemedText style={[styles.tooltipValue, { color: theme.primary }]}>
            {formatCentimes(item.totalCentimes)}
          </ThemedText>
        </View>
      );
    }
    return null;
  };

  const defaultTitle =
    title ||
    (locale === "ar"
      ? "مخطط مبيعات المتجر"
      : locale === "fr"
      ? "Tendance des Ventes"
      : "Store Sales Trend");

  const defaultSubtitle =
    subtitle ||
    `${monthNames[selectedMonth]} ${selectedYear} • ${formattedData.length} ${
      locale === "ar" ? "أيام" : locale === "fr" ? "jours" : "days"
    }`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      id="sales-chart-recharts-card"
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <MaterialIcons name="insights" size={20} color={theme.primary} />
            <ThemedText style={[styles.title, { color: theme.textPrimary }]}>
              {defaultTitle}
            </ThemedText>
          </View>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {defaultSubtitle}
          </ThemedText>
        </View>

        {/* Toggle Bar / Area buttons */}
        <View style={[styles.toggleContainer, { backgroundColor: theme.surfaceAlt }]}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              chartType === "bar" && [styles.toggleBtnActive, { backgroundColor: theme.surface }],
            ]}
            onPress={() => setChartType("bar")}
            activeOpacity={0.7}
            id="btn-chart-type-bar"
          >
            <MaterialIcons
              name="bar-chart"
              size={18}
              color={chartType === "bar" ? theme.primary : theme.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              chartType === "area" && [styles.toggleBtnActive, { backgroundColor: theme.surface }],
            ]}
            onPress={() => setChartType("area")}
            activeOpacity={0.7}
            id="btn-chart-type-area"
          >
            <MaterialIcons
              name="show-chart"
              size={18}
              color={chartType === "area" ? theme.primary : theme.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Year & Month Selection Controls */}
      <View style={[styles.filterBar, { borderTopColor: theme.borderLight, borderBottomColor: theme.borderLight }]}>
        {/* Year Pills */}
        <View style={styles.yearRow}>
          <MaterialIcons name="calendar-today" size={14} color={theme.textMuted} />
          {YEARS.map((y) => {
            const isSelected = selectedYear === y;
            return (
              <TouchableOpacity
                key={y}
                style={[
                  styles.yearPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surfaceAlt,
                  },
                ]}
                onPress={() => setSelectedYear(y)}
                activeOpacity={0.7}
                id={`btn-year-${y}`}
              >
                <ThemedText
                  style={[
                    styles.yearPillText,
                    { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  {y}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Month Selector Scroll Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthScrollContent}
        >
          {monthNames.map((mName, idx) => {
            const isSelected = selectedMonth === idx;
            return (
              <TouchableOpacity
                key={mName}
                style={[
                  styles.monthPill,
                  {
                    backgroundColor: isSelected ? theme.primaryLight : "transparent",
                    borderColor: isSelected ? theme.primary : theme.borderLight,
                  },
                ]}
                onPress={() => setSelectedMonth(idx)}
                activeOpacity={0.7}
                id={`btn-month-${idx}`}
              >
                <ThemedText
                  style={[
                    styles.monthPillText,
                    {
                      color: isSelected ? theme.primary : theme.textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {mName}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Metrics Summary Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
            {locale === "ar" ? "الإجمالي" : locale === "fr" ? "Total Mois" : "Monthly Total"}
          </ThemedText>
          <ThemedText style={[styles.metricValue, { color: theme.primary }]}>
            {formatCentimes(totalSumCentimes)}
          </ThemedText>
        </View>

        <View style={[styles.metricDivider, { backgroundColor: theme.borderLight }]} />

        <View style={styles.metricItem}>
          <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
            {locale === "ar" ? "المعدل اليومي" : locale === "fr" ? "Moy. / Jour" : "Daily Avg"}
          </ThemedText>
          <ThemedText style={[styles.metricValue, { color: theme.textPrimary }]}>
            {avgDZD} DZD
          </ThemedText>
        </View>

        <View style={[styles.metricDivider, { backgroundColor: theme.borderLight }]} />

        <View style={styles.metricItem}>
          <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
            {locale === "ar" ? "أعلى يوم" : locale === "fr" ? "Pic Max" : "Peak Day"}
          </ThemedText>
          <ThemedText style={[styles.metricValue, { color: theme.textPrimary }]}>
            {peakDZD} DZD
          </ThemedText>
        </View>
      </View>

      {/* Recharts Container */}
      <View style={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={180}>
          {chartType === "bar" ? (
            <BarChart
              data={formattedData}
              margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme.border}
                strokeOpacity={0.4}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.textSecondary, fontSize: 10, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.textSecondary, fontSize: 10 }}
                unit=" DZD"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {formattedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? theme.primary : theme.primaryLight}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart
              data={formattedData}
              margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.primary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={theme.primary} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme.border}
                strokeOpacity={0.4}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.textSecondary, fontSize: 10, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.textSecondary, fontSize: 10 }}
                unit=" DZD"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={theme.primary}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    ...Typography.label,
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: "row",
    padding: 3,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  toggleBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBtnActive: {
    ...Shadows.sm,
  },
  filterBar: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 6,
    marginVertical: 6,
  },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  yearPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  yearPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  monthScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  monthPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  monthPillText: {
    fontSize: 11,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 6,
    marginBottom: 4,
  },
  metricItem: {
    alignItems: "center",
  },
  metricLabel: {
    ...Typography.caption,
    fontSize: 11,
  },
  metricValue: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  chartWrapper: {
    height: 180,
    width: "100%",
    marginTop: 2,
  },
  tooltipContainer: {
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "600",
  },
  tooltipValue: {
    ...Typography.label,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
});
