import { View, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface CustomerFilterTabsProps {
  activeFilter?: string;
  onFilterChange: (newFilter: string) => void;
}

export function CustomerFilterTabs({ activeFilter, onFilterChange }: CustomerFilterTabsProps) {
  const { t } = useTranslation();

  const filters = [
    { value: "all", label: t("customers:all") },
    { value: "withDebt", label: t("customers:withDebt") },
    { value: "noDebt", label: t("customers:noDebt") },
    { value: "archived", label: t("customers:archived") },
  ];

  // Compute tab styles based on activeFilter
  const tabBackgroundColor = Colors.light.surface;
  const tabTextInactiveColor = Colors.light.textSecondary;
  const tabTextActiveColor = Colors.light.textPrimary;

  const activeTabStyle = {
    backgroundColor: Colors.light.primary,
    color: "#FFFFFF",
  };

  return (
    <View style={styles.tabs}>
      {filters.map((filter) => (
        <Pressable
          key={filter.value}
          style={[
            styles.tab,
            { backgroundColor: activeFilter === filter.value ? Colors.light.primary : tabBackgroundColor },
          ]}
          onPress={() => onFilterChange(filter.value)}
        >
          <ThemedText style={[
            styles.tabText,
            { color: activeFilter === filter.value ? tabTextActiveColor : tabTextInactiveColor,
              fontWeight: activeFilter === filter.value ? '600' : '500',
            }]}
          >
            <span>{filter.label}</span>
            <span style={styles.countBadge}>{filter.value === 'all' ? '48' : filter.value === 'withDebt' ? '12' : '36'}</span>
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    overflowX: 'auto',
  },
  tab: {
    flex: 1,
    minWidth: 0,
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tabText: {
    fontSize: 12,
    textAlign: 'center',
  },
  countBadge: {
    marginLeft: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: '600',
  },
});