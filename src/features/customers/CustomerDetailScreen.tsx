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
  const route = useRoute();

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

  const renderTimeline = () => {
    if (!payments && !saleHistory || (payments && payments.length === 0 && saleHistory && saleHistory.length === 0)) {
      return (
        <View style={styles.noHistory}>
          <ThemedText type="caption" style={styles.noHistoryText}>
            {t("customers:noTimeline")}
          </ThemedText>
        </View>
      );
    }

    const items: any[] = [];

    // Add payment records to timeline (most recent first)
    if (payments) {
      for (let i = payments.length - 1; i >= 0; i--) {
        items.push({
          type: 'payment',
          amount: -payments[i].amount,
          date: payments[i].date,
          description: `Payment ${payments[i].id || 'PAY-' + i}`,
        });
      }
    }

    // Add sale records to timeline (most recent first)
    if (saleHistory) {
      for (let i = saleHistory.length - 1; i >= 0; i--) {
        items.push({
          type: 'sale',
          amount: saleHistory[i].total_centimes,
          date: saleHistory[i].sold_at,
          description: `Sale ${saleHistory[i].id || 'REC-' + i}`,
        });
      }
    }

    // Sort by date, most recent first
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <View style={styles.timelineContainer}>
        {items.map((item, index) => {
          const isPayment = item.type === 'payment';
          const amountDisplay = isPayment
            ? `-${formatCentimes(Math.abs(item.amount))} DZD`
            : `+${formatCentimes(item.amount)} DZD`;

          return (
            <article key={index} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <ThemedText type="caption" style={styles.timelineIcon}>
                  {isPayment ? 'payments' : 'receipt_long'}
                </ThemedText>
              </View>
              <View style={styles.timelineRight}>
                <ThemedText type="caption" style={styles.timelineLabel}>
                  {item.description}
                </ThemedText>
                <ThemedText type="caption" style={styles.timelineDate}>
                  {new Date(item.date).toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={styles.timelineAmount}>
                <ThemedText type="body" style={styles.timelineAmountText}>
                  {amountDisplay}
                </ThemedText>
              </View>
            </article>
          );
        })}
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

        {/* Tabbed Records Segment */}
        <View style={styles.tabbedRecords}>
          {/* Horizontal Scrollable Segmented Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable style={styles.tabButton} onPress={() => setActiveTab('credit-sales')}>
              <ThemedText style={styles.tabButtonText}>{t("customers:creditSales")}</ThemedText>
              <ThemedText style={styles.tabCount}>3</ThemedText>
            </Pressable>
            <Pressable style={styles.tabButton} onPress={() => setActiveTab('payments')}>
              <ThemedText style={styles.tabButtonText}>{t("customers:payments")}</ThemedText>
              <ThemedText style={styles.tabCount}>2</ThemedText>
            </Pressable>
            <Pressable style={styles.tabButton} onPress={() => setActiveTab('timeline')}>
              <ThemedText style={styles.tabButtonText}>{t("customers:activityTimeline")}</ThemedText>
            </Pressable>
            <Pressable style={styles.tabButton} onPress={() => setActiveTab('notes')}>
              <ThemedText style={styles.tabButtonText}>{t("customers:notes")}</ThemedText>
            </Pressable>
          </View>

          {/* Active Tab Content */}
          {activeTab === 'credit-sales' && (
            <div style={styles.tabContent}>
              <ThemedText type="body" style={styles.sectionLabel}>
                {t("customers:creditSaleHistory")}
              </ThemedText>
              {renderSaleHistory()}
            </div>
          )}

          {activeTab === 'payments' && (
            <div style={styles.tabContent}>
              <ThemedText type="body" style={styles.sectionLabel}>
                {t("customers:paymentHistory")}
              </ThemedText>
              {renderPaymentHistory()}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={styles.tabContent}>
              {renderTimeline()}
            </div>
          )}

          {activeTab === 'notes' && (
            <div style={styles.tabContent}>
              <ThemedText type="body" style={styles.sectionLabel}>
                {t("customers:notes")}
              </ThemedText>
              <ThemedText type="caption" style={styles.notesText}>
                {note || customer.note || t("customers:noNotes")}
              </ThemedText>
            </div>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// Tab state management
const [activeTab, setActiveTab] = useState<string>('credit-sales');

const isActiveTab = (tab: string) => activeTab === tab;

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
    color: Colors.light.destructive,
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

  // Tabbed records styles
  tabbedRecords: {
    marginTop: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
    paddingBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    marginRight: 2,
  },
  tabButtonActive: {
    backgroundColor: Colors.light.primary,
    color: "#FFFFFF",
  },
  tabButtonInactive: {
    backgroundColor: Colors.light.surface,
    color: Colors.light.textSecondary,
  },
  tabButtonText: {
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  tabCount: {
    marginLeft: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: Colors.light.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  tabContent: {
    marginTop: Spacing.md,
  },
  timelineContainer: {
    marginTop: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
  },
  timelineLeft: {
    width: 40,
  },
  timelineIcon: {
    fontSize: 20,
    color: Colors.light.primary,
  },
  timelineRight: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  timelineLabel: {
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  timelineAmount: {
    flexShrink: 0,
    marginLeft: 12,
  },
  timelineAmountText: {
    fontSize: 14,
    color: Colors.light.destructive,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});