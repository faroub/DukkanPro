/**
 * useDashboard — Dashboard data hook
 *
 * - Retrieves data from SQLite via the dashboard repository
 * - Calculations use integer centimes, never floating-point
 * - Excludes cancelled/returned sales from revenue/profit/debt
 * - "Today" figures cover the merchant's local calendar day
 * - All user-facing strings wrapped in t('dashboard.*') i18n pattern
 * - Remains LTR regardless of selected language
 */
import { get as getBusinessProfile } from "@/database/repositories/businessProfileRepository";
import {
  getSevenDaySales,
  getTodayCost,
  getTodayRevenue,
} from "@/database/repositories/dashboardRepository";
import { getAll as getAllSales } from "@/database/repositories/saleRepository";
import { getAll as getAllProducts } from "@/database/repositories/productRepository";
import { getAllPayments } from "@/database/repositories/exportRepository";
import { useCallback, useEffect, useRef, useState } from "react";

// Sales that contribute to dashboard figures; cancelled/returned are excluded.
const VALID_SALE_STATUSES = ["completed", "partial", "credit"];

export interface DashboardData {
  // Greeting & date
  greeting: string;
  todayDate: string;
  todayLocale: "ar" | "fr" | "en";
  currencyCode: string;

  // Financial summaries (all in centimes, displayed via formatCentimes)
  todayRevenue_centimes: number;
  todayProfit_centimes: number;
  toCollect_centimes: number;

  // Store activity status
  totalProductsCount: number;
  totalSalesCount: number;
  hasProductsOrSales: boolean;

  // Component data
  lowStockCount: number;
  recentSales: any[];
  lowStockProducts: any[];
  sevenDaySales?: { date: string; total: number }[];

  // Quick action keys (i18n keys)
  quickActionNewSale: string;
  quickActionAddProduct: string;
  quickActionAddCustomer: string;
  quickActionRecordPayment: string;
}

export interface DashboardResult extends DashboardData {
  refetch: () => Promise<void>;
}

/**
 * Fetch today's revenue and cost of goods sold, all customer debt,
 * low-stock products (active, stock <= threshold), and recent sales.
 */
export async function fetchDashboardData(
  locale: "ar" | "fr" | "en",
): Promise<DashboardData> {
  // ---- Today's revenue & cost (repository filters to the local calendar day) ----
  const todayRevenue_centimes = await getTodayRevenue();
  const historicalCost_centimes = await getTodayCost();

  // ---- All sales & payments feed debt and the recent-sales list ----
  const allSales = await getAllSales();
  const allPayments = await getAllPayments();

  // ---- To collect: outstanding balances from completed sales minus recorded payments ----
  const completedSaleBalances = (allSales || [])
    .filter((s) => s.status === "completed")
    .reduce(
      (sum: number, sale) => sum + Math.max(0, sale.remaining_balance_centimes || 0),
      0,
    );
  const totalPayments_centimes = (allPayments || []).reduce(
    (sum: number, payment) => sum + (payment.amount_centimes || 0),
    0,
  );
  const toCollect_centimes = Math.max(
    0,
    completedSaleBalances - totalPayments_centimes,
  );

  // ---- Recent sales (getAll already returns newest first) ----
  const recentSales = (allSales || [])
    .filter((s) => VALID_SALE_STATUSES.includes(s.status))
    .slice(0, 5)
    .map((sale) => ({ ...sale, customerName: sale.customer_name ?? undefined }));

  // ---- Active products & low stock products ----
  let totalProductsCount = 0;
  let lowStockCount = 0;
  let lowStockProducts: any[] = [];

  try {
    const activeProducts = await getAllProducts({ is_active: true });
    totalProductsCount = (activeProducts || []).length;

    lowStockProducts = (activeProducts || []).filter((p: any) => {
      const minThreshold =
        p.minimum_stock_quantity !== undefined && p.minimum_stock_quantity !== null
          ? p.minimum_stock_quantity
          : 5;
      return (p.stock_quantity || 0) <= minThreshold;
    });
    lowStockCount = lowStockProducts.length;
  } catch (_err) {
    // Keep empty defaults if query fails
  }

  const totalSalesCount = (allSales || []).length;

  let currencyCode = "DZD";
  try {
    const profile = await getBusinessProfile();
    if (profile?.currency) {
      currencyCode = profile.currency;
    }
  } catch {}

  const hasProductsOrSales = totalProductsCount > 0 || totalSalesCount > 0;

  // ---- Build the dashboard data object ----
  return {
    // Greeting & date
    greeting: "",
    todayDate: new Date().toLocaleDateString(locale, {
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }),
    todayLocale: locale,
    currencyCode,

    // Financial summaries
    todayRevenue_centimes,
    todayProfit_centimes: todayRevenue_centimes - historicalCost_centimes,
    toCollect_centimes,

    // Store activity status
    totalProductsCount,
    totalSalesCount,
    hasProductsOrSales,

    // Component data
    lowStockCount,
    recentSales,
    lowStockProducts,
    sevenDaySales: await getSevenDaySales(),

    // Quick action keys
    quickActionNewSale: "dashboard.quick.newSale",
    quickActionAddProduct: "dashboard.quick.addProduct",
    quickActionAddCustomer: "dashboard.quick.addCustomer",
    quickActionRecordPayment: "dashboard.quick.recordPayment",
  };
}

