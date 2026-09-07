import { View, StyleSheet, Text, ScrollView } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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

      <ScrollView
        horizontal
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
      >
        {recentSales.map((sale, index) => (
          <View key={sale.id} style={styles.saleItem}>
            <ThemedText type="caption" style={styles.saleMethod}>
              {sale.payment_method === "cash"
                ? "cash"
                : sale.payment_method === "electronic"
                ? "electronic"
                : "mixed"}
            </ThemedText>
            <ThemedText type="caption" style={styles.saleAmount}>
              -{formatCentimes(sale.total_centimes)}
            </ThemedText>
            <ThemedText type="caption" style={styles.saleDate}>
              {new Date(sale.sold_at).toLocaleDateString(locale)}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#FFFFFF",
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
  listContainer: {
    flexDirection: "row",
  },
  saleItem: {
    padding: 12,
    minWidth: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginRight: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  saleMethod: {
    fontSize: 12,
    color: "#1B6B3A",
    fontWeight: "600",
  },
  saleAmount: {
    fontSize: 14,
    color: "#1B6B3A",
    marginHorizontal: 4,
  },
  saleDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});