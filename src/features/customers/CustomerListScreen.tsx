import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useCustomers } from "@/hooks/useCustomers";
import { useTheme } from "@/hooks/use-theme";
import { CustomerSearchBar } from "@/features/customers/components/CustomerSearchBar";
import { CustomerFilterTabs } from "@/features/customers/components/CustomerFilterTabs";
import { CustomerRow } from "@/components/customers/CustomerRow";
import { formatCentimes } from "@/utils/money";

export function CustomerListScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Fetch all customers
  const { customers, loading, error, refetch, searchCustomers } = useCustomers({
    onlyActive: filter !== "archived",
  });

  // Calculate metrics
  const { totalCount, totalDebtCentimes, activeDebtCount, settledCount } = useMemo(() => {
    let debtSum = 0;
    let debtCount = 0;
    let settled = 0;

    customers.forEach((c) => {
      if (c.hasDebt) {
        debtSum += c.outstandingBalance;
        debtCount += 1;
      } else {
        settled += 1;
      }
    });

    return {
      totalCount: customers.length,
      totalDebtCentimes: debtSum,
      activeDebtCount: debtCount,
      settledCount: settled,
    };
  }, [customers]);

  // Counts for filter pills
  const filterCounts = useMemo(() => ({
    all: totalCount,
    withDebt: activeDebtCount,
    noDebt: settledCount,
    archived: undefined,
  }), [totalCount, activeDebtCount, settledCount]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    if (filter === "withDebt") {
      return customers.filter((c) => c.hasDebt);
    }
    if (filter === "noDebt") {
      return customers.filter((c) => !c.hasDebt);
    }
    return customers;
  }, [customers, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSearch = useCallback((query: string) => {
    searchCustomers(query);
  }, [searchCustomers]);

  const handleClearSearch = useCallback(() => {
    refetch();
  }, [refetch]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Title & Add Customer Button */}
        <View style={styles.topHeader}>
          <View style={styles.titleContainer}>
            <ThemedText style={styles.headerTitle}>
              {t("customers:title")}
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {t("customers:subtitle", { count: totalCount })}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/customers/new" as any)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t("customers:addCustomer")}
          >
            <MaterialIcons name="person-add" size={18} color="#FFFFFF" />
            <ThemedText style={styles.addButtonText}>
              {t("customers:addCustomer")}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Metrics Overview Banner */}
        <View style={styles.metricsBanner}>
          <View style={styles.metricColumn}>
            <ThemedText style={styles.metricLabel}>
              {t("customers:totalCustomers")}
            </ThemedText>
            <ThemedText style={styles.metricValue}>{totalCount}</ThemedText>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricColumnCenter}>
            <ThemedText style={styles.metricDebtLabel}>
              {t("customers:totalDebtToCollect")}
            </ThemedText>
            <ThemedText style={styles.metricDebtValue}>
              {formatCentimes(totalDebtCentimes, i18n.language as any)}
            </ThemedText>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricColumnRight}>
            <ThemedText style={styles.metricLabel}>
              {t("customers:withDebtCount")}
            </ThemedText>
            <ThemedText style={styles.metricSecondaryValue}>
              {activeDebtCount}
            </ThemedText>
          </View>
        </View>

        {/* Search Bar */}
        <CustomerSearchBar
          onSearch={handleSearch}
          onClear={handleClearSearch}
        />

        {/* Filter Tabs */}
        <CustomerFilterTabs
          activeFilter={filter}
          onSelectFilter={setFilter}
          counts={filterCounts}
        />

        {/* Customer List or Empty State */}
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons
                name="people-outline"
                size={40}
                color={theme.textMuted}
              />
            </View>
            <ThemedText style={styles.emptyTitle}>
              {t("customers:noCustomersFound")}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {filter === "all"
                ? t("customers:emptyAllSubtitle")
                : t("customers:emptyFilterSubtitle")}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredCustomers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={{
                  id: customer.id,
                  name: customer.name,
                  phone: customer.phone,
                  note: customer.note,
                  isActive: customer.is_active,
                  hasDebt: customer.hasDebt,
                  outstandingBalance: customer.outstandingBalance,
                }}
              />
            ))}
          </View>
        )}
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
    contentContainer: {
      padding: Spacing.lg,
      paddingBottom: 48,
      maxWidth: 600,
      alignSelf: "center",
      width: "100%",
    },
    topHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
    },
    titleContainer: {
      flex: 1,
      marginRight: Spacing.md,
    },
    headerTitle: {
      ...Typography.heading2,
      color: theme.textPrimary,
    },
    headerSubtitle: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginTop: 2,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.primary,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: BorderRadius.xl,
      ...Shadows.sm,
    },
    addButtonText: {
      ...Typography.label,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    metricsBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.surface,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      ...Shadows.sm,
    },
    metricColumn: {
      flex: 1,
    },
    metricColumnCenter: {
      flex: 1.2,
      paddingHorizontal: Spacing.xs,
      alignItems: "center",
    },
    metricColumnRight: {
      flex: 1,
      alignItems: "flex-end",
    },
    metricDivider: {
      width: 1,
      height: 32,
      backgroundColor: theme.border,
    },
    metricLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
      fontSize: 11,
    },
    metricDebtLabel: {
      ...Typography.caption,
      fontWeight: "600",
      color: theme.error,
      fontSize: 11,
    },
    metricValue: {
      ...Typography.heading3,
      color: theme.textPrimary,
      marginTop: 2,
    },
    metricDebtValue: {
      ...Typography.heading3,
      color: theme.error,
      marginTop: 2,
    },
    metricSecondaryValue: {
      ...Typography.heading3,
      color: theme.secondary,
      marginTop: 2,
    },
    listContainer: {
      marginTop: Spacing.xs,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.xl * 2,
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    emptyTitle: {
      ...Typography.label,
      fontSize: 17,
      fontWeight: "600",
      color: theme.textPrimary,
      marginBottom: 4,
    },
    emptySubtitle: {
      ...Typography.caption,
      color: theme.textSecondary,
      textAlign: "center",
      paddingHorizontal: Spacing.lg,
    },
  });
