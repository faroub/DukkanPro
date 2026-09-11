import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

export interface CustomerFilterCounts {
  all?: number;
  withDebt?: number;
  noDebt?: number;
  archived?: number;
}

interface CustomerFilterTabsProps {
  activeFilter: string;
  onFilterChange: (newFilter: string) => void;
  counts?: CustomerFilterCounts;
}

export function CustomerFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: CustomerFilterTabsProps) {
  const { t } = useTranslation();

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
                isActive && styles.tabActive,
              ]}
              onPress={() => onFilterChange(filter.value)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <ThemedText
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {filter.label}
              </ThemedText>

              {filter.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isActive
                      ? styles.countBadgeActive
                      : isDebtFilter && (filter.count ?? 0) > 0
                        ? styles.countBadgeDebt
                        : styles.countBadgeInactive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.countText,
                      isActive
                        ? styles.countTextActive
                        : isDebtFilter && (filter.count ?? 0) > 0
                          ? styles.countTextDebt
                          : styles.countTextInactive,
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
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  tabActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
  tabLabelInactive: {
    color: Colors.light.textSecondary,
  },
  countBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  countBadgeDebt: {
    backgroundColor: Colors.light.errorLight,
  },
  countBadgeInactive: {
    backgroundColor: Colors.light.surfaceAlt,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
  countTextActive: {
    color: "#FFFFFF",
  },
  countTextDebt: {
    color: Colors.light.destructive,
  },
  countTextInactive: {
    color: Colors.light.textSecondary,
  },
});
