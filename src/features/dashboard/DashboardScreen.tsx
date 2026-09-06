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
import { ThemedView } from "@/components/themed-view";
import { GreetingCard } from "@/features/dashboard/components/GreetingCard";
import { LowStockList } from "@/features/dashboard/components/LowStockList";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentSalesList } from "@/features/dashboard/components/RecentSalesList";
import { SummaryCards } from "@/features/dashboard/components/SummaryCards";
import { useDashboard } from "@/hooks/useDashboard";
import { getTextAlignment } from "@/utils/text";
import { ScrollView, StyleSheet } from "react-native";

interface DashboardScreenProps {
  t: (key: string, ...args: any[]) => string;
  locale: "ar" | "fr" | "en";
}

export default function DashboardScreenDefault({
  t,
  locale,
}: DashboardScreenProps) {
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

  // Quick action handlers (placeholders for now)
  const handleNewSale = () => {};
  const handleAddProduct = () => {};
  const handleAddCustomer = () => {};
  const handleRecordPayment = () => {};

  return (
    <ThemedView type="background">
      <ScrollView
        contentContainerStyle={{
          padding: 24,
        }}
      >
        {/* Greeting Card */}
        <GreetingCard
          greeting={greeting}
          todayDate={todayDate}
          locale={todayLocale}
          textAlignment={alignment}
        />

        {/* Summary Cards */}
        <SummaryCards
          revenueKey={t("dashboard.summary.revenue")}
          revenueValue_centimes={todayRevenue_centimes}
          profitKey={t("dashboard.summary.profit")}
          profitValue_centimes={todayProfit_centimes}
          toCollectKey={t("dashboard.summary.toCollect")}
          toCollectValue_centimes={toCollect_centimes}
          locale={locale}
          textAlignment={alignment}
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

        {/* Quick Actions */}
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
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
});
