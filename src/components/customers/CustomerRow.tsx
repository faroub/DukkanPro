import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

interface CustomerRowProps {
  customer: {
    id: number;
    name: string;
    phone: string | null;
    note: string | null;
    isActive: boolean;
    hasDebt: boolean;
    outstandingBalance: number;
  };
}

export function CustomerRow({ customer }: CustomerRowProps) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.row} onPress={() => {}}>
      <View style={styles.leftSection}>
        <ThemedText type="body" style={styles.name}>
          {customer.name}
        </ThemedText>
        {customer.phone && (
          <ThemedText type="caption" style={styles.phone}>
            {customer.phone}
          </ThemedText>
        )}
      </View>

      <View style={styles.rightSection}>
        <ThemedText type="body" style={styles.balance}>
          {customer.outstandingBalance} DZD
        </ThemedText>
        {customer.hasDebt && (
          <ThemedText type="caption" style={styles.debtTag}>
            {t("customers:hasDebt")}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leftSection: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  phone: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  balance: {
    fontSize: 14,
    color: '#1B6B3A',
    fontWeight: '600',
  },
  debtTag: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});