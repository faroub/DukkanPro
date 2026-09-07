import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { Typography, Colors } from "@/constants/theme";
import { useCustomers } from "@/hooks/useCustomers";
import { CustomerSearchBar } from "@/features/customers/components/CustomerSearchBar";
import { CustomerFilterTabs } from "@/features/customers/components/CustomerFilterTabs";
import { CustomerRow } from "@/components/customers/CustomerRow";

interface CustomerListScreenProps {
  route?: any;
  navigation?: any;
}

export function CustomerListScreen({ route, navigation }: CustomerListScreenProps) {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Filters: all, withDebt, noDebt
  const { customers, loading, error, refetch, searchCustomers } = useCustomers({
    onlyActive: filter !== "archived",
  });

  // Build filters object from current filter selection
  const customersFilters = useMemo(() => {
    if (filter === "all") {
      return { onlyActive: true };
    } else if (filter === "withDebt") {
      return { onlyActive: true };
    } else if (filter === "noDebt") {
      return { onlyActive: true };
    } else if (filter === "archived") {
      return { onlyActive: false };
    }
    return { onlyActive: true };
  }, [filter]);

  // Handle filter tab changes
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);

  // Handle search from search bar
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      setFilter("all");
      searchCustomers(query);
    } else {
      // Clear search and reload
      setFilter("all");
      refetch();
    }
  }, [searchCustomers, refetch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    setRefreshing(false);
  }, [refetch]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText type="small" style={styles.loadingText}>
          {t("common:loading")}
        </ThemedText>
      </View>
    );
  }

  if (error) {
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
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6B7280"
        />
      }
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <CustomerSearchBar
          onSearch={handleSearch}
          onClear={() => {
            setFilter("all");
            refetch();
          }}
          disabled={loading}
        />

        <CustomerFilterTabs
          activeFilter={filter}
          onFilterChange={handleFilterChange}
        />
      </View>

      {customers.length === 0 && !loading && !error && (
        <View style={styles.emptyState}>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            {t("customers:noCustomers")}
          </ThemedText>
          {filter === "archived" && (
            <ThemedText type="small" style={styles.emptyDescription}>
              {t("customers:archivedMessage")}
            </ThemedText>
          )}
          {filter !== "archived" && (
            <ThemedText type="small" style={styles.emptyDescription}>
              {t("customers:searchNoResults")}
            </ThemedText>
          )}
        </View>
      )}

      <View style={styles.listContainer}>
        {customers.map((customer) => (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: 'center',
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
  listContainer: {
    paddingBottom: 100,
  },
});