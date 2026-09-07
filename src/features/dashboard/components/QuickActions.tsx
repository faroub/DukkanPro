import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onNewSale}
          accessible={true}
          accessibilityLabel={quickActionNewSale}
        >
          <ThemedText type="body" style={styles.actionText}>
            {quickActionNewSale}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAddProduct}
          accessible={true}
          accessibilityLabel={quickActionAddProduct}
        >
          <ThemedText type="body" style={styles.actionText}>
            {quickActionAddProduct}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAddCustomer}
          accessible={true}
          accessibilityLabel={quickActionAddCustomer}
        >
          <ThemedText type="body" style={styles.actionText}>
            {quickActionAddCustomer}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onRecordPayment}
          accessible={true}
          accessibilityLabel={quickActionRecordPayment}
        >
          <ThemedText type="body" style={styles.actionText}>
            {quickActionRecordPayment}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
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
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "#1B6B3A",
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});