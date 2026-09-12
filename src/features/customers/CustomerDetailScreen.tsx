import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
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
  const theme = useTheme();
  const localParams = useLocalSearchParams<{ id?: string; customerId?: string }>();
  const effectiveCustomerId =
    customerId ??
    (localParams.customerId
      ? Number(localParams.customerId)
      : localParams.id
      ? Number(localParams.id)
      : undefined);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [debtCentimes, setDebtCentimes] = useState(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [activeTab, setActiveTab] = useState<
    "credit-sales" | "payments" | "timeline" | "notes"
  >("credit-sales");

  const loadData = useCallback(async () => {
    if (!effectiveCustomerId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [cust, debt, customerSales, customerPayments] = await Promise.all([
        getById(effectiveCustomerId),
        getCustomerDebt(effectiveCustomerId),
        getAllSales({ customerId: effectiveCustomerId }),
        getCustomerPayments(effectiveCustomerId),
      ]);

      setCustomer(cust);
      setDebtCentimes(debt);
      setSales(customerSales.filter((s) => s.status === "completed"));
      setPayments(customerPayments);
    } catch (err) {
      console.error("Failed to load customer detail data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveCustomerId]);

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
        customerPhone: customer.phone || "",
      },
    } as any);
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading && !customer) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={styles.loadingText}>{t("common:loading")}</ThemedText>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>{t("customers:notFound")}</ThemedText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.retryButtonText}>{t("common:back")}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const hasDebt = debtCentimes > 0;
  const initials = customer.name
    ? customer.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CU";

  return (
    <View style={styles.screen}>
      {/* Top Header Navigation */}
      <View style={styles.topBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={t("common:back")}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText style={styles.customerHeaderName} numberOfLines={1}>
            {customer.name}
          </ThemedText>
        </View>

        <View style={styles.headerActions}>
          {customer.phone ? (
            <TouchableOpacity
              onPress={handleCall}
              style={styles.iconCircleBtn}
              accessibilityLabel={t("customers:phone")}
            >
              <Ionicons name="call-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => router.push(`/customers/edit/${customer.id}` as any)}
            style={styles.iconCircleBtn}
            accessibilityLabel={t("common:edit")}
          >
            <Ionicons name="pencil" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={theme.primary}
          />
        }
      >
        {/* Breadcrumb Strip matching Stitch */}
        <View style={styles.breadcrumbRow}>
          <Ionicons name="people-outline" size={14} color={theme.textMuted} />
          <ThemedText style={styles.breadcrumbText} numberOfLines={1}>
            {t("customers:title")} • {customer.name}
          </ThemedText>
        </View>

        {/* Hero Debt Card */}
        <View style={styles.heroDebtCard}>
          <View style={styles.avatarHeaderRow}>
            <View style={styles.avatarCircle}>
              <ThemedText style={styles.avatarText}>{initials}</ThemedText>
            </View>

            <View style={styles.customerInfoWrap}>
              <View style={styles.nameStatusRow}>
                <ThemedText style={styles.heroCustomerName} numberOfLines={1}>
                  {customer.name}
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

              {customer.phone ? (
                <TouchableOpacity onPress={handleCall} style={styles.phoneLinkRow}>
                  <Ionicons name="call-outline" size={13} color={theme.primary} />
                  <ThemedText style={styles.phoneText}>{customer.phone}</ThemedText>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Amount Display */}
          <View style={styles.amountDisplayBlock}>
            <ThemedText style={styles.heroDebtLabel}>
              {t("customers:currentDebt")}
            </ThemedText>
            <ThemedText
              style={[
                styles.heroDebtAmount,
                hasDebt ? styles.heroDebtAmountActive : styles.heroDebtAmountSettled,
              ]}
            >
              {formatCentimes(debtCentimes, i18n.language as any)}
            </ThemedText>
          </View>

          {/* Micro Grid Summary */}
          <View style={styles.microGrid}>
            <View style={styles.microGridItem}>
              <ThemedText style={styles.microGridLabel}>{t("customers:creditSales")}</ThemedText>
              <ThemedText style={styles.microGridValue}>{creditSales.length}</ThemedText>
            </View>
            <View style={styles.microGridItem}>
              <ThemedText style={styles.microGridLabel}>{t("customers:payments")}</ThemedText>
              <ThemedText style={styles.microGridValue}>{payments.length}</ThemedText>
            </View>
            <View style={styles.microGridItem}>
              <ThemedText style={styles.microGridLabel}>{t("customers:timeline")}</ThemedText>
              <ThemedText style={styles.microGridValue}>{timelineItems.length}</ThemedText>
            </View>
          </View>
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
            <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
            <ThemedText style={styles.primaryActionBtnText}>
              {t("customers:recordPayment")}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={handleShareReminder}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={18} color={theme.textPrimary} />
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
                <Ionicons name="receipt-outline" size={36} color={theme.textMuted} />
                <ThemedText style={styles.tabEmptyText}>
                  {t("customers:noSales")}
                </ThemedText>
              </View>
            ) : (
              creditSales.map((sale) => (
                <View key={sale.id} style={styles.recordRow}>
                  <View style={styles.recordLeft}>
                    <View style={styles.recordIconSale}>
                      <Ionicons
                        name="receipt-outline"
                        size={18}
                        color={theme.error}
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
                <Ionicons name="cash-outline" size={36} color={theme.textMuted} />
                <ThemedText style={styles.tabEmptyText}>
                  {t("customers:noPayments")}
                </ThemedText>
              </View>
            ) : (
              payments.map((payment) => (
                <View key={payment.id} style={styles.recordRow}>
                  <View style={styles.recordLeft}>
                    <View style={styles.recordIconPayment}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color={theme.primary}
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
                <Ionicons name="time-outline" size={36} color={theme.textMuted} />
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
                      <Ionicons
                        name={
                          item.type === "sale"
                            ? "receipt-outline"
                            : "checkmark-circle-outline"
                        }
                        size={18}
                        color={
                          item.type === "sale"
                            ? theme.error
                            : theme.primary
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

        {/* Footer Trademark */}
        <FooterTrademark />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: 14,
      color: theme.textSecondary,
    },
    errorText: {
      fontSize: 16,
      color: theme.error,
      textAlign: "center",
      marginBottom: Spacing.md,
    },
    retryButton: {
      backgroundColor: theme.surface,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: BorderRadius.button,
      borderWidth: 1,
      borderColor: theme.border,
    },
    retryButtonText: {
      fontSize: 14,
      color: theme.textPrimary,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flex: 1,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    customerHeaderName: {
      ...Typography.heading3,
      color: theme.textPrimary,
      flex: 1,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    iconCircleBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: 48,
      gap: Spacing.md,
      maxWidth: 600,
      alignSelf: "center",
      width: "100%",
    },
    breadcrumbRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 2,
      marginBottom: 2,
    },
    breadcrumbText: {
      ...Typography.caption,
      color: theme.textSecondary,
      fontSize: 12,
    },
    heroDebtCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      gap: Spacing.md,
      ...Shadows.sm,
    },
    avatarHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.primary,
    },
    customerInfoWrap: {
      flex: 1,
      gap: 2,
    },
    nameStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.xs,
    },
    heroCustomerName: {
      ...Typography.heading3,
      color: theme.textPrimary,
      flex: 1,
    },
    phoneLinkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    phoneText: {
      ...Typography.caption,
      color: theme.primary,
      fontWeight: "600",
    },
    amountDisplayBlock: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: "flex-start",
      gap: 2,
    },
    heroDebtLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
      fontSize: 12,
    },
    heroDebtAmount: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    heroDebtAmountActive: {
      color: theme.error,
    },
    heroDebtAmountSettled: {
      color: theme.primary,
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.sm,
    },
    statusPillDebt: {
      backgroundColor: theme.errorLight,
    },
    statusPillSettled: {
      backgroundColor: theme.primaryLight,
    },
    statusPillText: {
      ...Typography.caption,
      fontSize: 11,
      fontWeight: "700",
    },
    statusPillTextDebt: {
      color: theme.error,
    },
    statusPillTextSettled: {
      color: theme.primary,
    },
    microGrid: {
      flexDirection: "row",
      gap: Spacing.xs,
    },
    microGridItem: {
      flex: 1,
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.lg,
      padding: Spacing.sm,
      alignItems: "center",
      gap: 2,
    },
    microGridLabel: {
      ...Typography.caption,
      color: theme.textMuted,
      fontSize: 11,
    },
    microGridValue: {
      ...Typography.label,
      color: theme.textPrimary,
      fontWeight: "700",
    },
    actionButtonsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    primaryActionBtn: {
      flex: 1.4,
      height: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.xl,
      ...Shadows.sm,
    },
    primaryActionBtnDisabled: {
      opacity: 0.5,
    },
    primaryActionBtnText: {
      ...Typography.label,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    secondaryActionBtn: {
      flex: 1,
      height: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
    },
    secondaryActionBtnText: {
      ...Typography.label,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    tabsContainer: {
      flexDirection: "row",
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.xl,
      padding: 3,
    },
    tabItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 10,
      borderRadius: BorderRadius.lg,
    },
    tabItemActive: {
      backgroundColor: theme.surface,
      ...Shadows.sm,
    },
    tabItemText: {
      ...Typography.caption,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    tabItemTextActive: {
      color: theme.textPrimary,
      fontWeight: "700",
    },
    tabBadge: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    tabBadgeActive: {
      backgroundColor: theme.primaryLight,
    },
    tabBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    tabBadgeTextActive: {
      color: theme.primary,
    },
    tabContent: {
      gap: Spacing.xs,
    },
    tabEmptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.xl,
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      gap: Spacing.xs,
    },
    tabEmptyText: {
      ...Typography.caption,
      color: theme.textMuted,
    },
    recordRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
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
      borderRadius: 18,
      backgroundColor: theme.errorLight,
      alignItems: "center",
      justifyContent: "center",
    },
    recordIconPayment: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    recordTexts: {
      flex: 1,
    },
    recordTitle: {
      ...Typography.label,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    recordSubtitle: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginTop: 2,
    },
    recordAmountSale: {
      ...Typography.label,
      fontWeight: "700",
      color: theme.error,
    },
    recordAmountPayment: {
      ...Typography.label,
      fontWeight: "700",
      color: theme.primary,
    },
    notesCard: {
      padding: Spacing.lg,
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      gap: Spacing.xs,
    },
    notesTitle: {
      ...Typography.caption,
      fontWeight: "700",
      color: theme.textSecondary,
      textTransform: "uppercase",
    },
    notesBody: {
      ...Typography.body,
      color: theme.textPrimary,
    },
  });
