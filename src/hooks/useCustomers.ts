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
 * Attach computed debt balances to raw customer rows.
 */
function attachDebt(
  customers: Customer[],
  debtsMap: Record<number, number>,
): CustomerListItem[] {
  return customers.map((customer) => {
    const debt = debtsMap[customer.id] || 0;
    return {
      ...customer,
      hasDebt: debt > 0,
      outstandingBalance: debt,
    };
  });
}

/**
 * Fetch the customer list with current debt balances attached.
 */
async function fetchCustomerList(
  onlyActive: boolean,
): Promise<CustomerListItem[]> {
  const allCustomers = await getAll({
    is_active: onlyActive ? true : undefined,
  });
  const debtsMap = await getAllCustomerDebts();
  return attachDebt(allCustomers, debtsMap);
}

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
      setCustomers(await fetchCustomerList(!!onlyActive));
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

      setCustomers(attachDebt(results, debtsMap));
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
        const list = await fetchCustomerList(!!onlyActive);

        if (isMounted) {
          setCustomers(list);
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
