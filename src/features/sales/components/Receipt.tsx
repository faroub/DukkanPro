import React from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useTranslation } from "react-i18next";
import { formatCentimes } from "@/utils/money";
import { Colors } from "@/constants/theme";
import { Sale } from "@/types/entities";
import { calculateProfit, calculateChange } from "@/services/sales/saleCalculator";

interface ReceiptProps {
  visible: boolean;
  onRequestClose: () => void;
  onShare: () => void;
  sale: Sale;
}

export function Receipt({
  visible,
  onRequestClose,
  onShare,
  sale,
}: ReceiptProps) {
  const { t, i18n } = useTranslation();

  // Calculate derived values
  const subtotal = sale.subtotal_centimes;
  const discount = sale.discount_centimes || 0;
  const total = sale.total_centimes;
  const amountPaid = sale.amount_paid_centimes;
  const remainingBalance = sale.remaining_balance_centimes;
  const change = calculateChange(amountPaid, total);
  const profit = calculateProfit(
    sale.saleItems?.map((item) => ({
      quantity: item.quantity,
      unitSalePriceCentimes: item.unit_sale_price_centimes,
      unitCostPriceCentimes: item.unit_cost_price_centimes,
    })) || []
  );

  // Format date
  const soldAt = new Date(sale.sold_at);
  const isArabic = i18n.language === "ar";
  const formattedDate = soldAt.toLocaleDateString(isArabic ? "ar-DZ" : "fr-DZ", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  // Build line items for receipt
  const lineItems = sale.saleItems?.map((item) => ({
    productName: item.product_name_snapshot,
    quantity: item.quantity,
    unitPrice: formatCentimes(item.unit_sale_price_centimes, isArabic ? "ar-DZ" : "fr-DZ"),
    total: formatCentimes(item.line_total_centimes, isArabic ? "ar-DZ" : "fr-DZ"),
    cost: formatCentimes(item.unit_cost_price_centimes, isArabic ? "ar-DZ" : "fr-DZ"),
  })) || [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.modalBackground}>
        <View style={styles.receiptContainer}>
          {/* Business header */}
          <View style={styles.header}>
            <ThemedText type="title" style={{ textAlign: "center", marginBottom: 4 }}>
              {t("receipts:storeName")}
            </ThemedText>
            <ThemedText type="caption" style={{ textAlign: "center", color: Colors.light.textSecondary, marginBottom: 8 }}>
              {t("receipts:businessType")}
            </ThemedText>
            <ThemedText type="caption" style={{ textAlign: "center", color: Colors.light.textSecondary }}>
              {formattedDate}
            </ThemedText>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Sale items */}
          <ScrollView style={styles.scrollView}>
            {lineItems.length > 0 && (
              <View style={styles.itemsSection}>
                <ThemedText type="body" style={{ marginBottom: 8, fontWeight: "600" }}>
                  {t("receipt.items")}
                </ThemedText>
                {lineItems.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemDetails}>
                      <ThemedText type="body" style={{ flex: 1 }}>
                        {item.productName}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: Colors.light.textSecondary, marginTop: 2 }}>
                        {item.quantity}×
                      </ThemedText>
                    </View>
                    <View style={styles.itemPrices}>
                      <ThemedText type="caption" style={{ color: "#1B6B3A", fontWeight: "600" }}>
                        {item.total}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: Colors.light.textSecondary, marginLeft: 8 }}>
                        {item.unitPrice} {t("money")}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Totals section */}
          <View style={styles.totalsSection}>
            <View style={styles.row}>
              <ThemedText type="body" style={{ width: "60%" }}>
                {t("receipt.subtotal")}
              </ThemedText>
              <ThemedText type="body" style={{ textAlign: "right", width: "40%" }}>
                {formatCentimes(subtotal)}
              </ThemedText>
            </View>

            {discount > 0 && (
              <View style={styles.row}>
                <ThemedText type="body" style={{ width: "60%" }}>
                  {t("receipt.discount")}
                </ThemedText>
                <ThemedText type="body" style={{ textAlign: "right", color: Colors.light.warning, width: "40%" }}>
                  -{formatCentimes(discount)}
                </ThemedText>
              </View>
            )}

            <View style={styles.row}>
              <ThemedText type="body" style={{ fontWeight: "600", width: "60%" }}>
                {t("receipt.total")}
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600", color: "#1B6B3A", textAlign: "right", width: "40%" }}>
                {formatCentimes(total)}
              </ThemedText>
            </View>
          </View>

          {/* Payment method and change */}
          <View style={{ ...styles.paymentSection, marginTop: 16 }}>
            <View style={styles.row}>
              <ThemedText type="body" style={{ width: "60%" }}>
                {t("receipt.paymentMethod")}
              </ThemedText>
              <ThemedText type="body" style={{ textAlign: "right", width: "40%" }}>
                {t(`sell.${sale.payment_method}`)}
              </ThemedText>
            </View>

            {sale.payment_method !== "partial" && amountPaid > 0 && (
              <View style={styles.row}>
                <ThemedText type="body" style={{ width: "60%" }}>
                  {t("receipt.amountPaid")}
                </ThemedText>
                <ThemedText type="body" style={{ textAlign: "right", width: "40%" }}>
                  {formatCentimes(amountPaid)}
                </ThemedText>
              </View>
            )}

            {change > 0 && (
              <View style={styles.row}>
                <ThemedText type="body" style={{ fontWeight: "600", width: "60%" }}>
                  {t("receipt.change")}
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600", color: "#1B6B3A", textAlign: "right", width: "40%" }}>
                  {formatCentimes(change)}
                </ThemedText>
              </View>
            )}

            {profit !== undefined && profit >= 0 && (
              <View style={{ ...styles.row, marginTop: 8 }}>
                <ThemedText type="body" style={{ fontWeight: "600", color: "#1B6B3A", width: "60%" }}>
                  {t("receipt.profit")}
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600", color: "#1B6B3A", textAlign: "right", width: "40%" }}>
                  {formatCentimes(profit)}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  receiptContainer: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    margin: 12,
  },
  scrollView: {
    flexGrow: 1,
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 4,
  },
  itemDetails: {
    flex: 1,
  },
  itemPrices: {
    alignItems: "flex-end",
    flexDirection: "row",
  },
  itemTotal: {
    fontWeight: "600",
    color: "#1B6B3A",
  },
  itemUnitPrice: {
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  totalsSection: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paymentSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
});