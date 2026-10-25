/**
 * useCustomers hook - manages customer list state with filtering and search
 *
 * Features:
 * - Fetch all customers, optionally filtered by active status
 * - Real-time search by name or phone
 * - Filter by All/With debt/No debt
 * - Single atomic grouped debt query (getAllCustomerDebts) eliminating N+1 DB queries
 * - Loading and error state management
 * - Persisted via SQLite
 */
import { useState, useCallback, useEffect } from "react";
import {
  getAll,
  search as customerSearch,
} from "@/database/repositories/customerRepository";
import { getAllCustomerDebts } from "@/services/customers/customerBalanceService";
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

      // Single atomic grouped query returning customer_id -> debt map
      const debtsMap = await getAllCustomerDebts();

      const transformed: CustomerListItem[] = allCustomers.map((customer) => {
        const debt = debtsMap[customer.id] || 0;
        return {
          ...customer,
          hasDebt: debt > 0,
          outstandingBalance: debt,
        };
      });

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
      const debtsMap = await getAllCustomerDebts();

      const transformed: CustomerListItem[] = results.map((customer) => {
        const debt = debtsMap[customer.id] || 0;
        return {
          ...customer,
          hasDebt: debt > 0,
          outstandingBalance: debt,
        };
      });
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

        const debtsMap = await getAllCustomerDebts();

        const transformed: CustomerListItem[] = allCustomers.map((customer) => {
          const debt = debtsMap[customer.id] || 0;
          return {
            ...customer,
            hasDebt: debt > 0,
            outstandingBalance: debt,
          };
        });

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
