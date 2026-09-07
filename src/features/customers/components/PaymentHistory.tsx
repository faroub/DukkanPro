import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography } from "@/constants/theme";
import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { formatCentimes } from "@/utils/money";
import { getCustomerPayments } from "@/services/customers/customerBalanceService";

interface PaymentHistoryProps {
  customerId: number;
  customerName: string;
}

export function PaymentHistory({ customerId, customerName }: PaymentHistoryProps) {
  const { t } = useTranslation();

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load payment history
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const paymentsData = await getCustomerPayments(customerId);
        setPayments(paymentsData);
      } catch (err) {
        // Show error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customerId]);

  if (loading) {
    return (
      <ThemedView type="background" style={styles.container}>
        <ThemedText type="small" style={styles.loadingText}>
          {t("common:loading")}
        </ThemedText>
      </ThemedView>
    );
  }

  if (payments.length === 0) {
    return (
      <ThemedView type="background" style={styles.container}>
        <ThemedText type="caption" style={styles.noPayments}>
          {t("customers:noPayments")}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {payments.map((payment, index) => (
          <View key={index} style={styles.paymentItem}>
            <ThemedText type="body" style={styles.paymentMethod}>
              {payment.payment_method === "cash"
                ? t("sell:cash")
                : t("sell:electronic")}
            </ThemedText>
            <ThemedText type="caption" style={styles.paymentAmount}>
              -{formatCentimes(payment.amount_centimes)}
            </ThemedText>
            <ThemedText type="caption" style={styles.paymentDate}>
              {new Date(payment.paid_at).toLocaleDateString()}
            </ThemedText>
            {payment.note && (
              <ThemedText type="caption" style={styles.paymentNote}>
                {payment.note}
              </ThemedText>
            )}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  scrollView: {
    // ScrollView will fill the container
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  paymentMethod: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  paymentAmount: {
    fontSize: 14,
    color: Colors.light.primary,
    marginHorizontal: 8,
  },
  paymentDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  paymentNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginHorizontal: 8,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginVertical: 20,
  },
  noPayments: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginVertical: 20,
  },
});