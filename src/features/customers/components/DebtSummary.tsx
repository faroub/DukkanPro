import { View, StyleSheet, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { formatCentimes } from "@/utils/money";
import { getCustomerBalanceSummary } from "@/services/customers/customerBalanceService";
import { Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface DebtSummaryProps {
  customerId: number;
  customerName: string;
  showDetails?: boolean;
  onPaymentRequested?: () => void;
}

export function DebtSummary({ customerId, customerName, showDetails = false, onPaymentRequested }: DebtSummaryProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load summary data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const summaryData = await getCustomerBalanceSummary(customerId);
        setSummary(summaryData);
      } catch (err) {
        // Show error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customerId]);

  const debt = summary?.debt_centimes || 0;
  const paymentCount = summary?.paymentCount || 0;

  const handleRecordPayment = () => {
    if (onPaymentRequested) {
      onPaymentRequested();
    }
  };

  if (loading) {
    return (
      <ThemedView type="background" style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText type="small" style={[styles.loadingText, { color: theme.textSecondary }]}>
          {t("common:loading")}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!summary) {
    return (
      <ThemedView type="background" style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText type="small" style={[styles.errorText, { color: theme.error }]}>
          {t("common:error")}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="background" style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.summarySection}>
        <ThemedText type="body" style={[styles.label, { color: theme.textSecondary }]}>
          {t("customers:currentDebt")}
        </ThemedText>

        <ThemedText type="title" style={[styles.debtAmount, { color: theme.primary }]}>
          {formatCentimes(debt)}
        </ThemedText>

        {!debt && (
          <ThemedText type="caption" style={[styles.noDebt, { color: theme.textSecondary }]}>
            {t("customers:noDebt")}
          </ThemedText>
        )}
      </View>

      {showDetails && paymentCount > 0 && (
        <View style={[styles.paymentHistorySection, { borderColor: theme.border }]}>
          <ThemedText type="body" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            {t("customers:paymentHistory")}
          </ThemedText>

          <ThemedText type="caption" style={[styles.paymentInfo, { color: theme.textSecondary }]}>
            {t("customers:paymentsMade", { count: paymentCount })}
          </ThemedText>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.paymentButton, { backgroundColor: theme.primary }]}
          onPress={handleRecordPayment}
          disabled={debt <= 0}
        >
          <ThemedText type="body" style={styles.paymentButtonText}>
            {t("customers:addPayment")}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  summarySection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  debtAmount: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 4,
  },
  noDebt: {
    fontSize: 12,
    marginTop: 4,
  },
  paymentHistorySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sectionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  paymentInfo: {
    fontSize: 12,
    marginBottom: 4,
  },
  actions: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  paymentButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 14,
  },
  errorText: {
    ...Typography.body,
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
});
