import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SaleFilterKey =
  | 'all'
  | 'today'
  | 'week'
  | 'month'
  | 'paid'
  | 'partial'
  | 'credit'
  | 'cancelled'
  | 'returned';

interface SaleFilterTabsProps {
  activeFilter: SaleFilterKey;
  onSelectFilter: (filter: SaleFilterKey) => void;
}

export function SaleFilterTabs({
  activeFilter,
  onSelectFilter,
}: SaleFilterTabsProps) {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const lang = i18n.language || 'fr';
  const isArabic = lang.startsWith('ar');
  const isFrench = lang.startsWith('fr');

  const periodFilters: { key: SaleFilterKey; label: string }[] = [
    {
      key: 'all',
      label: isArabic ? 'الكل' : isFrench ? 'Tous' : 'All',
    },
    {
      key: 'today',
      label: isArabic ? 'اليوم' : isFrench ? "Aujourd'hui" : 'Today',
    },
    {
      key: 'week',
      label: isArabic ? 'هذا الأسبوع' : isFrench ? 'Cette semaine' : 'This Week',
    },
    {
      key: 'month',
      label: isArabic ? 'هذا الشهر' : isFrench ? 'Ce mois' : 'This Month',
    },
  ];

  const statusFilters: { key: SaleFilterKey; label: string; dotColor: string }[] = [
    {
      key: 'paid',
      label: isArabic ? 'مدفوع' : isFrench ? 'Payé' : 'Paid',
      dotColor: theme.primary,
    },
    {
      key: 'partial',
      label: isArabic ? 'جزئي' : isFrench ? 'Partiel' : 'Partial',
      dotColor: theme.warning,
    },
    {
      key: 'credit',
      label: isArabic ? 'دين / آجل' : isFrench ? 'Crédit' : 'Credit',
      dotColor: theme.primary,
    },
    {
      key: 'cancelled',
      label: isArabic ? 'ملغى' : isFrench ? 'Annulé' : 'Cancelled',
      dotColor: theme.error,
    },
    {
      key: 'returned',
      label: isArabic ? 'مسترجع' : isFrench ? 'Retourné' : 'Returned',
      dotColor: theme.textMuted,
    },
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {periodFilters.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.chip,
                { backgroundColor: theme.surface, borderColor: theme.border },
                isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => onSelectFilter(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Filter by ${tab.label}`}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  { color: theme.textSecondary },
                  isActive && { color: "#FFFFFF" },
                ]}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}

        {/* Vertical Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {statusFilters.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.chip,
                { backgroundColor: theme.surface, borderColor: theme.border },
                isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => onSelectFilter(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Filter by status ${tab.label}`}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? '#FFFFFF' : tab.dotColor },
                ]}
              />
              <ThemedText
                style={[
                  styles.chipText,
                  { color: theme.textSecondary },
                  isActive && { color: "#FFFFFF" },
                ]}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    ...Shadows.sm,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
