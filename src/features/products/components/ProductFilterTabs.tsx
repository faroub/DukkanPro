import React from "react";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, Typography, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, ScrollView, View } from "react-native";

interface FilterCounts {
  all?: number;
  lowStock?: number;
  outOfStock?: number;
  archived?: number;
}

interface ProductFilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts?: FilterCounts;
}

const FILTER_OPTIONS = [
  { key: "all", labelKey: "products:filterAll" },
  { key: "lowStock", labelKey: "products:filterLowStock" },
  { key: "outOfStock", labelKey: "products:filterOutOfStock" },
  { key: "archived", labelKey: "products:filterArchived" },
] as const;

export function ProductFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: ProductFilterTabsProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeFilter === option.key;
          const count = counts ? counts[option.key] : undefined;
          const label = t(option.labelKey);

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.tab,
                { backgroundColor: theme.surface, borderColor: theme.border },
                isActive && [styles.tabActive, { backgroundColor: theme.primary, borderColor: theme.primary }],
              ]}
              activeOpacity={0.8}
              onPress={() => onFilterChange(option.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  { color: theme.textSecondary },
                  isActive && [styles.tabTextActive, { color: "#FFFFFF" }],
                ]}
              >
                {count !== undefined ? `${label} (${count})` : label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  tabActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tabText: {
    ...Typography.label,
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

