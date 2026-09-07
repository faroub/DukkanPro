import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";

interface ProductFilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const FILTER_OPTIONS = [
  { key: "all", labelKey: "products.filterAll" },
  { key: "lowStock", labelKey: "products.filterLowStock" },
  { key: "outOfStock", labelKey: "products.filterOutOfStock" },
  { key: "archived", labelKey: "products.filterArchived" },
] as const;

export function ProductFilterTabs({
  activeFilter,
  onFilterChange,
}: ProductFilterTabsProps) {
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      {FILTER_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={activeFilter === option.key ? styles.tabActive : styles.tab}
          onPress={() => onFilterChange(option.key)}
        >
          <ThemedText type="small" style={styles.tabText}>
            {t(option.labelKey)}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    backgroundColor: Colors.light.borderLight,
  },
  tabActive: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    backgroundColor: "#1B6B3A",
    color: "white",
  },
  tabText: {
    fontSize: 12,
  },
});
