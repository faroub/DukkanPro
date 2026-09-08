import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Shadows, Typography } from "@/constants/theme";
import { getTextAlignment } from "@/utils/text";

interface QuickActionsProps {
  quickActionNewSale: string;
  quickActionAddProduct: string;
  quickActionAddCustomer: string;
  quickActionRecordPayment: string;
  locale: "ar" | "fr" | "en";
  textAlignment: "left" | "right";
  onNewSale: () => void;
  onAddProduct: () => void;
  onAddCustomer: () => void;
  onRecordPayment: () => void;
}

export function QuickActions({
  quickActionNewSale,
  quickActionAddProduct,
  quickActionAddCustomer,
  quickActionRecordPayment,
  locale,
  textAlignment,
  onNewSale,
  onAddProduct,
  onAddCustomer,
  onRecordPayment,
}: QuickActionsProps) {
  const alignment = textAlignment;

  return (
    <ThemedView type="background" style={styles.section}>
      <ThemedText type="body" style={[
        styles.label,
        { textAlign: alignment },
      ]}>
        {quickActionNewSale}
      </ThemedText>

      <View style={styles.actionSheet}>
        {/* Action 1: New Sale */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onNewSale}
          accessible={true}
          accessibilityLabel={quickActionNewSale}
        >
          <ThemedView style={styles.iconContainer}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: Colors.light.primary }}>
              point_of_sale
            </span>
          </ThemedView>
          <View style={styles.buttonContent}>
            <ThemedText style={styles.actionText}>{quickActionNewSale}</ThemedText>
            <ThemedText style={styles.captionText}>Quick checkout & receipt</ThemedText>
          </View>
        </TouchableOpacity>

        {/* Action 2: Add Product */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAddProduct}
          accessible={true}
          accessibilityLabel={quickActionAddProduct}
        >
          <ThemedView style={styles.iconContainer}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: Colors.light.primary }}>
              barcode_scanner
            </span>
          </ThemedView>
          <View style={styles.buttonContent}>
            <ThemedText style={styles.actionText}>{quickActionAddProduct}</ThemedText>
            <ThemedText style={styles.captionText}>Scan barcode or enter manually</ThemedText>
          </View>
        </TouchableOpacity>

        {/* Action 3: Add Customer */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAddCustomer}
          accessible={true}
          accessibilityLabel={quickActionAddCustomer}
        >
          <ThemedView style={styles.iconContainer}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: Colors.light.primary }}>
              person_add
            </span>
          </ThemedView>
          <View style={styles.buttonContent}>
            <ThemedText style={styles.actionText}>{quickActionAddCustomer}</ThemedText>
            <ThemedText style={styles.captionText}>Create account or credit ledger</ThemedText>
          </View>
        </TouchableOpacity>

        {/* Action 4: Record Payment */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onRecordPayment}
          accessible={true}
          accessibilityLabel={quickActionRecordPayment}
        >
          <ThemedView style={styles.iconContainer}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: Colors.light.primary }}>
              payments
            </span>
          </ThemedView>
          <View style={styles.buttonContent}>
            <ThemedText style={styles.actionText}>{quickActionRecordPayment}</ThemedText>
            <ThemedText style={styles.captionText}>Settle credit or partial payment</ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 20,
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
    marginBottom: 16,
    textAlign: "center",
  },
  actionSheet: {
    backgroundColor: Colors.light.surface,
  },
  actionButton: {
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 16,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
    ...Shadows.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    flexShrink: 0,
  },
  buttonContent: {
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: Colors.light.textPrimary,
    fontSize: 16,
    fontWeight: 600,
    textAlign: "center",
  },
  captionText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
});