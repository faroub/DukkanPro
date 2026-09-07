import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';

interface SaleFilterTabsProps {
  initialFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export function SaleFilterTabs({
  initialFilter = 'all',
  onFilterChange,
}: SaleFilterTabsProps) {
  const { t } = useTranslation();

  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const filters = [
    { key: 'all', label: t('sales.filter_all') },
    { key: 'today', label: t('sales.filter_today') },
    { key: 'week', label: t('sales.filter_week') },
    { key: 'month', label: t('sales.filter_month') },
    { key: 'custom', label: t('sales.filter_custom') },
    { key: 'paid', label: t('sales.filter_paid') },
    { key: 'partial', label: t('sales.filter_partial') },
    { key: 'credit', label: t('sales.filter_credit') },
    { key: 'cancelled', label: t('sales.filter_cancelled') },
    { key: 'returned', label: t('sales.filter_returned') },
  ];

  const handleFilterSelect = (filter: string) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
  };

  return (
    <ThemedView style={styles.tabsContainer}>
      {filters.map((filter) => (
        <Pressable
          key={filter.key}
          style={[
            styles.tabButton,
            activeFilter === filter.key && styles.tabButtonActive,
          ]}
          onPress={() => handleFilterSelect(filter.key)}
        >
          <ThemedText type="caption" style={styles.tabLabel}>
            {filter.label}
          </ThemedText>
        </Pressable>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 16,
  },
  tabButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  tabButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tabLabel: {
    color: Colors.light.textSecondary,
  },
    fontSize: 12,
  },
  tabLabelActive: {
    color: Colors.light.textPrimary,
  },
});