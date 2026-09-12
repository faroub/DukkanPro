/**
 * useCustomers hook - manages customer list state with filtering and search
 *
 * Features:
 * - Fetch all customers, optionally filtered by active status
 * - Real-time search by name or phone
 * - Filter by All/With debt/No debt
 * - Loading and error state management
 * - Persisted via SQLite
 */
import { useState, useCallback, useEffect } from "react";
import {
  getAll,
  search as customerSearch,
} from "@/database/repositories/customerRepository";
import { getCustomerDebt } from "@/services/customers/customerBalanceService";
import type { Customer } from "@/types/entities";

/**
 * Filters for customer listing
 */
export type CustomersFilters = {
  onlyActive?: boolean;
};

/**
 * Customer list item - Customer with computed debt information
 */
export type CustomerListItem = Customer & {
  hasDebt: boolean;
  outstandingBalance: number;
};

/**
 * UseCustomers hook - manages customer list state with filtering
 *
 * Features:
 * - Fetch all customers, optionally filtered by active status
 * - Real-time search by name or phone
 * - Filter by All/With debt/No debt
 * - Loading and error state management
 * - Archive (soft-delete) support
 * - Persisted via SQLite
 */
export function useCustomers(filters: CustomersFilters = {}) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const { onlyActive } = filters;

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let allCustomers: Customer[];

      if (onlyActive) {
        allCustomers = await getAll({ is_active: true });
      } else {
        allCustomers = await getAll({ is_active: undefined });
      }

      // Compute actual debt info for each customer from customerBalanceService
      const transformed: CustomerListItem[] = await Promise.all(
        allCustomers.map(async (customer) => {
          try {
            const debt = await getCustomerDebt(customer.id);
            return {
              ...customer,
              hasDebt: debt > 0,
              outstandingBalance: debt,
            };
          } catch {
            return {
              ...customer,
              hasDebt: false,
              outstandingBalance: 0,
            };
          }
        }),
      );

      setCustomers(transformed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load customers",
      );
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [onlyActive]);

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      return loadCustomers();
    }
    try {
      setLoading(true);
      const results = await customerSearch(query);
      const transformed: CustomerListItem[] = await Promise.all(
        results.map(async (customer) => {
          try {
            const debt = await getCustomerDebt(customer.id);
            return {
              ...customer,
              hasDebt: debt > 0,
              outstandingBalance: debt,
            };
          } catch {
            return {
              ...customer,
              hasDebt: false,
              outstandingBalance: 0,
            };
          }
        }),
      );
      setCustomers(transformed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search customers",
      );
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [loadCustomers]);

  const setActiveFilter = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);

  const reload = useCallback(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      try {
        let allCustomers: Customer[];
        if (onlyActive) {
          allCustomers = await getAll({ is_active: true });
        } else {
          allCustomers = await getAll({ is_active: undefined });
        }

        const transformed: CustomerListItem[] = await Promise.all(
          allCustomers.map(async (customer) => {
            try {
              const debt = await getCustomerDebt(customer.id);
              return {
                ...customer,
                hasDebt: debt > 0,
                outstandingBalance: debt,
              };
            } catch {
              return {
                ...customer,
                hasDebt: false,
                outstandingBalance: 0,
              };
            }
          }),
        );

        if (isMounted) {
          setCustomers(transformed);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load customers",
          );
          setCustomers([]);
          setLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [onlyActive]);

  return {
    customers,
    loading,
    error,
    refetch: reload,
    searchCustomers,
    setFilter: setActiveFilter,
    filter,
  };
}