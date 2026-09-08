import { View, StyleSheet, Text, ScrollView } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Typography } from "@/constants/theme";
import { formatCentimes } from "@/utils/money";
import { getTextAlignment } from "@/utils/text";

interface RecentSalesListProps {
  recentSales: any[];
  locale: "ar" | "fr" | "en";
  textAlignment: "left" | "right";
  recentSalesHeader: string;
  recentSalesNoResults: string;
}

export function RecentSalesList({
  recentSales,
  locale,
  textAlignment,
  recentSalesHeader,
  recentSalesNoResults,
}: RecentSalesListProps) {
  const alignment = textAlignment;

  return (
    <ThemedView type="background" style={styles.section}>
      <ThemedText type="body" style={[
        styles.label,
        { textAlign: alignment },
      ]}>
        {recentSalesHeader}
      </ThemedText>

      {recentSales.length === 0 && (
        <ThemedText type="caption" style={styles.emptyState}>
          {recentSalesNoResults}
        </ThemedText>
      )}

      {/* Filter pills */}
      <div style={styles.filterPills}>
        <button style={styles.filterBtnAll} aria-label="All">All</button>
        <button style={styles.filterBtnToday} aria-label="Today">Today</button>
        <button style={styles.filterBtnWeek} aria-label="This Week">This Week</button>
        <button style={styles.filterBtnMonth} aria-label="This Month">This Month</button>
      </div>

      {/* Search and receipt filter */}
      <div style={styles.searchContainer}>
        <span style={styles.searchIcon} className="material-symbols-outlined">search</span>
        <input
          style={styles.searchInput}
          id="sales-search-input"
          placeholder="Search by customer or receipt #"
          type="text"
        />
        <span
          style={styles.clearBtn}
          className="material-symbols-outlined"
          id="clear-search-btn"
        >cancel</span>
      </div>

      {/* Section Divider / Group Label */}
      <div style={styles.sectionDivider}>
        <span style={styles.labelText}>Completed Orders</span>
        <span style={styles.countText}>Showing 6 results</span>
      </div>

      {/* Sales Records List */}
      <ScrollView
        horizontal
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
      >
        {recentSales.map((sale, index) => (
          <View key={sale.id} style={styles.saleItem}>
            <div style={styles.saleLeft}>
              <div style={styles.saleAvatar}>
                <span style={styles.saleInitials}>
                  {sale.customerName?.split(" ").map((n: string) => n[0]).join("") || "—"}
                </span>
              </div>
              <div style={styles.saleDetails}>
                <ThemedText style={styles.saleName}>{sale.customerName || "Unknown Customer"}</ThemedText>
                <ThemedText style={styles.saleDate}>
                  {new Date(sale.sold_at).toLocaleDateString(locale)}
                </ThemedText>
                <ThemedText style={styles.saleItems}>
                  {sale.itemsCount} items
                </ThemedText>
              </div>
            </div>
            <div style={styles.saleRight}>
              <ThemedText style={styles.saleAmount}>-{formatCentimes(sale.total_centimes)}</ThemedText>
              <ThemedText style={styles.saleStatus}>
                {sale.payment_method === "cash"
                  ? "Paid"
                  : sale.payment_method === "electronic"
                  ? "Electronic"
                  : "Mixed"}
              </ThemedText>
            </div>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  emptyState: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    margin: 20,
  },
  filterPills: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnAll: {
    ...styles.filterBtn,
    backgroundColor: "#1B6B3A",
    color: "#FFFFFF",
  },
  filterBtnToday: {
    ...styles.filterBtn,
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  filterBtnWeek: {
    ...styles.filterBtn,
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  filterBtnMonth: {
    ...styles.filterBtn,
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    color: Colors.light.textMuted,
    marginTop: -1,
  },
  searchInput: {
    width: "90%",
    paddingLeft: 36,
    paddingRight: 12,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  clearBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -50 }],
    color: Colors.light.textMuted,
  },
  sectionDivider: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  labelText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
  },
  countText: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    fontSize: 11,
  },
  listContainer: {
    flexDirection: "row",
  },
  saleItem: {
    padding: 16,
    minWidth: 120,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    marginRight: 8,
    minHeight: 72,
  },
  saleLeft: {
    flex: 1,
  },
  saleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  saleInitials: {
    fontSize: 14,
    fontWeight: 600,
    color: Colors.light.primary,
  },
  saleDetails: {
    flex: 1,
  },
  saleName: {
    fontSize: 14,
    fontWeight: 500,
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  saleDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  saleItems: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  saleRight: {
    alignItems: "flex-end",
  },
  saleAmount: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: 600,
  },
  saleStatus: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});