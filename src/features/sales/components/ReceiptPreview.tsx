import { SymbolView } from "expo-symbols";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, ComponentDimensions, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatCentimes } from "@/utils/money";
import { useTranslation } from "react-i18next";

interface SaleItem {
  id: number;
  name: string;
  quantity: number;
  sale_price_centimes: number;
}

interface ReceiptPreviewProps {
  visible: boolean;
  onRequestClose: () => void;
  onNewSale: () => void;
  saleItems: SaleItem[];
  cartTotal: number;
  discountCentimes: number;
  paymentMethod: "cash" | "electronic" | "mixed" | "credit" | "partial";
  amountReceived: number;
  customerName?: string | null;
  setCustomerId?: any;
  customerId?: number;
  t?: any;
}

export function ReceiptPreview({
  visible,
  onRequestClose,
  onNewSale,
  saleItems,
  cartTotal,
  discountCentimes,
  paymentMethod,
  amountReceived,
  customerName,
}: ReceiptPreviewProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const changeDue = Math.max(0, amountReceived - cartTotal);

  const formattedDate = new Date().toLocaleDateString(i18n.language || "fr", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalCentimes = saleItems.reduce(
    (sum, item) => sum + item.sale_price_centimes * item.quantity,
    0
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.receiptCard, { backgroundColor: theme.surface }]}>
          {/* Receipt Top Stripe */}
          <View style={[styles.topStripe, { backgroundColor: theme.primary }]} />

          {/* Receipt Header with Checkmark */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.checkmark, { backgroundColor: theme.primaryLight }]}>
              <SymbolView
                name={{
                  ios: "checkmark.seal" as any,
                  android: "check_circle" as any,
                  web: "check_circle" as any,
                }}
                size={32}
                tintColor={theme.primary}
              />
            </View>
            <View style={styles.headerInfo}>
              <ThemedText style={[styles.headerTitle, { color: theme.textPrimary }]}>
                {t("receipt.printed") || "Sale Recorded"}
              </ThemedText>
              <ThemedText style={[styles.headerSubTitle, { color: theme.textSecondary }]}>
                {formattedDate}
              </ThemedText>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.itemsSection}>
            <ThemedText style={[styles.itemsTitle, { color: theme.textSecondary }]}>
              {t("receipt.items") || "Articles"}
            </ThemedText>
            <FlatList
              data={saleItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={[styles.itemRow, { borderBottomColor: theme.borderLight }]}>
                  <View style={styles.itemNameCol}>
                    <ThemedText style={[styles.itemName, { color: theme.textPrimary }]}>
                      {item.name}
                    </ThemedText>
                  </View>
                  <View style={styles.itemQtyCol}>
                    <ThemedText style={[styles.itemQty, { color: theme.textSecondary }]}>
                      {item.quantity}
                    </ThemedText>
                  </View>
                  <View style={styles.itemTotalCol}>
                    <Text style={[styles.itemTotal, { color: theme.primary }]}>
                      {formatCentimes(item.sale_price_centimes * item.quantity, i18n.language as any)}
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.itemList}
            />
          </View>

          {/* Subtotal, Discount, Grand Total */}
          <View style={[styles.totalsSection, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
            <View style={styles.totalRow}>
              <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>
                {t("receipt.subtotal") || "Sous-total"}
              </ThemedText>
              <Text style={[styles.totalValue, { color: theme.primary }]}>
                {formatCentimes(totalCentimes, i18n.language as any)}
              </Text>
            </View>

            {discountCentimes > 0 && (
              <View style={styles.discountRow}>
                <ThemedText style={[styles.discountLabel, { color: theme.textSecondary }]}>
                  {t("receipt.discount") || "Remise"}
                </ThemedText>
                <Text style={[styles.discountValue, { color: theme.warning }]}>
                  -{formatCentimes(discountCentimes, i18n.language as any)}
                </Text>
              </View>
            )}

            <View style={[styles.grandTotalRow, { borderTopColor: theme.borderLight }]}>
              <ThemedText style={[styles.grandTotalLabel, { color: theme.textSecondary }]}>
                {t("receipt.grand_total") || "Total"}
              </ThemedText>
              <Text style={[styles.grandTotalValue, { color: theme.primary }]}>
                {formatCentimes(totalCentimes - discountCentimes, i18n.language as any)}
              </Text>
            </View>
          </View>

          {/* Payment Breakdown */}
          <View style={[styles.paymentSection, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
            <ThemedText style={[styles.paymentLabel, { color: theme.textSecondary }]}>
              {t("receipt.payment_method") || "Mode de paiement"}
            </ThemedText>
            <ThemedText style={[styles.paymentValue, { color: theme.textPrimary }]}>
              {t(`receipt.${paymentMethod}`, {
                defaultValue: paymentMethod,
              })}
            </ThemedText>
          </View>

          {/* Change Due */}
          <View style={[styles.changeDueRow, { backgroundColor: theme.primaryLight }]}>
            <ThemedText style={[styles.changeDueLabel, { color: theme.primary }]}>
              {t("receipt.change_due") || "Monnaie à rendre"}
            </ThemedText>
            <Text style={[styles.changeDueValue, { color: theme.primary }]}>
              {formatCentimes(changeDue, i18n.language as any)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              onPress={onNewSale}
              style={[styles.newSaleBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              hitSlop={8}
            >
              <ThemedText style={[styles.newSaleBtnText, { color: theme.textPrimary }]}>
                {t("receipt.new_sale") || "Nouvelle vente"}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={onRequestClose}
              style={[styles.shareBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              hitSlop={8}
            >
              <Text style={styles.shareBtnText}>
                {t("receipt.share") || "Partager"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  receiptCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  topStripe: {
    height: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: ComponentDimensions.cardPadding,
    borderBottomWidth: 1,
  },
  checkmark: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: ComponentDimensions.screenPadding,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.body,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubTitle: {
    ...Typography.caption,
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  itemsSection: {
    padding: ComponentDimensions.cardPadding,
  },
  itemsTitle: {
    ...Typography.label,
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  itemList: {
    gap: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  itemNameCol: {
    flex: 1,
  },
  itemName: {
    ...Typography.body,
    fontSize: 14,
  },
  itemQtyCol: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  itemQty: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
  },
  itemTotalCol: {
    alignItems: "flex-end",
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  itemTotal: {
    ...Typography.moneySmall,
    fontWeight: "700",
    fontSize: 16,
    textAlign: "right",
  },
  totalsSection: {
    padding: ComponentDimensions.cardPadding,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    ...Typography.caption,
    fontSize: 11,
    textTransform: "uppercase",
  },
  totalValue: {
    ...Typography.moneyDisplay,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "right",
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: Spacing.xs,
  },
  discountLabel: {
    ...Typography.caption,
    fontSize: 11,
    textTransform: "uppercase",
  },
  discountValue: {
    ...Typography.moneySmall,
    fontWeight: "600",
    fontSize: 16,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  grandTotalLabel: {
    ...Typography.caption,
    fontSize: 11,
    textTransform: "uppercase",
  },
  grandTotalValue: {
    ...Typography.moneyDisplay,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "right",
  },
  paymentSection: {
    padding: ComponentDimensions.cardPadding,
    marginVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  paymentLabel: {
    ...Typography.caption,
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  paymentValue: {
    ...Typography.body,
    fontSize: 16,
  },
  changeDueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  changeDueLabel: {
    ...Typography.label,
  },
  changeDueValue: {
    ...Typography.moneySmall,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "right",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: ComponentDimensions.cardPadding,
    gap: Spacing.md,
  },
  newSaleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  newSaleBtnText: {
    ...Typography.label,
    fontWeight: "600",
    fontSize: 14,
  },
  shareBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtnText: {
    ...Typography.label,
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
