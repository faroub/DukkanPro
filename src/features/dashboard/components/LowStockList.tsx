import { View, StyleSheet, Text, ScrollView } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getTextAlignment } from "@/utils/text";

interface LowStockListProps {
  lowStockCount: number;
  lowStockProducts: any[];
  locale: "ar" | "fr" | "en";
  textAlignment: "left" | "right";
  lowStockTitle: string;
  lowStockNoLowStock: string;
  lowStockNote: string;
}

export function LowStockList({
  lowStockCount,
  lowStockProducts,
  locale,
  textAlignment,
  lowStockTitle,
  lowStockNoLowStock,
  lowStockNote,
}: LowStockListProps) {
  const alignment = textAlignment;

  return (
    <ThemedView type="background" style={styles.section}>
      <ThemedText type="body" style={[
        styles.label,
        { textAlign: alignment },
      ]}>
        {lowStockTitle}
      </ThemedText>

      {lowStockCount === 0 && (
        <ThemedText type="caption" style={styles.noLowStock}>
          {lowStockNoLowStock}
        </ThemedText>
      )}

      <ScrollView
        horizontal
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
      >
        {lowStockProducts.map((product, index) => (
          <View key={product.id} style={styles.productItem}>
            <ThemedText type="body" style={styles.productName}>
              {product.name}
            </ThemedText>
            <ThemedText type="caption" style={styles.productStock}>
              stock:{product.stock_quantity}
            </ThemedText>
          </View>
        ))}
      </ScrollView>

      <ThemedText type="caption" style={styles.lowStockNote}>
        {lowStockNote}
      </ThemedText>
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
  noLowStock: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    margin: 20,
  },
  listContainer: {
    flexDirection: "row",
  },
  productItem: {
    padding: 12,
    minWidth: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginRight: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  productName: {
    fontSize: 14,
    color: "#1B6B3A",
  },
  productStock: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  lowStockNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
});