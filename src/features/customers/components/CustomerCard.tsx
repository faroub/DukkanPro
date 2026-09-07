import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from "react-i18next";
import { formatCentimes } from "@/utils/money";
import { ThemedText } from "@/components/themed-text";
import { Colors, BorderRadius, Spacing, Shadows } from "@/constants/theme";

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

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <ThemedText type="body" style={styles.name}>
            {customer.name}
          </ThemedText>
          {customer.phone && (
            <ThemedText type="caption" style={styles.phone}>
              {customer.phone}
            </ThemedText>
          )}
        </View>

        <View style={styles.bottomRow}>
          <ThemedText type="caption" style={styles.balance}>
            {formatCentimes(customer.outstandingBalance)}
          </ThemedText>
          {customer.hasDebt && (
            <ThemedText type="caption" style={styles.debtTag}>
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
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
    color: Colors.light.textPrimary,
  },
  phone: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: -12,
  },
  balance: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  debtTag: {
    fontSize: 10,
    color: Colors.light.destructive,
    marginLeft: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});