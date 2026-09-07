/**
 * DashboardScreen — Home dashboard for Dukkan OS
 *
 - Displays business greeting, today's date, financial summaries,
   low-stock alert, recent sales, and quick action buttons.
 - All data sourced from SQLite via repositories.
 - All user-facing strings use t('dashboard.*) i18n pattern.
 - Remains LTR regardless of selected language (ar, fr, en).
 - Works offline (SQLite-local data, no network required).
 *
 - Refresh after sales, payments, edits, cancellations, and returns
 * (the calling screen or app state manager should trigger a re-fetch).
 */
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { GreetingCard } from "@/features/dashboard/components/GreetingCard";
import { LowStockList } from "@/features/dashboard/components/LowStockList";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentSalesList } from "@/features/dashboard/components/RecentSalesList";
import { SalesChart } from "@/features/dashboard/components/SalesChart";
import { SummaryCards } from "@/features/dashboard/components/SummaryCards";
import { useDashboard } from "@/hooks/useDashboard";
import { getTextAlignment } from "@/utils/text";

interface DashboardScreenProps {
  t: (key: string, ...args: any[]) => string;
  locale: "ar" | "fr" | "en";
}

export default function DashboardScreenDefault({
  t,
  locale,
}: DashboardScreenProps) {
  const router = useRouter();
  const {
    greeting,
    todayDate,
    todayLocale,
    todayRevenue_centimes,
    todayProfit_centimes,
    toCollect_centimes,
    lowStockCount,
    recentSales,
    lowStockProducts,
    quickActionNewSale,
    quickActionAddProduct,
    quickActionAddCustomer,
    quickActionRecordPayment,
  } = useDashboard({ t, locale });

  const alignment = getTextAlignment(locale);

  // Quick action navigation handlers
  const handleNewSale = () => {
    router.push("/(tabs)/sell" as any);
  };
  const handleAddProduct = () => {
    router.push("/products/new" as any);
  };
  const handleAddCustomer = () => {
    router.push("/customers/new" as any);
  };
  const handleRecordPayment = () => {
    router.push("/(tabs)/customers" as any);
  };

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Card */}
        <GreetingCard
          greeting={greeting}
          todayDate={todayDate}
          locale={todayLocale}
          textAlignment={alignment}
        />

        {/* 2x2 Bento Summary Cards matching Stitch */}
        <SummaryCards
          revenueKey={t("dashboard.summary.revenue")}
          revenueValue_centimes={todayRevenue_centimes}
          profitKey={t("dashboard.summary.profit")}
          profitValue_centimes={todayProfit_centimes}
          toCollectKey={t("dashboard.summary.toCollect")}
          toCollectValue_centimes={toCollect_centimes}
          lowStockKey={t("dashboard.summary.lowStock") || t("dashboard.lowStock.title")}
          lowStockCount={lowStockCount}
          locale={locale}
          textAlignment={alignment}
        />

        {/* 7-Day Sales Trend Bar Chart */}
        <SalesChart
          title={t("dashboard.charts.salesTrend") || "7-Day Sales Trend"}
          locale={locale}
        />

        {/* Quick Actions (4 large action buttons matching Stitch) */}
        <QuickActions
          quickActionNewSale={quickActionNewSale}
          quickActionAddProduct={quickActionAddProduct}
          quickActionAddCustomer={quickActionAddCustomer}
          quickActionRecordPayment={quickActionRecordPayment}
          locale={locale}
          textAlignment={alignment}
          onNewSale={handleNewSale}
          onAddProduct={handleAddProduct}
          onAddCustomer={handleAddCustomer}
          onRecordPayment={handleRecordPayment}
        />

        {/* Recent Sales List */}
        <RecentSalesList
          recentSales={recentSales}
          locale={locale}
          textAlignment={alignment}
          recentSalesHeader={t("dashboard.recentSales.title")}
          recentSalesNoResults={t("dashboard.recentSales.noSales")}
        />

        {/* Low-Stock List */}
        <LowStockList
          lowStockCount={lowStockCount}
          lowStockProducts={lowStockProducts}
          locale={locale}
          textAlignment={alignment}
          lowStockTitle={t("dashboard.lowStock.title")}
          lowStockNoLowStock={t("dashboard.lowStock.noLowStock")}
          lowStockNote={t("dashboard.lowStock.note", { count: lowStockCount })}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
});
