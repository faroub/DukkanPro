import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from "react-i18next";
import { formatCentimes } from "@/utils/money";
import { ThemedText } from "@/components/themed-text";

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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: '#1A1A1A',
  },
  phone: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#1B6B3A',
    fontWeight: '600',
  },
  debtTag: {
    fontSize: 10,
    color: '#EF4444',
    marginLeft: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});