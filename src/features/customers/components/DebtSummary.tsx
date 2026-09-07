import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { formatCentimes } from "@/utils/money";
import { getCustomerDebt, getCustomerBalanceSummary } from "@/services/customers/customerBalanceService";
import { useRoute } from "expo-router";
import { Typography } from "@/constants/theme";

interface DebtSummaryProps {
  customerId: number;
  customerName: string;
  showDetails?: boolean;
  onPaymentRequested?: () => void;
}

export function DebtSummary({ customerId, customerName, showDetails = false, onPaymentRequested }: DebtSummaryProps) {
  const { t } = useTranslation();
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
  const totalPaid = summary?.total_paid_centime || 0;
  const paymentCount = summary?.paymentCount || 0;

  const handleRecordPayment = () => {
    if (onPaymentRequested) {
      onPaymentRequested();
    }
  };

  if (loading) {
    return (
      <ThemedView type="background" style={styles.container}>
        <ThemedText type="small" style={styles.loadingText}>
          {t("common:loading")}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!summary) {
    return (
      <ThemedView type="background" style={styles.container}>
        <ThemedText type="small" style={styles.errorText}>
          {t("common:error")}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="background" style={styles.container}>
      <View style={styles.summarySection}>
        <ThemedText type="body" style={styles.label}>
          {t("customers:currentDebt")}
        </ThemedText>

        <ThemedText type="title" style={styles.debtAmount}>
          {formatCentimes(debt)}
        </ThemedText>

        {!debt && (
          <ThemedText type="caption" style={styles.noDebt}>
            {t("customers:noDebt")}
          </ThemedText>
        )}
      </View>

      {showDetails && paymentCount > 0 && (
        <View style={styles.paymentHistorySection}>
          <ThemedText type="body" style={styles.sectionLabel}>
            {t("customers:paymentHistory")}
          </ThemedText>

          <ThemedText type="caption" style={styles.paymentInfo}>
            {t("customers:paymentsMade", { count: paymentCount })}
          </ThemedText>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.paymentButton} onPress={handleRecordPayment} disabled={debt <= 0}>
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
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  summarySection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  debtAmount: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  noDebt: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  paymentHistorySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  paymentInfo: {
    fontSize: 12,
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.primary,
    minWidth: 120,
  },
  paymentButtonText: {
    color: Colors.light.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorText: {
    ...Typography.body,
    fontSize: 14,
    color: '#B91C1C',
    marginBottom: 8,
    textAlign: 'center',
  },
});