/**
 * Main hook: useDashboard
 *
 * - Fetches data from SQLite via repository functions
 * - Computes profit = revenue - historical cost
 * - Returns DashboardResult for DashboardScreen including refetch()
 */
export function useDashboard(deps: {
  t: (key: string) => string;
  locale: "ar" | "fr" | "en";
}): DashboardResult {
  const [data, setData] = useState<DashboardData>(() => {
    return {
      greeting: deps.t("dashboard.greeting"),
      todayDate: new Date().toLocaleDateString(deps.locale, {
        weekday: "short",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }),
      todayLocale: deps.locale,
      currencyCode: "DZD",
      todayRevenue_centimes: 0,
      todayProfit_centimes: 0,
      toCollect_centimes: 0,
      totalProductsCount: 0,
      totalSalesCount: 0,
      hasProductsOrSales: false,
      lowStockCount: 0,
      recentSales: [],
      lowStockProducts: [],
      quickActionNewSale: deps.t("dashboard.quick.newSale"),
      quickActionAddProduct: deps.t("dashboard.quick.addProduct"),
      quickActionAddCustomer: deps.t("dashboard.quick.addCustomer"),
      quickActionRecordPayment: deps.t("dashboard.quick.recordPayment"),
    };
  });

  const tRef = useRef(deps.t);
  tRef.current = deps.t;
  const locale = deps.locale;

  const refetch = useCallback(async () => {
    const dashboardData = await fetchDashboardData(locale);
    setData({
      ...dashboardData,
      greeting: tRef.current("dashboard.greeting"),
      quickActionNewSale: tRef.current(dashboardData.quickActionNewSale),
      quickActionAddProduct: tRef.current(dashboardData.quickActionAddProduct),
      quickActionAddCustomer: tRef.current(dashboardData.quickActionAddCustomer),
      quickActionRecordPayment: tRef.current(
        dashboardData.quickActionRecordPayment,
      ),
    });
  }, [locale]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const dashboardData = await fetchDashboardData(locale);
      if (!isMounted) return;

      setData({
        ...dashboardData,
        greeting: tRef.current("dashboard.greeting"),
        quickActionNewSale: tRef.current(dashboardData.quickActionNewSale),
        quickActionAddProduct: tRef.current(dashboardData.quickActionAddProduct),
        quickActionAddCustomer: tRef.current(dashboardData.quickActionAddCustomer),
        quickActionRecordPayment: tRef.current(
          dashboardData.quickActionRecordPayment,
        ),
      });
    })();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  return {
    ...data,
    refetch,
  };
}
