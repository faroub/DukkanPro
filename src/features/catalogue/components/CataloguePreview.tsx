import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { formatCentimes } from "@/utils/money";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";

interface CataloguePreviewProps {
  products: any[];
  showPrices: boolean;
  hideOutOfStock: boolean;
  selectedProductNames: string[];
}

export function CataloguePreview({
  products,
  showPrices,
  hideOutOfStock,
  selectedProductNames,
}: CataloguePreviewProps) {
  const { t } = useTranslation();

  const displayProducts = products.filter((p: any) => {
    if (hideOutOfStock && p.stock <= 0) return false;
    return true;
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="heading" style={styles.title}>
        {t("catalogue.catalogue_preview")}
      </ThemedText>

      {displayProducts.length === 0 && (
        <ThemedText type="body" style={styles.emptyState}>
          {t("catalogue.no_products")}
        </ThemedText>
      )}

      <FlatList
        data={displayProducts}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.productRow}>
            <ThemedText type="body" style={styles.productName}>
              {item.name}
            </ThemedText>
            {showPrices && (
              <ThemedText type="body" style={styles.productPrice}>
                {formatCentimes(item.price_centimes)} {t("currency_dzd")}
              </ThemedText>
            )}
            <ThemedText type="body" style={styles.productAvailability}>
              {item.stock > 0
                ? t("catalogue.available")
                : t("catalogue.out_of_stock")}
            </ThemedText>
          </View>
        )}
      />

      {selectedProductNames.length > 0 && (
        <View style={styles.selectedSummary}>
          <ThemedText type="body" style={styles.summaryLabel}>
            {t("catalogue.selected_items")}: {selectedProductNames.length}
          </ThemedText>
          <ThemedText type="body" style={styles.summaryValue}>
            {selectedProductNames.join(", ")}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  productPrice: {
    color: Colors.light.primary,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "600",
  },
  productAvailability: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    marginLeft: 8,
  },
  selectedSummary: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginRight: 8,
  },
  summaryValue: {
    fontSize: 14,
    color: "#1B6B3A",
  },
  emptyState: {
    textAlign: "center",
    color: Colors.light.textSecondary,
    marginTop: Spacing.xl,
    fontSize: 14,
  },
});
