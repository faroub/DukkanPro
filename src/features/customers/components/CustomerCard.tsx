import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from "react-i18next";
import { formatCentimes } from "@/utils/money";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface CustomerCardProps {
  customer: {
    id: number;
    name: string;
    phone: string | null;
    note: string | null;
    isActive: boolean;
    hasDebt: boolean;
    outstandingBalance: number;
  };
  onPress?: () => void;
}

export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderLight,
        },
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <ThemedText type="body" style={[styles.name, { color: theme.textPrimary }]}>
            {customer.name}
          </ThemedText>
          {customer.phone && (
            <ThemedText type="caption" style={[styles.phone, { color: theme.textSecondary }]}>
              {customer.phone}
            </ThemedText>
          )}
        </View>

        <View style={styles.bottomRow}>
          <ThemedText type="caption" style={[styles.balance, { color: theme.primary }]}>
            {formatCentimes(customer.outstandingBalance)}
          </ThemedText>
          {customer.hasDebt && (
            <ThemedText type="caption" style={[styles.debtTag, { color: theme.error }]}>
              {t("customers:hasDebt")}
            </ThemedText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'column',
    width: '65%',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  phone: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  balance: {
    fontSize: 14,
    fontWeight: '600',
  },
  debtTag: {
    fontSize: 10,
    marginLeft: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});
