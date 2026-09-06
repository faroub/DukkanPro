import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";

interface ProductSelectorProps {
  products: any[];
  onSelect: (product: any) => void;
  onToggleStock: (productId: number) => void;
  hideOutOfStock: boolean;
  selectedProducts: any[];
  showPrices: boolean;
}

export function ProductSelector({
  products,
  onSelect,
  onToggleStock,
  hideOutOfStock,
  selectedProducts,
  showPrices,
}: ProductSelectorProps) {
  const { t } = useTranslation();

  const isSelected = (product: any) =>
    selectedProducts.some((p: any) => p.id === product.id);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="body" style={styles.title}>
        {t("catalogue.products")}
      </ThemedText>

      <FlatList
        data={products}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <View style={styles.productInfo}>
              <ThemedText type="body" style={styles.productName}>
                {item.name}
              </ThemedText>
              <ThemedText type="caption" style={styles.productCategory}>
                {item.category}
              </ThemedText>
            </View>

            <View style={styles.productActions}>
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={[
                  styles.actionButton,
                  isSelected(item) && styles.actionButtonSelected,
                ]}
              >
                <ThemedText type="caption" style={styles.actionButtonText}>
                  {t("catalogue.select")}
                </ThemedText>
              </TouchableOpacity>

              {item.stock >= 0 && (
                <TouchableOpacity
                  onPress={() => onToggleStock(item.id)}
                  style={styles.actionButton}
                >
                  <ThemedText type="caption" style={styles.actionButtonText}>
                    {item.stock > 0 || !hideOutOfStock
                      ? t("catalogue.available")
                      : t("catalogue.out_of_stock")}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fafafa",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    color: "#333",
  },
  productCategory: {
    fontSize: 12,
    color: "#666",
  },
  productActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#1B6B3A",
    borderRadius: 4,
    backgroundColor: "#f0f9f0",
    marginRight: 4,
  },
  actionButtonSelected: {
    backgroundColor: "#1B6B3A",
  },
  actionButtonText: {
    color: "#1B6B3A",
    fontSize: 12,
  },
});
