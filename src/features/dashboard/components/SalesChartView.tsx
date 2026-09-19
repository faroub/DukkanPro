/**
 * Native chart renderer for SalesChart, built from plain React Native Views
 * (recharts is DOM-based and would crash on native; react-native-svg is not a
 * dependency, so this adds none). Bar mode draws rounded bars; area mode draws
 * translucent fill columns with a marker dot at each point's top.
 *
 * Touch devices have no hover, so the web tooltip is replaced with tap-to-select:
 * the readout above the plot shows the selected point's value (defaulting to the
 * peak).
 */
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { formatCentimes } from "@/utils/money";
import type { ChartPoint } from "./SalesChart";

const PLOT_HEIGHT = 160;

export function SalesChartView({
  data,
  chartType,
}: {
  data: ChartPoint[];
  chartType: "bar" | "area";
}) {
  const theme = useTheme();

  const peakIndex = data.reduce(
    (best, point, index) => (point.amount > data[best].amount ? index : best),
    0,
  );
  const [selected, setSelected] = useState(peakIndex);
  const selectedPoint = data[selected];

  const maxAmount = Math.max(...data.map((point) => point.amount), 1);
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <View>
      {selectedPoint ? (
        <View style={styles.readout}>
          <ThemedText
            style={[styles.readoutLabel, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {selectedPoint.label} ({selectedPoint.date})
          </ThemedText>
          <ThemedText style={[styles.readoutValue, { color: theme.primary }]}>
            {formatCentimes(selectedPoint.totalCentimes)}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.plot, { height: PLOT_HEIGHT }]}>
        {data.map((point, index) => {
          const heightPct = Math.max((point.amount / maxAmount) * 100, 2);
          const color = point.isToday ? theme.primary : theme.primaryLight;
          const isSelected = selected === index;

          return (
            <Pressable
              key={point.date}
              style={styles.column}
              onPress={() => setSelected(index)}
              accessibilityRole="button"
              android_ripple={{ color: theme.border, radius: 8 }}
            >
              {chartType === "area" ? (
                <>
                  <View
                    style={[
                      styles.areaDot,
                      {
                        backgroundColor: theme.primary,
                        opacity: isSelected ? 1 : 0.85,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.areaFill,
                      {
                        height: `${heightPct}%`,
                        backgroundColor: color,
                        opacity: isSelected ? 0.4 : 0.2,
                      },
                    ]}
                  />
                </>
              ) : (
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${heightPct}%`,
                      backgroundColor: color,
                      opacity: isSelected ? 1 : 0.9,
                    },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {data.map((point, index) => (
          <View key={`label-${point.date}`} style={styles.column}>
            {index % labelStep === 0 || index === data.length - 1 ? (
              <ThemedText
                style={[styles.axisLabel, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {point.date.slice(8)}
              </ThemedText>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginBottom: 2,
  },
  readoutLabel: {
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  readoutValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  plot: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
  },
  column: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  areaFill: {
    width: "100%",
  },
  areaDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginBottom: -4,
  },
  labelsRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 4,
  },
  axisLabel: {
    fontSize: 9,
    textAlign: "center",
  },
});
