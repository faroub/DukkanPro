import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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

interface CheckoutSheetProps {
  visible: boolean;
  onRequestClose: () => void;
  onCheckout: (paymentDetails: {
    method: "cash" | "electronic" | "mixed" | "partial" | "credit";
    amountPaid?: number;
    note?: string;
    customerId?: number;
  }) => void;
  cartTotal: number;
  isSaving: boolean;
  error?: string | null;
  setPaymentMethod?: any;
  customerId?: number;
  setCustomerId?: any;
  note?: string;
  setNote?: any;
  t?: any;
}

export function CheckoutSheet({
  visible,
  onRequestClose,
  onCheckout,
  cartTotal,
  isSaving,
  error,
}: CheckoutSheetProps) {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "electronic" | "credit" | "partial"
  >("cash");
  const [note, setNote] = useState<string>("");
  const [amountReceived, setAmountReceived] = useState<number>(cartTotal);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  // Sample customers list for debt / ledger assignment
  const [customers] = useState<
    Array<{ id: number; name: string; debtCentimes: number }>
  >([
    { id: 1, name: "Amine Kaci", debtCentimes: 11500 },
    { id: 2, name: "Ali Ramdani", debtCentimes: 45000 },
    { id: 3, name: "Fatima Zohra", debtCentimes: 0 },
  ]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const changeDue = Math.max(0, amountReceived - cartTotal);

  const handleQuickAddCash = (centimesToAdd: number) => {
    setAmountReceived((prev) => prev + centimesToAdd);
  };

  const handleExactCash = () => {
    setAmountReceived(cartTotal);
  };

  const handleConfirm = useCallback(() => {
    if ((paymentMethod === "credit" || paymentMethod === "partial") && !customerId) {
      setShowCustomerPicker(true);
      return;
    }

    onCheckout({
      method: paymentMethod,
      amountPaid: paymentMethod === "cash" ? amountReceived : undefined,
      note,
      customerId: customerId || undefined,
    });
  }, [paymentMethod, amountReceived, note, customerId, onCheckout]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.topBar}>
            <View style={styles.grabHandle} />
            <Pressable
              onPress={onRequestClose}
              style={styles.closeBtn}
              hitSlop={8}
            >
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
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Total Due Green Card */}
            <View style={styles.totalCard}>
              <View style={styles.totalCardLeft}>
                <Text style={styles.totalCardLabel}>Montant total à payer</Text>
                <Text style={styles.totalCardAmount}>
                  {formatCentimes(cartTotal)}
                </Text>
              </View>
              <View style={styles.totalCardBadge}>
                <Text style={styles.totalCardBadgeText}>Panier validé</Text>
              </View>
            </View>

            {/* Customer Ledger Association Card */}
            <View style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerHeaderLeft}>
                  <SymbolView
                    name={{
                      ios: "person.crop.circle" as any,
                      android: "person" as any,
                      web: "person" as any,
                    }}
                    size={16}
                    tintColor={Colors.light.textSecondary}
                  />
                  <ThemedText style={styles.customerCardTitle}>
                    Client / Carnet Dette
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => setShowCustomerPicker((prev) => !prev)}
                  style={styles.changeCustomerBtn}
                >
                  <Text style={styles.changeCustomerBtnText}>
                    {selectedCustomer ? "Changer" : "Sélectionner"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.customerSelectedRow}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {selectedCustomer ? selectedCustomer.name[0] : "P"}
                  </Text>
                </View>
                <View style={styles.customerInfo}>
                  <ThemedText style={styles.customerName}>
                    {selectedCustomer
                      ? selectedCustomer.name
                      : "Client au comptoir (Passant)"}
                  </ThemedText>
                  <ThemedText style={styles.customerDebt}>
                    {selectedCustomer
                      ? `Solde carnet: ${formatCentimes(selectedCustomer.debtCentimes)}`
                      : "Paiement direct sans carnet"}
                  </ThemedText>
                </View>
              </View>

              {/* Customer Selector Dropdown if active */}
              {showCustomerPicker && (
                <View style={styles.customerPickerList}>
                  <Pressable
                    style={styles.customerPickerItem}
                    onPress={() => {
                      setCustomerId(null);
                      setShowCustomerPicker(false);
                    }}
                  >
                    <ThemedText style={styles.customerPickerName}>
                      Passant (Sans carnet)
                    </ThemedText>
                  </Pressable>
                  {customers.map((c) => (
                    <Pressable
                      key={c.id}
                      style={styles.customerPickerItem}
                      onPress={() => {
                        setCustomerId(c.id);
                        setShowCustomerPicker(false);
                      }}
                    >
                      <ThemedText style={styles.customerPickerName}>
                        {c.name}
                      </ThemedText>
                      <ThemedText style={styles.customerPickerDebt}>
                        {formatCentimes(c.debtCentimes)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Payment Method Selector */}
            <View style={styles.methodSection}>
              <ThemedText style={styles.sectionTitle}>
                Mode de règlement
              </ThemedText>

              <View style={styles.methodGrid}>
                {/* Cash */}
                <Pressable
                  onPress={() => setPaymentMethod("cash")}
                  style={[
                    styles.methodBtn,
                    paymentMethod === "cash" && styles.methodBtnSelected,
                  ]}
                >
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
                  <Text
                    style={[
                      styles.methodBtnText,
                      paymentMethod === "cash" && styles.methodBtnTextSelected,
                    ]}
                  >
                    Espèces
                  </Text>
                </Pressable>

                {/* Credit / Carnet */}
                <Pressable
                  onPress={() => setPaymentMethod("credit")}
                  style={[
                    styles.methodBtn,
                    paymentMethod === "credit" && styles.methodBtnSelected,
                  ]}
                >
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
                  <Text
                    style={[
                      styles.methodBtnText,
                      paymentMethod === "credit" && styles.methodBtnTextSelected,
                    ]}
                  >
                    Dette (Carnet)
                  </Text>
                </Pressable>

                {/* Electronic / Card */}
                <Pressable
                  onPress={() => setPaymentMethod("electronic")}
                  style={[
                    styles.methodBtn,
                    paymentMethod === "electronic" && styles.methodBtnSelected,
                  ]}
                >
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
                  <Text
                    style={[
                      styles.methodBtnText,
                      paymentMethod === "electronic" && styles.methodBtnTextSelected,
                    ]}
                  >
                    Carte / CIB
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Cash Calculator (Shown when payment is cash) */}
            {paymentMethod === "cash" && (
              <View style={styles.cashCalculatorCard}>
                <View style={styles.cashInputRow}>
                  <ThemedText style={styles.cashInputLabel}>
                    Montant reçu
                  </ThemedText>
                  <View style={styles.cashInputWrapper}>
                    <TextInput
                      style={styles.cashTextInput}
                      value={(amountReceived / 100).toString()}
                      onChangeText={(val) => {
                        const num = parseFloat(val.replace(/[^0-9.]/g, "")) || 0;
                        setAmountReceived(Math.round(num * 100));
                      }}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.currencySuffix}>DZD</Text>
                  </View>
                </View>

                {/* Quick bill chips */}
                <View style={styles.chipsRow}>
                  <Pressable
                    style={styles.quickChip}
                    onPress={handleExactCash}
                  >
                    <Text style={styles.quickChipText}>Compte juste</Text>
                  </Pressable>
                  <Pressable
                    style={styles.quickChip}
                    onPress={() => handleQuickAddCash(50000)}
                  >
                    <Text style={styles.quickChipText}>+500 DZD</Text>
                  </Pressable>
                  <Pressable
                    style={styles.quickChip}
                    onPress={() => handleQuickAddCash(100000)}
                  >
                    <Text style={styles.quickChipText}>+1,000 DZD</Text>
                  </Pressable>
                  <Pressable
                    style={styles.quickChip}
                    onPress={() => handleQuickAddCash(200000)}
                  >
                    <Text style={styles.quickChipText}>+2,000 DZD</Text>
                  </Pressable>
                </View>

                {/* Change Due Display */}
                <View style={styles.changeDueRow}>
                  <ThemedText style={styles.changeDueLabel}>
                    Monnaie à rendre
                  </ThemedText>
                  <Text style={styles.changeDueAmount}>
                    {formatCentimes(changeDue)}
                  </Text>
                </View>
              </View>
            )}

            {/* Confirm CTA */}
            <View style={styles.ctaWrapper}>
              <PrimaryButton
                title={isSaving ? "Enregistrement..." : "Valider la vente"}
                onPress={handleConfirm}
                disabled={isSaving}
              />
            </View>
          </ScrollView>
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
  sheetContainer: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
    paddingBottom: Spacing.xl,
    ...Shadows.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    position: "relative",
  },
  grabHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
  },
  closeBtn: {
    position: "absolute",
    right: Spacing.md,
    top: Spacing.xs,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    gap: Spacing.md,
  },
  totalCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xl,
    padding: ComponentDimensions.cardPadding,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.md,
  },
  totalCardLeft: {
    gap: 2,
  },
  totalCardLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: "#A5F4B6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalCardAmount: {
    ...Typography.moneyDisplay,
    fontSize: 26,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  totalCardBadge: {
    backgroundColor: Colors.light.primaryDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  totalCardBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  customerCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  customerCardTitle: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
  },
  changeCustomerBtn: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  changeCustomerBtnText: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  customerSelectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  customerAvatarText: {
    ...Typography.label,
    color: Colors.light.primary,
    fontWeight: "700",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...Typography.label,
    color: Colors.light.textPrimary,
  },
  customerDebt: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  customerPickerList: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  customerPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: Spacing.xs,
  },
  customerPickerName: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  customerPickerDebt: {
    ...Typography.caption,
    color: Colors.light.warning,
    fontWeight: "600",
  },
  methodSection: {
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  methodGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    gap: 6,
    ...Shadows.sm,
  },
  methodBtnSelected: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  methodBtnText: {
    ...Typography.label,
    fontSize: 13,
    color: Colors.light.textPrimary,
  },
  methodBtnTextSelected: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  cashCalculatorCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  cashInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cashInputLabel: {
    ...Typography.label,
    color: Colors.light.textPrimary,
  },
  cashInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.light.backgroundElement,
    width: 140,
    height: 44,
  },
  cashTextInput: {
    flex: 1,
    ...Typography.moneySmall,
    color: Colors.light.textPrimary,
    textAlign: "right",
    paddingVertical: 0,
  },
  currencySuffix: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginLeft: 4,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  quickChip: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quickChipText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  changeDueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F4FAF6",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.primaryLight,
  },
  changeDueLabel: {
    ...Typography.label,
    color: Colors.light.primaryDark,
  },
  changeDueAmount: {
    ...Typography.moneySmall,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  ctaWrapper: {
    marginTop: Spacing.xs,
  },
});
