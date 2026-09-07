import { View, ScrollView, StyleSheet, Text, Pressable, Modal, TextInput } from 'react-native';
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRoute } from "expo-router";
import { Typography } from "@/constants/theme";
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
                style={isAddingPayment ? { width: 180, height: 40, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, fontSize: 14 } : { width: 180, height: 40, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, fontSize: 14, marginRight: 8 }}
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
    backgroundColor: '#F8F7F4',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B6B3A',
  },
  debtStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  noHistory: {
    padding: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  noHistoryText: {
    fontSize: 14,
  },
  paymentHistoryContainer: {
    marginTop: 8,
  },
  paymentHistoryItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  paymentHistoryAmount: {
    fontSize: 14,
    color: '#1B6B3A',
    fontWeight: '600',
  },
  paymentHistoryDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  saleHistoryContainer: {
    marginTop: 8,
  },
  saleHistoryItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  saleHistoryTotal: {
    fontSize: 14,
    color: '#1B6B3A',
    fontWeight: '600',
  },
  saleHistoryDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    ...Typography.body,
    fontSize: 14,
    color: '#B91C1C',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorRetry: {
    ...Typography.body,
    fontSize: 14,
    color: '#1B6B3A',
  },
  paymentForm: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  input: {
    width: 180,
    height: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginRight: 8,
  },
  addPaymentButton: {
    padding: 8,
    backgroundColor: '#1B6B3A',
    borderRadius: 8,
  },
  addPaymentText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
  },
});