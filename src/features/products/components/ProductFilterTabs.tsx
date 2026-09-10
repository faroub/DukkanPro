import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, Typography, BorderRadius } from "@/constants/theme";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, ScrollView, View } from "react-native";

interface ProductFilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
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
}: ProductFilterTabsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.tab,
              activeFilter === option.key && styles.tabActive,
            ]}
            activeOpacity={0.7}
            onPress={() => onFilterChange(option.key)}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeFilter === option.key && styles.tabTextActive,
              ]}
            >
              {t(option.labelKey)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    height: 36,
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
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
});
