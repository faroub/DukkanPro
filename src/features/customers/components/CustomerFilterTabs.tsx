import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface CustomerFilterCounts {
  all?: number;
  withDebt?: number;
  noDebt?: number;
  archived?: number;
}

interface CustomerFilterTabsProps {
  activeFilter: string;
  onFilterChange?: (newFilter: string) => void;
  onSelectFilter?: (newFilter: string) => void;
  counts?: CustomerFilterCounts;
}

export function CustomerFilterTabs({
  activeFilter,
  onFilterChange,
  onSelectFilter,
  counts,
}: CustomerFilterTabsProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleSelect = (val: string) => {
    if (onSelectFilter) onSelectFilter(val);
    if (onFilterChange) onFilterChange(val);
  };

  const filters = [
    { value: "all", label: t("customers:all"), count: counts?.all },
    { value: "withDebt", label: t("customers:withDebt"), count: counts?.withDebt },
    { value: "noDebt", label: t("customers:noDebt"), count: counts?.noDebt },
    { value: "archived", label: t("customers:archived"), count: counts?.archived },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;
          const isDebtFilter = filter.value === "withDebt";

          return (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? theme.primary : theme.surface,
                  borderColor: isActive ? theme.primary : theme.borderLight,
                },
              ]}
              onPress={() => handleSelect(filter.value)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <ThemedText
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? "#FFFFFF" : theme.textSecondary,
                  },
                ]}
              >
                {filter.label}
              </ThemedText>

              {filter.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isActive
                        ? "rgba(255, 255, 255, 0.25)"
                        : isDebtFilter && (filter.count ?? 0) > 0
                          ? theme.errorLight
                          : theme.surfaceAlt,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.countText,
                      {
                        color: isActive
                          ? "#FFFFFF"
                          : isDebtFilter && (filter.count ?? 0) > 0
                            ? theme.error
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    {filter.count}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  scrollContent: {
    gap: Spacing.xs,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
