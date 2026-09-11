import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getById } from "@/database/repositories/customerRepository";
import { getAll as getAllSales } from "@/database/repositories/saleRepository";
import {
  getCustomerDebt,
  getCustomerPayments,
} from "@/services/customers/customerBalanceService";
import { Customer, CustomerPayment, Sale } from "@/types/entities";
import { formatCentimes } from "@/utils/money";

interface CustomerDetailScreenProps {
  customerId?: number;
}

export function CustomerDetailScreen({ customerId }: CustomerDetailScreenProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [debtCentimes, setDebtCentimes] = useState(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [activeTab, setActiveTab] = useState<
    "credit-sales" | "payments" | "timeline" | "notes"
  >("credit-sales");

  const loadData = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cust, debt, customerSales, customerPayments] = await Promise.all([
        getById(customerId),
        getCustomerDebt(customerId),
        getAllSales({ customerId }),
        getCustomerPayments(customerId),
      ]);

      setCustomer(cust);
      setDebtCentimes(debt);
      setSales(customerSales.filter((s) => s.status === "completed"));
      setPayments(customerPayments);
    } catch (err) {
      // Error handled by state
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Credit sales (sales with remaining balance or total > amount paid or credit method)
  const creditSales = useMemo(() => {
    return sales.filter(
      (s) =>
        s.payment_method === "credit" ||
        s.remaining_balance_centimes > 0 ||
        s.total_centimes > s.amount_paid_centimes
    );
  }, [sales]);

  // Combined chronological timeline
  const timelineItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "sale" | "payment";
      date: string;
      amountCentimes: number;
      title: string;
      subtitle: string;
    }> = [];

    sales.forEach((sale) => {
      items.push({
        id: `sale-${sale.id}`,
        type: "sale",
        date: sale.sold_at || sale.created_at,
        amountCentimes: sale.total_centimes,
        title: `${t("customers:creditSale")} #${sale.id}`,
        subtitle: sale.note || t("sales:completed"),
      });
    });

    payments.forEach((payment) => {
      items.push({
        id: `payment-${payment.id}`,
        type: "payment",
        date: payment.paid_at || payment.created_at,
        amountCentimes: payment.amount_centimes,
        title: `${t("customers:payment")} #${payment.id}`,
        subtitle:
          payment.payment_method === "electronic"
            ? t("customers:edahabia")
            : t("customers:cash"),
      });
    });

    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return items;
  }, [sales, payments, t]);

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleRecordPayment = () => {
    if (!customer) return;
    router.push({
      pathname: "/customers/record-payment",
      params: {
        customerId: String(customer.id),
        customerName: customer.name,
        currentDebt: String(debtCentimes),
      },
    } as any);
  };

  const handleShareReminder = () => {
    if (!customer) return;
    router.push({
      pathname: "/customers/reminder",
      params: {
        customerId: String(customer.id),
        customerName: customer.name,
        currentDebt: String(debtCentimes),
      },
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>{t("common:loading")}</ThemedText>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          {t("customers:notFound")}
        </ThemedText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.retryButtonText}>
            {t("common:back")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const hasDebt = debtCentimes > 0;

  return (
    <View style={styles.screen}>
      {/* Top Header Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t("common:back")}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={Colors.light.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <ThemedText style={styles.customerHeaderName} numberOfLines={1}>
            {customer.name}
          </ThemedText>
          <ThemedText style={styles.customerHeaderSubtitle} numberOfLines={1}>
            {hasDebt
              ? t("customers:hasDebt")
              : t("customers:settled")}
            {customer.phone ? ` • ${customer.phone}` : ""}
          </ThemedText>
        </View>

        <View style={styles.headerActions}>
          {customer.phone ? (
            <TouchableOpacity
              onPress={handleCall}
              style={styles.iconButton}
              accessibilityLabel={t("customers:phone")}
            >
              <MaterialIcons
                name="phone"
                size={20}
                color={Colors.light.primary}
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => router.push(`/customers/edit/${customer.id}` as any)}
            style={styles.iconButton}
            accessibilityLabel={t("common:edit")}
          >
            <MaterialIcons
              name="edit"
              size={20}
              color={Colors.light.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Debt Card */}
        <View
          style={[
            styles.heroDebtCard,
            hasDebt ? styles.heroDebtCardActive : styles.heroDebtCardSettled,
          ]}
        >
          <View style={styles.heroDebtHeader}>
            <ThemedText
              style={[
                styles.heroDebtLabel,
                hasDebt ? styles.heroDebtLabelActive : styles.heroDebtLabelSettled,
              ]}
            >
              {t("customers:currentDebt")}
            </ThemedText>
            <View
              style={[
                styles.statusPill,
                hasDebt ? styles.statusPillDebt : styles.statusPillSettled,
              ]}
            >
              <ThemedText
                style={[
                  styles.statusPillText,
                  hasDebt ? styles.statusPillTextDebt : styles.statusPillTextSettled,
                ]}
              >
                {hasDebt ? t("customers:immediateDue") : t("customers:settled")}
              </ThemedText>
            </View>
          </View>

          <ThemedText
            style={[
              styles.heroDebtAmount,
              hasDebt ? styles.heroDebtAmountActive : styles.heroDebtAmountSettled,
            ]}
          >
            {formatCentimes(debtCentimes, i18n.language as any)}
          </ThemedText>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              !hasDebt && styles.primaryActionBtnDisabled,
            ]}
            onPress={handleRecordPayment}
            activeOpacity={0.8}
            disabled={!hasDebt}
          >
            <MaterialIcons name="payments" size={20} color="#FFFFFF" />
            <ThemedText style={styles.primaryActionBtnText}>
              {t("customers:recordPayment")}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={handleShareReminder}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="share"
              size={18}
              color={Colors.light.textPrimary}
            />
            <ThemedText style={styles.secondaryActionBtnText}>
              {t("customers:shareReminder")}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Segmented Tabs Bar */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "credit-sales" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("credit-sales")}
          >
            <ThemedText
              style={[
                styles.tabItemText,
                activeTab === "credit-sales" && styles.tabItemTextActive,
              ]}
            >
              {t("customers:creditSales")}
            </ThemedText>
            <View
              style={[
                styles.tabBadge,
                activeTab === "credit-sales" && styles.tabBadgeActive,
              ]}
            >
              <ThemedText
                style={[
                  styles.tabBadgeText,
                  activeTab === "credit-sales" && styles.tabBadgeTextActive,
                ]}
              >
                {creditSales.length}
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "payments" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("payments")}
          >
            <ThemedText
              style={[
                styles.tabItemText,
                activeTab === "payments" && styles.tabItemTextActive,
              ]}
            >
              {t("customers:payments")}
            </ThemedText>
            <View
              style={[
                styles.tabBadge,
                activeTab === "payments" && styles.tabBadgeActive,
              ]}
            >
              <ThemedText
                style={[
                  styles.tabBadgeText,
                  activeTab === "payments" && styles.tabBadgeTextActive,
                ]}
              >
                {payments.length}
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "timeline" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("timeline")}
          >
            <ThemedText
              style={[
                styles.tabItemText,
                activeTab === "timeline" && styles.tabItemTextActive,
              ]}
            >
              {t("customers:timeline")}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "notes" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("notes")}
          >
            <ThemedText
              style={[
                styles.tabItemText,
                activeTab === "notes" && styles.tabItemTextActive,
              ]}
            >
              {t("customers:notes")}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tab Content Section */}
        {activeTab === "credit-sales" && (
          <View style={styles.tabContent}>
            {creditSales.length === 0 ? (
              <View style={styles.tabEmptyState}>
                <MaterialIcons
                  name="receipt"
                  size={36}
                  color={Colors.light.textMuted}
                />
                <ThemedText style={styles.tabEmptyText}>
                  {t("customers:noSales")}
                </ThemedText>
              </View>
            ) : (
              creditSales.map((sale) => (
                <View key={sale.id} style={styles.recordRow}>
                  <View style={styles.recordLeft}>
                    <View style={styles.recordIconSale}>
                      <MaterialIcons
                        name="receipt-long"
                        size={18}
                        color={Colors.light.destructive}
                      />
                    </View>
                    <View style={styles.recordTexts}>
                      <ThemedText style={styles.recordTitle}>
                        {t("customers:creditSale")} #{sale.id}
                      </ThemedText>
                      <ThemedText style={styles.recordSubtitle}>
                        {sale.sold_at
                          ? new Date(sale.sold_at).toLocaleDateString()
                          : new Date(sale.created_at).toLocaleDateString()}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.recordAmountSale}>
                    +{formatCentimes(sale.total_centimes, i18n.language as any)}
                  </ThemedText>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "payments" && (
          <View style={styles.tabContent}>
            {payments.length === 0 ? (
              <View style={styles.tabEmptyState}>
                <MaterialIcons
                  name="payments"
                  size={36}
                  color={Colors.light.textMuted}
                />
                <ThemedText style={styles.tabEmptyText}>
                  {t("customers:noPayments")}
                </ThemedText>
              </View>
            ) : (
              payments.map((payment) => (
                <View key={payment.id} style={styles.recordRow}>
                  <View style={styles.recordLeft}>
                    <View style={styles.recordIconPayment}>
                      <MaterialIcons
                        name="check-circle"
                        size={18}
                        color={Colors.light.primary}
                      />
                    </View>
                    <View style={styles.recordTexts}>
                      <ThemedText style={styles.recordTitle}>
                        {t("customers:payment")} #{payment.id}
                      </ThemedText>
                      <ThemedText style={styles.recordSubtitle}>
                        {new Date(payment.paid_at).toLocaleDateString()} •{" "}
                        {payment.payment_method === "electronic"
                          ? t("customers:edahabia")
                          : t("customers:cash")}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.recordAmountPayment}>
                    -{formatCentimes(payment.amount_centimes, i18n.language as any)}
                  </ThemedText>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "timeline" && (
          <View style={styles.tabContent}>
            {timelineItems.length === 0 ? (
              <View style={styles.tabEmptyState}>
                <MaterialIcons
                  name="history"
                  size={36}
                  color={Colors.light.textMuted}
                />
                <ThemedText style={styles.tabEmptyText}>
                  {t("customers:noTimeline")}
                </ThemedText>
              </View>
            ) : (
              timelineItems.map((item) => (
                <View key={item.id} style={styles.recordRow}>
                  <View style={styles.recordLeft}>
                    <View
                      style={
                        item.type === "sale"
                          ? styles.recordIconSale
                          : styles.recordIconPayment
                      }
                    >
                      <MaterialIcons
                        name={
                          item.type === "sale" ? "receipt-long" : "check-circle"
                        }
                        size={18}
                        color={
                          item.type === "sale"
                            ? Colors.light.destructive
                            : Colors.light.primary
                        }
                      />
                    </View>
                    <View style={styles.recordTexts}>
                      <ThemedText style={styles.recordTitle}>
                        {item.title}
                      </ThemedText>
                      <ThemedText style={styles.recordSubtitle}>
                        {new Date(item.date).toLocaleDateString()} •{" "}
                        {item.subtitle}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText
                    style={
                      item.type === "sale"
                        ? styles.recordAmountSale
                        : styles.recordAmountPayment
                    }
                  >
                    {item.type === "sale" ? "+" : "-"}
                    {formatCentimes(item.amountCentimes, i18n.language as any)}
                  </ThemedText>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "notes" && (
          <View style={styles.tabContent}>
            <View style={styles.notesCard}>
              <ThemedText style={styles.notesTitle}>
                {t("customers:merchantNote")}
              </ThemedText>
              <ThemedText style={styles.notesBody}>
                {customer.note && customer.note.trim().length > 0
                  ? customer.note
                  : t("customers:noNotes")}
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.destructive,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.light.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  retryButtonText: {
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  iconButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  customerHeaderName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  customerHeaderSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxxxx,
  },
  heroDebtCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  heroDebtCardActive: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.borderLight,
  },
  heroDebtCardSettled: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primaryLight,
  },
  heroDebtHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  heroDebtLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  heroDebtLabelActive: {
    color: Colors.light.textSecondary,
  },
  heroDebtLabelSettled: {
    color: Colors.light.primary,
  },
  heroDebtAmount: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroDebtAmountActive: {
    color: Colors.light.destructive, // Debt amounts use red per Stitch export
  },
  heroDebtAmountSettled: {
    color: Colors.light.primary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusPillDebt: {
    backgroundColor: Colors.light.errorLight,
  },
  statusPillSettled: {
    backgroundColor: "rgba(27, 107, 58, 0.15)",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusPillTextDebt: {
    color: Colors.light.destructive,
  },
  statusPillTextSettled: {
    color: Colors.light.primary,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  primaryActionBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.button,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryActionBtnDisabled: {
    opacity: 0.5,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.xl,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  tabItemActive: {
    backgroundColor: Colors.light.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  tabItemTextActive: {
    color: Colors.light.textPrimary,
  },
  tabBadge: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabBadgeActive: {
    backgroundColor: Colors.light.primaryLight,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.light.primary,
  },
  tabContent: {
    gap: Spacing.xs,
  },
  tabEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxx,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  tabEmptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: Spacing.xs,
  },
  recordLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  recordIconSale: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  recordIconPayment: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  recordTexts: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  recordSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  recordAmountSale: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.destructive, // Sale / debt in red
  },
  recordAmountPayment: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.primary, // Payment in green
  },
  notesCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  notesBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textPrimary,
  },
});
