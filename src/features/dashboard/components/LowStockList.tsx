import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { formatCentimes } from "@/utils/money";
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

      {/* Alert Summary Banner */}
      {lowStockCount > 0 && (
        <View style={styles.alertBanner}>
          <View style={styles.alertIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: Colors.light.warning }}>
              warning
            </span>
          </View>
          <View style={styles.alertContent}>
            <ThemedText style={styles.alertLabel}>Replenishment Priority</ThemedText>
            <ThemedText style={styles.alertSub}>
              {lowStockCount} products below minimum threshold
            </ThemedText>
          </View>
          <View style={styles.alertTime}>
            <ThemedText style={styles.alertTimeText}>Supplier orders cutoff: 14:00</ThemedText>
          </View>
        </View>
      )}

      {/* Search and Filter Section */}
      <View style={styles.searchFilterSection}>
        {/* Search input */}
        <View style={styles.searchInputWrapper}>
          <span style={styles.searchIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: Colors.light.textMuted }}>
              search
            </span>
          </span>
          <input
            style={styles.searchInput}
            id="product-search"
            placeholder="Search inventory, barcode, SKU..."
            type="text"
          />
          <span
            style={styles.scanBtn}
            title="Scan barcode"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: Colors.light.textSecondary }}>
              barcode_scanner
            </span>
          </span>
        </View>

        {/* Category Filter Pills */}
        <View style={styles.filterPills}>
          <button style={styles.filterChipActive} aria-label="All (3)">All (3)</button>
          <button style={styles.filterChipInactive} aria-label="Dairy & Fresh">Dairy & Fresh</button>
          <button style={styles.filterChipInactive} aria-label="Groceries">Groceries</button>
          <button style={styles.filterChipInactive} aria-label="Beverages">Beverages</button>
          <button style={styles.filterChipInactive} aria-label="Cooking Oils">Cooking Oils</button>
        </View>
      </View>

      {/* Low Stock Items List */}
      <View style={styles.itemsList}>
        {lowStockProducts.map((product, index) => (
          <View key={product.id} style={styles.productItem}>
            <View style={styles.productHeader}>
              <View style={styles.productIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: Colors.light.textSecondary }}>
                  {product.category === "dairy" ? "water_bottle" : product.category === "groceries" ? "food" : "beverage"}
                </span>
              </View>
              <View style={styles.productDetails}>
                <ThemedText style={styles.productName}>{product.name}</ThemedText>
                <ThemedText style={styles.productSku}>
                  SKU:{product.sku || "—"}
                </ThemedText>
              </View>
            </View>
            <span style={styles.stockBadge}>
              {product.stockQuantity <= product.minThreshold ? "Critical" : "Low stock"}
            </span>
            <View style={styles.metricsRow}>
              <View style={styles.currentStock}>
                <ThemedText style={styles.metricsLabel}>Current Stock</ThemedText>
                <ThemedText style={styles.metricsValue}>{product.stockQuantity} units</ThemedText>
              </View>
              <View style={styles.minThreshold}>
                <ThemedText style={styles.metricsLabelUpper}>Min Threshold</ThemedText>
                <ThemedText style={styles.metricsValue}>{product.minThreshold} units</ThemedText>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[{ ...styles.progressBarFill, width: `${Math.max(1, Math.round((product.stockQuantity / product.minThreshold) * 100))}%` }]} />
            </View>
            <View style={styles.actionButton}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: Colors.light.primary }}>
                add
              </span>
              <ThemedText style={styles.actionText}>Add Stock</ThemedText>
            </View>
          </View>
        ))}
      </View>

      {/* Bottom Sticky Action CTA */}
      {lowStockCount > 0 && (
        <View style={styles.stickyCTA}>
          <TouchableOpacity style={styles.ctaButton} onPress={() => {}}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: Colors.light.surface }}>
              shopping_cart_checkout
            </span>
            <ThemedText style={styles.ctaText}>Bulk Reorder Order</ThemedText>
            <ThemedText style={styles.ctaBadge}>
              <span style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: 2, borderRadius: 6, marginLeft: 4 }}>
                3 items
              </span>
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.lg,
    marginBottom: 24,
    ...Shadows.sm,
  },
  label: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  alertBanner: {
    backgroundColor: Colors.light.warningLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.errorLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertLabel: {
    ...Typography.label,
    color: Colors.light.warning,
    fontWeight: 600,
    marginBottom: 2,
  },
  alertSub: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  alertTime: {
    marginLeft: 12,
    alignItems: "flex-end",
  },
  alertTimeText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  searchFilterSection: {
    marginBottom: 12,
  },
  searchInputWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 12,
    color: Colors.light.textMuted,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingLeft: 12,
    fontSize: 14,
    color: Colors.light.textPrimary,
    backgroundColor: "transparent",
  },
  scanBtn: {
    marginLeft: 8,
    padding: 6,
  },
  filterPills: {
    display: "flex",
    gap: 6,
    marginBottom: 8,
  },
  filterChip: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.light.border,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    color: Colors.light.surface,
    borderColor: Colors.light.primary,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipInactive: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "transparent",
    color: Colors.light.textSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  productItem: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  productIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    ...Typography.body,
    color: Colors.light.textPrimary,
    fontWeight: 500,
  },
  productSku: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.light.warningLight,
    color: Colors.light.warning,
    fontSize: 10,
    fontWeight: 600,
    margin: 8,
    alignSelf: "flex-start",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    margin: 8,
  },
  metricsLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
  },
  metricsValue: {
    ...Typography.moneySmall,
    color: Colors.light.textPrimary,
  },
  currentStock: {
    alignItems: "center",
  },
  minThreshold: {
    alignItems: "flex-end",
  },
  metricsLabelUpper: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    overflow: "hidden",
    margin: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.light.backgroundElement,
  },
  actionButton: {
    width: "100%",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
  },
  actionText: {
    ...Typography.body,
    color: Colors.light.textPrimary,
    marginTop: 2,
    textAlign: "center",
  },
  stickyCTA: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  ctaButton: {
    width: "100%",
    backgroundColor: Colors.light.primary,
    color: Colors.light.surface,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  ctaText: {
    ...Typography.body,
    color: Colors.light.surface,
  },
  ctaBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 4,
    borderRadius: 6,
    marginLeft: 4,
  },
});