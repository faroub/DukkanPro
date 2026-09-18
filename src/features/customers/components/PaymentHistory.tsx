import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography, BorderRadius, Spacing } from "@/constants/theme";
import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { formatCentimes } from "@/utils/money";
import { getCustomerPayments } from "@/services/customers/customerBalanceService";
import { useTheme } from "@/hooks/use-theme";

interface PaymentHistoryProps {
  customerId: number;
  customerName: string;
}

export function PaymentHistory({ customerId, customerName }: PaymentHistoryProps) {
  const { t } = useTranslation();
  const theme = useTheme();

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
      <ThemedView type="background" style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText type="small" style={[styles.loadingText, { color: theme.textSecondary }]}>
          {t("common:loading")}
        </ThemedText>
      </ThemedView>
    );
  }

  if (payments.length === 0) {
    return (
      <ThemedView type="background" style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText type="caption" style={[styles.noPayments, { color: theme.textSecondary }]}>
          {t("customers:noPayments")}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="background" style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        {payments.map((payment, index) => (
          <View
            key={index}
            style={[
              styles.paymentItem,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText type="body" style={[styles.paymentMethod, { color: theme.primary }]}>
              {payment.payment_method === "cash"
                ? t("sales:cash")
                : t("sales:electronic")}
            </ThemedText>
            <ThemedText type="caption" style={[styles.paymentAmount, { color: theme.primary }]}>
              -{formatCentimes(payment.amount_centimes)}
            </ThemedText>
            <ThemedText type="caption" style={[styles.paymentDate, { color: theme.textSecondary }]}>
              {new Date(payment.paid_at).toLocaleDateString()}
            </ThemedText>
            {payment.note && (
              <ThemedText type="caption" style={[styles.paymentNote, { color: theme.textSecondary }]}>
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
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentAmount: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  paymentDate: {
    fontSize: 12,
  },
  paymentNote: {
    fontSize: 12,
    marginHorizontal: 8,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },
  noPayments: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },
});
