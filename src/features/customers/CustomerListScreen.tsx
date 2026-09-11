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
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useCustomers } from "@/hooks/useCustomers";
import { CustomerSearchBar } from "@/features/customers/components/CustomerSearchBar";
import { CustomerFilterTabs } from "@/features/customers/components/CustomerFilterTabs";
import { CustomerRow } from "@/components/customers/CustomerRow";
import { formatCentimes } from "@/utils/money";

export function CustomerListScreen() {
  const { t, i18n } = useTranslation();
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

  return (
    <View style={styles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
          />
        }
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.titleContainer}>
            <ThemedText style={styles.headerTitle}>
              {t("customers:title")}
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {t("customers:carnetDette")}
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
              {t("customers:add")}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Quick Metrics Summary Banner */}
        <View style={styles.metricsBanner}>
          <View style={styles.metricColumn}>
            <ThemedText style={styles.metricLabel} numberOfLines={1}>
              {t("customers:totalCustomers")}
            </ThemedText>
            <ThemedText style={styles.metricValue}>
              {totalCount}
            </ThemedText>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricColumnCenter}>
            <ThemedText style={styles.metricDebtLabel} numberOfLines={1}>
              {t("customers:debtToCollect")}
            </ThemedText>
            <ThemedText style={styles.metricDebtValue} numberOfLines={1}>
              {formatCentimes(totalDebtCentimes, i18n.language as any)}
            </ThemedText>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricColumnRight}>
            <ThemedText style={styles.metricLabel} numberOfLines={1}>
              {t("customers:activeDebt")}
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
          disabled={loading}
        />

        {/* Filter Pills */}
        <CustomerFilterTabs
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={filterCounts}
        />

        {/* Customer List */}
        {filteredCustomers.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons
                name="people-outline"
                size={48}
                color={Colors.light.textMuted}
              />
            </View>
            <ThemedText style={styles.emptyTitle}>
              {t("customers:noCustomersYet")}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {filter === "withDebt"
                ? t("customers:noDebt")
                : t("customers:nameHelp")}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxxxx,
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
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.button,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  metricsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: Colors.light.borderLight,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  metricDebtLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.destructive,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  metricDebtValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.destructive, // Red color for debt to collect
    marginTop: 2,
  },
  metricSecondaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.secondary,
    marginTop: 2,
  },
  listContainer: {
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxxxx,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.xxl,
  },
});
