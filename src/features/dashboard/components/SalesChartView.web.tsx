/**
 * Web-only chart renderer for SalesChart, backed by recharts (DOM-based).
 * On native, `./SalesChartView` resolves to SalesChartView.tsx instead, so this
 * module — and the recharts dependency — never enter the native bundle.
 */
import { StyleSheet, View } from "react-native";
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
import { BorderRadius, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatCentimes } from "@/utils/money";
import type { ChartPoint } from "./SalesChart";

function CustomTooltip({ active, payload }: any) {
  const theme = useTheme();

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
}

export function SalesChartView({
  data,
  chartType,
}: {
  data: ChartPoint[];
  chartType: "bar" | "area";
}) {
  const theme = useTheme();

  return chartType === "bar" ? (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
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
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isToday ? theme.primary : theme.primaryLight}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart
        data={data}
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
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
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
