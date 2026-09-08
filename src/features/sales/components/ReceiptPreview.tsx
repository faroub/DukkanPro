import { SymbolView } from "expo-symbols";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { BorderRadius, Colors, ComponentDimensions, Shadows, Spacing, Typography } from "@/constants/theme";
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
  const { t } = useTranslation();
  const changeDue = Math.max(0, amountReceived - cartTotal);

  const totalCentimes = saleItems.reduce(
    (sum, item) => sum + item.sale_price_centimes * item.quantity,
    0
  );

  const handleConfirm = () => {
    onNewSale();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.receiptCard}>
          {/* Receipt Top Stripe */}
          <View style={styles.topStripe} />

          {/* Receipt Header with Checkmark */}
          <View style={styles.headerRow}>
            <View style={styles.checkmark}>
              <SymbolView
                name={{
                  ios: "checkmark.seal" as any,
                  android: "check_circle" as any,
                  web: "check_circle" as any,
                }}
                size={32}
                tintColor={Colors.light.primary}
              />
            </View>
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerTitle}>
                {t("receipt.printed") || "Caisse Enregistrée"}
              </ThemedText>
              <ThemedText style={styles.headerSubTitle}>
                {t("receipt.date") || new Date().toLocaleDateString("ar-DZ")}
              </ThemedText>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.itemsSection}>
            <ThemedText style={styles.itemsTitle}>
              {t("receipt.items") || "Articles"}
            </ThemedText>
            <FlatList
              data={saleItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <View style={styles.itemNameCol}>
                    <ThemedText style={styles.itemName}>
                      {item.name}
                    </ThemedText>
                  </View>
                  <View style={styles.itemQtyCol}>
                    <ThemedText style={styles.itemQty}>
                      {item.quantity}
                    </ThemedText>
                  </View>
                  <View style={styles.itemTotalCol}>
                    <Text style={styles.itemTotal}>
                      {formatCentimes(item.sale_price_centimes * item.quantity)}
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.itemList}
            />
          </View>

          {/* Subtotal, Discount, Grand Total */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>
                {t("receipt.subtotal") || "Sous-total"}
              </ThemedText>
              <Text style={styles.totalValue}>
                {formatCentimes(totalCentimes)}
              </Text>
            </View>

            {discountCentimes > 0 && (
              <View style={styles.discountRow}>
                <ThemedText style={styles.discountLabel}>
                  {t("receipt.discount") || "Remise"}
                </ThemedText>
                <Text style={styles.discountValue}>
                  -{formatCentimes(discountCentimes)}
                </Text>
              </View>
            )}

            <View style={styles.grandTotalRow}>
              <ThemedText style={styles.grandTotalLabel}>
                {t("receipt.grand_total") || "Total"}
              </ThemedText>
              <Text style={styles.grandTotalValue}>
                {formatCentimes(totalCentimes - discountCentimes)}
              </Text>
            </View>
          </View>

          {/* Payment Breakdown */}
          <View style={styles.paymentSection}>
            <ThemedText style={styles.paymentLabel}>
              {t("receipt.payment_method") || "Mode de paiement"}
            </ThemedText>
            <ThemedText style={styles.paymentValue}>
              {t(`receipt.${paymentMethod}`, {
                defaultValue: paymentMethod,
              })}
            </ThemedText>
          </View>

          {/* Change Due */}
          <View style={styles.changeDueRow}>
            <ThemedText style={styles.changeDueLabel}>
              {t("receipt.change_due") || "Monnaie à rendre"}
            </ThemedText>
            <Text style={styles.changeDueValue}>
              {formatCentimes(changeDue)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              onPress={onNewSale}
              style={styles.newSaleBtn}
              hitSlop={8}
            >
              <ThemedText style={styles.newSaleBtnText}>
                {t("receipt.new_sale") || "Nouvelle vente"}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={onRequestClose}
              style={styles.shareBtn}
              hitSlop={8}
            >
              <ThemedText style={styles.shareBtnText}>
                {t("receipt.share") || "Partager"}
              </ThemedText>
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
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  topStripe: {
    height: 3,
    backgroundColor: Colors.light.primary,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: ComponentDimensions.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  checkmark: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primaryLight,
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
    color: Colors.light.textPrimary,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubTitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  itemsSection: {
    padding: ComponentDimensions.cardPadding,
  },
  itemsTitle: {
    ...Typography.label,
    color: Colors.light.textSecondary,
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
    borderBottomColor: Colors.light.borderLight,
  },
  itemNameCol: {
    flex: 1,
  },
  itemName: {
    ...Typography.body,
    color: Colors.light.textPrimary,
    fontSize: 14,
  },
  itemQtyCol: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  itemQty: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
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
    color: Colors.light.primary,
    fontWeight: "700",
    fontSize: 16,
    textAlign: "right",
  },
  totalsSection: {
    padding: ComponentDimensions.cardPadding,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
  },
  totalValue: {
    ...Typography.moneyDisplay,
    fontSize: 22,
    color: Colors.light.primary,
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
    color: Colors.light.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
  },
  discountValue: {
    ...Typography.moneySmall,
    color: Colors.light.warning,
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
    borderTopColor: Colors.light.borderLight,
  },
  grandTotalLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
  },
  grandTotalValue: {
    ...Typography.moneyDisplay,
    fontSize: 24,
    color: Colors.light.primary,
    fontWeight: "700",
    textAlign: "right",
  },
  paymentSection: {
    padding: ComponentDimensions.cardPadding,
    marginVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  paymentLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  paymentValue: {
    ...Typography.body,
    color: Colors.light.textPrimary,
    fontSize: 16,
  },
  changeDueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  changeDueLabel: {
    ...Typography.label,
    color: Colors.light.primaryDark,
  },
  changeDueValue: {
    ...Typography.moneySmall,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.primary,
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
    backgroundColor: Colors.light.backgroundElement,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  newSaleBtnText: {
    ...Typography.label,
    color: Colors.light.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtnText: {
    ...Typography.label,
    color: Colors.light.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
});