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
import { getDatabase } from "@/database/database";
import {
  getSevenDaySales,
  getTodayCost,
  getTodayRevenue,
} from "@/database/repositories/dashboardRepository";
import { getAll } from "@/database/repositories/saleRepository";
import { getAllPayments } from "@/database/repositories/exportRepository";
import { useEffect, useRef, useState } from "react";

// Sales that contribute to dashboard figures; cancelled/returned are excluded.
const VALID_SALE_STATUSES = ["completed", "partial", "credit"];

export interface DashboardData {
  // Greeting & date
  greeting: string;
  todayDate: string;
  todayLocale: "ar" | "fr" | "en";

  // Financial summaries (all in centimes, displayed via formatCentimes)
  todayRevenue_centimes: number;
  todayProfit_centimes: number;
  toCollect_centimes: number;

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

/**
 - Fetch today's revenue and cost of goods sold, all customer debt,
 - low-stock products (active, stock <= threshold), and recent sales.
 */
export async function fetchDashboardData(
  locale: "ar" | "fr" | "en",
): Promise<DashboardData> {
  // ---- Today's revenue & cost (repository filters to the local calendar day) ----
  const todayRevenue_centimes = await getTodayRevenue();
  const historicalCost_centimes = await getTodayCost();

  // ---- All sales & payments feed debt and the recent-sales list ----
  const allSales = await getAll();
  const allPayments = await getAllPayments();

  // ---- To collect: outstanding balances from completed sales minus recorded payments ----
  // recordPayment never reduces sale balances, so payments are subtracted here.
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

  // ---- Low-stock products (active, stock <= minimum threshold) ----
  let lowStockCount = 0;
  let lowStockProducts: any[] = [];
  try {
    const db = await getDatabase();
    const products: any[] = await db.getAllAsync(
      // language=SQLite
      "SELECT * FROM products WHERE is_active = 1",
    );
    lowStockProducts = (products || []).filter((p: any) => {
      const minThreshold =
        p.minimum_stock_quantity !== undefined && p.minimum_stock_quantity !== null
          ? p.minimum_stock_quantity
          : 5;
      return (p.stock_quantity || 0) <= minThreshold;
    });
    lowStockCount = lowStockProducts.length;
  } catch (_err) {
    // If the DB query fails, keep the empty defaults
  }

  // ---- Build the dashboard data object ----
  return {
    // Greeting & date
    greeting: "", // will be set by hook caller
    todayDate: new Date().toLocaleDateString(locale, {
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }),
    todayLocale: locale,

    // Financial summaries
    todayRevenue_centimes,
    todayProfit_centimes: todayRevenue_centimes - historicalCost_centimes,
    toCollect_centimes,

    // Component data
    lowStockCount,
    recentSales,
    lowStockProducts,
    sevenDaySales: await getSevenDaySales(),

    // Quick action keys - will be overridden by deps.t in the hook
    quickActionNewSale: "dashboard.quick.newSale",
    quickActionAddProduct: "dashboard.quick.addProduct",
    quickActionAddCustomer: "dashboard.quick.addCustomer",
    quickActionRecordPayment: "dashboard.quick.recordPayment",
  };
}

/**
 * Main hook: useDashboard
 *
 - Fetches data from SQLite via repository functions
 - Computes profit = revenue - historical cost
 - Returns DashboardData for the DashboardScreen
 *
 - MUST be called with a `deps` object containing `t` and `locale`
 - The caller (DashboardScreen) provides the translation function and selected locale
 *
 - Refetches when the locale changes; t is read through a ref so that a
 - new `deps` object identity on every render does not trigger a refetch.
 */
export function useDashboard(deps: {
  t: (key: string) => string;
  locale: "ar" | "fr" | "en";
}): DashboardData {
  const [data, setData] = useState<DashboardData>(() => {
    // Initial state - will be hydrated after fetch
    return {
      greeting: deps.t("dashboard.greeting"),
      todayDate: new Date().toLocaleDateString(deps.locale, {
        weekday: "short",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }),
      todayLocale: deps.locale,
      todayRevenue_centimes: 0,
      todayProfit_centimes: 0,
      toCollect_centimes: 0,
      lowStockCount: 0,
      recentSales: [],
      lowStockProducts: [],
      quickActionNewSale: deps.t("dashboard.quick.newSale"),
      quickActionAddProduct: deps.t("dashboard.quick.addProduct"),
      quickActionAddCustomer: deps.t("dashboard.quick.addCustomer"),
      quickActionRecordPayment: deps.t("dashboard.quick.recordPayment"),
    };
  });

  // t is read through a ref: its identity may change on every render, but only
  // locale changes should trigger a refetch.
  const tRef = useRef(deps.t);
  tRef.current = deps.t;
  const locale = deps.locale;

  useEffect(() => {
    let isMounted = true;

    // Fetch data async and hydrate state
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

  return data;
}
