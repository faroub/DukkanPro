import { View, ScrollView, StyleSheet, Text, Pressable, Modal, TextInput } from 'react-native';
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRoute } from "expo-router";
import { Typography, Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCentimes } from "@/utils/money";

interface CustomerDetailScreenProps {
  customerId?: number;
}

export function CustomerDetailScreen({ customerId }: CustomerDetailScreenProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [saleHistory, setSaleHistory] = useState<any[]>([]);
  const [note, setNote] = useState<string>("");
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>("");
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  // Navigation available via route in expo-router

  // Load customer data
  useEffect(() => {
    async function loadCustomer() {
      const customer = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, 100);
      });
      setLoading(false);
    }
    loadCustomer();
  }, [customerId]);

  const handleAddPayment = useCallback(async () => {
    const amount = parseFloat(newPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    setIsAddingPayment(true);
    try {
      // In a full implementation, this would record a payment
      // and update the customer's balance
      setPayments((prev: any[]) => [...prev, { amount, date: new Date() }]);
      setNewPaymentAmount("");
    } catch (err) {
      // Show error
    } finally {
      setIsAddingPayment(false);
    }
  }, []);

  const renderPaymentHistory = () => {
    if (!payments || payments.length === 0) {
      return (
        <View style={styles.noHistory}>
          <ThemedText type="caption" style={styles.noHistoryText}>
            {t("customers:noPayments")}
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.paymentHistoryContainer}>
        {payments.map((payment, index) => (
          <View key={index} style={styles.paymentHistoryItem}>
            <ThemedText type="caption" style={styles.paymentHistoryAmount}>
              -{formatCentimes(payment.amount)}
            </ThemedText>
            <ThemedText type="caption" style={styles.paymentHistoryDate}>
              {new Date(payment.date).toLocaleDateString()}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };

  const renderSaleHistory = () => {
    if (!saleHistory || saleHistory.length === 0) {
      return (
        <View style={styles.noHistory}>
          <ThemedText type="caption" style={styles.noHistoryText}>
            {t("customers:noSales")}
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.saleHistoryContainer}>
        {saleHistory.map((sale, index) => (
          <View key={index} style={styles.saleHistoryItem}>
            <ThemedText type="caption" style={styles.saleHistoryTotal}>
              {formatCentimes(sale.total_centimes)}
            </ThemedText>
            <ThemedText type="caption" style={styles.saleHistoryDate}>
              {new Date(sale.sold_at).toLocaleDateString()}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText type="small" style={styles.loadingText}>
          {t("common:loading")}
        </ThemedText>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText type="small" style={styles.errorText}>
          {t("common:error")}
        </ThemedText>
        <ThemedText type="small" style={styles.errorRetry}>
          {t("common:retry")}
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {customer.name}
          </ThemedText>
          {customer.phone && (
            <ThemedText type="caption" style={styles.subtitle}>
              {customer.phone}
            </ThemedText>
          )}
        </View>

        {/* Current Debt Section */}
        <View style={styles.section}>
          <ThemedText type="body" style={styles.sectionLabel}>
            {t("customers:currentDebt")}
          </ThemedText>
          <View style={styles.debtRow}>
            <ThemedText type="body" style={styles.debtAmount}>
              {formatCentimes(customer.outstandingBalance)}
            </ThemedText>
            {customer.hasDebt && (
              <ThemedText type="body" style={styles.debtStatus}>
                {t("customers:hasDebt")}
              </ThemedText>
            )}
            {!customer.hasDebt && (
              <ThemedText type="body" style={styles.debtStatus}>
                {t("customers:noDebt")}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Payment History Section */}
        <View style={{ ...styles.section, marginTop: 24 }}>
          <ThemedText type="body" style={styles.sectionLabel}>
            {t("customers:paymentHistory")}
          </ThemedText>
          {renderPaymentHistory()}
        </View>

        {/* Credit Sale History Section */}
        <View style={{ ...styles.section, marginTop: 24 }}>
          <ThemedText type="body" style={styles.sectionLabel}>
            {t("customers:creditSaleHistory")}
          </ThemedText>
          {renderSaleHistory()}
        </View>

        {/* Notes Section */}
        <View style={{ ...styles.section, marginTop: 24 }}>
          <ThemedText type="body" style={styles.sectionLabel}>
            {t("customers:notes")}
          </ThemedText>
          <ThemedText type="caption" style={styles.notesText}>
            {note || customer.note || t("customers:noNotes")}
          </ThemedText>
        </View>

        {/* Record Payment Form */}
        {(!customer.hasDebt || customer.outstandingBalance > 0) && (
          <View style={{ ...styles.section, marginTop: 24 }}>
            <ThemedText type="body" style={styles.sectionLabel}>
              {t("customers:recordPayment")}
            </ThemedText>
            <View style={styles.paymentForm}>
              <TextInput
                value={newPaymentAmount}
                onChangeText={(text) => setNewPaymentAmount(text)}
                placeholder={t("customers:amountPlaceholder")}
                keyboardType="number-pad"
                style={styles.input}
              />
              <Pressable style={styles.addPaymentButton} onPress={handleAddPayment} disabled={isAddingPayment}>
                <ThemedText type="body" style={styles.addPaymentText}>
                  {t("customers:addPayment")}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  debtStatus: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  noHistory: {
    padding: Spacing.xl,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  noHistoryText: {
    fontSize: 14,
  },
  paymentHistoryContainer: {
    marginTop: Spacing.md,
  },
  paymentHistoryItem: {
    padding: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  paymentHistoryAmount: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  paymentHistoryDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: Spacing.xs,
  },
  saleHistoryContainer: {
    marginTop: Spacing.md,
  },
  saleHistoryItem: {
    padding: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  saleHistoryTotal: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  saleHistoryDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.destructive,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorRetry: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.primary,
  },
  paymentForm: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  input: {
    width: 180,
    height: 40,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    marginRight: Spacing.md,
  },
  addPaymentButton: {
    padding: Spacing.md,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
  },
  addPaymentText: {
    color: Colors.light.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  notesText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});