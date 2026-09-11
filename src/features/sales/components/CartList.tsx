import { SymbolView } from "expo-symbols";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useState } from "react";
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
import { formatCentimes } from "@/utils/money";
import { useTranslation } from "react-i18next";
import { CartItem } from "./CartItem";

interface CartListProps {
  items: Array<{ product: any; quantity: number }>;
  onRemove: (productId: number) => void;
  onClearCart?: () => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onPreserveCartToggle?: (value: boolean) => void;
  preserveCart?: boolean;
  subtotal: number;
  discount: number;
  total: number;
  setDiscount: (value: number) => void;
  onCheckout?: () => void;
  onClose?: () => void;
}

export function CartList({
  items,
  onRemove,
  onClearCart,
  onUpdateQuantity,
  subtotal,
  discount,
  total,
  onCheckout,
  onClose,
}: CartListProps) {
  const { t } = useTranslation();

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "electronic" | "credit"
  >("cash");

  return (
    <View style={styles.container}>
      {/* Grab Handle */}
      <View style={styles.grabHandleRow}>
        <View style={styles.grabHandle} />
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.headerTitle}>Panier actif</ThemedText>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {totalCount} {totalCount === 1 ? "article" : "articles"}
            </Text>
          </View>
        </View>

        {onClose && (
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <SymbolView
              name={{
                ios: "xmark" as any,
                android: "close" as any,
                web: "close" as any,
              }}
              size={18}
              tintColor={Colors.light.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id.toString()}
        renderItem={({ item }) => (
          <CartItem
            product={item.product}
            quantity={item.quantity}
            onRemove={onRemove}
            onUpdateQuantity={onUpdateQuantity}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={styles.footerSection}>
            {/* Price Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Sous-total</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {formatCentimes(subtotal)}
                </ThemedText>
              </View>

              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Remise</ThemedText>
                  <ThemedText style={[styles.summaryValue, styles.discountText]}>
                    -{formatCentimes(discount)}
                  </ThemedText>
                </View>
              )}

              <View style={styles.divider} />

              <View style={[styles.summaryRow, styles.totalRow]}>
                <ThemedText style={styles.totalLabel}>Total net à payer</ThemedText>
                <ThemedText style={styles.totalValue}>
                  {formatCentimes(total)}
                </ThemedText>
              </View>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.paymentMethodSection}>
              <ThemedText style={styles.paymentLabel}>Mode de règlement</ThemedText>
              <View style={styles.paymentGrid}>
                {/* Cash option */}
                <Pressable
                  onPress={() => setPaymentMethod("cash")}
                  style={[
                    styles.paymentCard,
                    paymentMethod === "cash" && styles.paymentCardSelected,
                  ]}
                >
                  <View style={styles.paymentIconContainer}>
                    <SymbolView
                      name={{
                        ios: "banknote" as any,
                        android: "payments" as any,
                        web: "payments" as any,
                      }}
                      size={22}
                      tintColor={
                        paymentMethod === "cash"
                          ? Colors.light.primary
                          : Colors.light.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.paymentDetails}>
                    <ThemedText style={styles.paymentLabelText}>Espèces</ThemedText>
                    <ThemedText style={styles.paymentSubLabel}>Règlement direct au comptoir</ThemedText>
                  </View>
                  <View style={styles.paymentRadio}>
                    <SymbolView
                      name={{
                        ios: "check" as any,
                        android: "check" as any,
                        web: "check" as any,
                      }}
                      size={14}
                      tintColor={Colors.light.primary}
                    />
                  </View>
                </Pressable>

                {/* Electronic option */}
                <Pressable
                  onPress={() => setPaymentMethod("electronic")}
                  style={[
                    styles.paymentCard,
                    paymentMethod === "electronic" && styles.paymentCardSelected,
                  ]}
                >
                  <View style={styles.paymentIconContainer}>
                    <SymbolView
                      name={{
                        ios: "creditcard" as any,
                        android: "credit_card" as any,
                        web: "credit_card" as any,
                      }}
                      size={22}
                      tintColor={
                        paymentMethod === "electronic"
                          ? Colors.light.primary
                          : Colors.light.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.paymentDetails}>
                    <ThemedText style={styles.paymentLabelText}>Carte / CIB</ThemedText>
                    <ThemedText style={styles.paymentSubLabel}>Terminal TPE ou code QR</ThemedText>
                  </View>
                  <View style={styles.paymentRadio}>
                    <SymbolView
                      name={{
                        ios: "check" as any,
                        android: "check" as any,
                        web: "check" as any,
                      }}
                      size={14}
                      tintColor={Colors.light.surface}
                    />
                  </View>
                </Pressable>

                {/* Credit option */}
                <Pressable
                  onPress={() => setPaymentMethod("credit")}
                  style={[
                    styles.paymentCard,
                    paymentMethod === "credit" && styles.paymentCardSelected,
                  ]}
                >
                  <View style={styles.paymentIconContainer}>
                    <SymbolView
                      name={{
                        ios: "book.closed" as any,
                        android: "menu_book" as any,
                        web: "menu_book" as any,
                      }}
                      size={22}
                      tintColor={
                        paymentMethod === "credit"
                          ? Colors.light.primary
                          : Colors.light.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.paymentDetails}>
                    <ThemedText style={styles.paymentLabelText}>Dette (Carnet)</ThemedText>
                    <ThemedText style={styles.paymentSubLabel}>Porté au solde du client</ThemedText>
                  </View>
                  <View style={styles.paymentRadio}>
                    <SymbolView
                      name={{
                        ios: "check" as any,
                        android: "check" as any,
                        web: "check" as any,
                      }}
                      size={14}
                      tintColor={Colors.light.surface}
                    />
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionButtons}>
              {onCheckout && (
                <PrimaryButton
                  title={`Payer • ${formatCentimes(total)}`}
                  onPress={onCheckout}
                />
              )}

              <Pressable
                onPress={() => {
                  if (onClearCart) {
                    onClearCart();
                  } else {
                    items.forEach((item) => onRemove(item.product.id));
                  }
                }}
                style={styles.clearBtn}
                accessibilityLabel="Clear cart"
              >
                <SymbolView
                  name={{
                    ios: "trash" as any,
                    android: "delete" as any,
                    web: "delete" as any,
                  }}
                  size={16}
                  tintColor={Colors.light.destructive}
                />
                <Text style={styles.clearBtnText}>Vider le panier</Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: "85%",
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingBottom: Spacing.xl,
    ...Shadows.lg,
  },
  grabHandleRow: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: Spacing.md,
  },
  footerSection: {
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  discountText: {
    color: Colors.light.warning,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 2,
  },
  totalRow: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    marginTop: Spacing.md,
  },
  totalLabel: {
    ...Typography.label,
    fontSize: 16,
    color: Colors.light.textPrimary,
  },
  totalValue: {
    ...Typography.moneyDisplay,
    fontSize: 22,
    color: Colors.light.primary,
    fontWeight: "700",
  },
  actionButtons: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  clearBtnText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.light.destructive,
  },

  /* Payment Method Section Styles */
  paymentMethodSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  paymentLabel: {
    ...Typography.label,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    fontSize: 11,
    marginBottom: Spacing.sm,
  },
  paymentGrid: {
    gap: Spacing.sm,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    alignItems: "center",
    gap: 6,
  },
  paymentCardSelected: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentLabelText: {
    ...Typography.label,
    color: Colors.light.textPrimary,
    fontWeight: "600",
  },
  paymentSubLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  paymentRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
});