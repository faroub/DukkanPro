import { View, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

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
  const tabBackgroundColor = activeFilter === undefined ? '#fff' : '#F3F4F6';
  const tabTextColor = activeFilter === undefined ? '#333' : '#fff';
  const tabFontWeight = activeFilter === undefined ? '500' : '600';

  const activeTabStyle = {
    backgroundColor: '#1B6B3A',
  };

  return (
    <View style={styles.tabs}>
      {filters.map((filter) => (
        <Pressable
          key={filter.value}
          style={[
            styles.tab,
            { backgroundColor: activeFilter === filter.value ? activeTabStyle.backgroundColor : tabBackgroundColor },
          ]}
          onPress={() => onFilterChange(filter.value)}
        >
          <ThemedText style={[
            styles.tabText,
            { color: activeFilter === filter.value ? '#fff' : tabTextColor,
              fontWeight: activeFilter === filter.value ? '600' : tabFontWeight,
            }]}
          >
            {filter.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: 10,
  },
  tabText: {
    fontSize: 12,
    textAlign: 'center',
  },
});