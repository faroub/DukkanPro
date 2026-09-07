import { SymbolView } from "expo-symbols";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  BorderRadius,
  Colors,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { Sale } from "@/types/entities";
import { formatCentimes } from "@/utils/money";
import { useTranslation } from "react-i18next";

interface ReceiptPreviewProps {
  visible: boolean;
  onRequestClose: () => void;
  onNewSale: () => void;
  sale: Sale | null;
  t?: any;
}

export function ReceiptPreview({
  visible,
  onRequestClose,
  onNewSale,
  sale,
}: ReceiptPreviewProps) {
  const { t } = useTranslation();

  if (!sale) {
    return null;
  }

  const dateStr = new Date(sale.sold_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Success Checkmark Aura */}
          <View style={styles.successHeader}>
            <View style={styles.iconCircle}>
              <SymbolView
                name={{
                  ios: "checkmark.circle.fill" as any,
                  android: "check_circle" as any,
                  web: "check_circle" as any,
                }}
                size={54}
                tintColor={Colors.light.primary}
              />
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>Caisse Enregistrée</Text>
            </View>
            <ThemedText style={styles.successTitle}>Vente terminée !</ThemedText>
            <ThemedText style={styles.successSubtitle}>
              Ticket #{sale.id || "REC"} validé avec succès
            </ThemedText>
          </View>

          {/* Thermal Receipt Ticket Simulation Card */}
          <View style={styles.receiptCard}>
            <View style={styles.receiptTopStripe} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.receiptScroll}
            >
              {/* Store & Time Header */}
              <View style={styles.shopInfoRow}>
                <View style={styles.shopIcon}>
                  <SymbolView
                    name={{
                      ios: "storefront.fill" as any,
                      android: "storefront" as any,
                      web: "storefront" as any,
                    }}
                    size={20}
                    tintColor={Colors.light.primary}
                  />
                </View>
                <View style={styles.shopMeta}>
                  <ThemedText style={styles.shopName}>Supérette</ThemedText>
                  <ThemedText style={styles.shopDate}>
                    Aujourd'hui, {dateStr}
                  </ThemedText>
                </View>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>Payé</Text>
                </View>
              </View>

              <View style={styles.dashedLine} />

              {/* Items Table */}
              <View style={styles.itemsSection}>
                {sale.saleItems?.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <ThemedText style={styles.itemName} numberOfLines={1}>
                        {item.product_name_snapshot}
                      </ThemedText>
                      <ThemedText style={styles.itemDetail}>
                        {item.quantity} x {formatCentimes(item.unit_sale_price_centimes)}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.itemLineTotal}>
                      {formatCentimes(item.line_total_centimes)}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.dashedLine} />

              {/* Totals */}
              <View style={styles.totalsSection}>
                <View style={styles.totalsRow}>
                  <ThemedText style={styles.totalRowLabel}>Sous-total</ThemedText>
                  <ThemedText style={styles.totalRowValue}>
                    {formatCentimes(sale.subtotal_centimes)}
                  </ThemedText>
                </View>

                {sale.discount_centimes > 0 && (
                  <View style={styles.totalsRow}>
                    <ThemedText style={styles.totalRowLabel}>Remise</ThemedText>
                    <ThemedText style={[styles.totalRowValue, styles.discountText]}>
                      -{formatCentimes(sale.discount_centimes)}
                    </ThemedText>
                  </View>
                )}

                <View style={[styles.totalsRow, styles.grandTotalRow]}>
                  <ThemedText style={styles.grandTotalLabel}>
                    Total Réglé
                  </ThemedText>
                  <Text style={styles.grandTotalValue}>
                    {formatCentimes(sale.total_centimes)}
                  </Text>
                </View>

                <View style={styles.totalsRow}>
                  <ThemedText style={styles.totalRowLabel}>
                    Mode de paiement
                  </ThemedText>
                  <ThemedText style={styles.totalRowValue}>
                    {sale.payment_method === "cash"
                      ? "Espèces"
                      : sale.payment_method === "credit"
                      ? "Dette (Carnet)"
                      : "Carte"}
                  </ThemedText>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Action CTAs */}
          <View style={styles.actionButtons}>
            <PrimaryButton title="Nouvelle vente" onPress={onNewSale} />
            <Pressable
              onPress={onRequestClose}
              style={styles.closeBtn}
              accessibilityLabel="Fermer le reçu"
            >
              <ThemedText style={styles.closeBtnText}>Fermer</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: ComponentDimensions.screenPadding,
  },
  container: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  successHeader: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: 4,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  statusPillText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.primary,
    textTransform: "uppercase",
  },
  successTitle: {
    ...Typography.heading2,
    color: Colors.light.textPrimary,
  },
  successSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  receiptCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxHeight: 280,
    position: "relative",
    overflow: "hidden",
    ...Shadows.sm,
  },
  receiptTopStripe: {
    height: 3,
    backgroundColor: Colors.light.primary,
  },
  receiptScroll: {
    padding: Spacing.md,
  },
  shopInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  shopIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  shopMeta: {
    flex: 1,
  },
  shopName: {
    ...Typography.label,
    color: Colors.light.textPrimary,
  },
  shopDate: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  paidBadge: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  paidBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  dashedLine: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    borderStyle: "dashed",
    marginVertical: Spacing.sm,
  },
  itemsSection: {
    gap: Spacing.xs,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemName: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  itemDetail: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  itemLineTotal: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  totalsSection: {
    gap: 4,
  },
  totalsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalRowLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  totalRowValue: {
    ...Typography.caption,
    color: Colors.light.textPrimary,
    fontWeight: "600",
  },
  discountText: {
    color: Colors.light.warning,
  },
  grandTotalRow: {
    paddingTop: 4,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  grandTotalLabel: {
    ...Typography.label,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  grandTotalValue: {
    ...Typography.moneySmall,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  actionButtons: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  closeBtn: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  closeBtnText: {
    ...Typography.label,
    color: Colors.light.textSecondary,
  },
});
