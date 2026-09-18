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
import { useTheme } from "@/hooks/use-theme";
import { formatCentimes } from "@/utils/money";
import { useTranslation } from "react-i18next";
import { useCustomers } from "@/hooks/useCustomers";

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
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "electronic" | "credit" | "partial"
  >("cash");
  const [note, setNote] = useState<string>("");
  const [amountReceived, setAmountReceived] = useState<number>(cartTotal);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  // Fetch real customers from SQLite
  const { customers } = useCustomers({ onlyActive: true });

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
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
          {/* Header Bar */}
          <View style={styles.topBar}>
            <View style={[styles.grabHandle, { backgroundColor: theme.border }]} />
            <Pressable
              onPress={onRequestClose}
              style={[styles.closeBtn, { backgroundColor: theme.backgroundElement }]}
              hitSlop={8}
            >
              <SymbolView
                name={{
                  ios: "xmark" as any,
                  android: "close" as any,
                  web: "close" as any,
                }}
                size={18}
                tintColor={theme.textSecondary}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Total Due Green Card */}
            <View style={[styles.totalCard, { backgroundColor: theme.primaryLight }]}>
              <View style={styles.totalCardLeft}>
                <Text style={[styles.totalCardLabel, { color: theme.primary }]}>
                  {t("sales:totalToPay", { defaultValue: "Montant total à payer" })}
                </Text>
                <Text style={[styles.totalCardAmount, { color: theme.textPrimary }]}>
                  {formatCentimes(cartTotal)}
                </Text>
              </View>
              <View style={[styles.totalCardBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.totalCardBadgeText, { color: "#FFFFFF" }]}>
                  {t("sales:cartValidated", { defaultValue: "Panier validé" })}
                </Text>
              </View>
            </View>

            {/* Customer Ledger Association Card */}
            <View style={[styles.customerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.customerHeader}>
                <View style={styles.customerHeaderLeft}>
                  <SymbolView
                    name={{
                      ios: "person.crop.circle" as any,
                      android: "person" as any,
                      web: "person" as any,
                    }}
                    size={16}
                    tintColor={theme.textSecondary}
                  />
                  <ThemedText style={[styles.customerCardTitle, { color: theme.textSecondary }]}>
                    {t("customers:carnetDette", { defaultValue: "Client / Carnet Dette" })}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => setShowCustomerPicker((prev) => !prev)}
                  style={[styles.changeCustomerBtn, { backgroundColor: theme.backgroundElement }]}
                >
                  <Text style={[styles.changeCustomerBtnText, { color: theme.primary }]}>
                    {selectedCustomer
                      ? t("common:edit", { defaultValue: "Changer" })
                      : t("common:select", { defaultValue: "Sélectionner" })}
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.customerSelectedRow, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.customerAvatar, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.customerAvatarText, { color: theme.primary }]}>
                    {selectedCustomer ? selectedCustomer.name[0] : "P"}
                  </Text>
                </View>
                <View style={styles.customerInfo}>
                  <ThemedText style={[styles.customerName, { color: theme.textPrimary }]}>
                    {selectedCustomer
                      ? selectedCustomer.name
                      : t("sales:walkInCustomer", { defaultValue: "Client au comptoir (Passant)" })}
                  </ThemedText>
                  <ThemedText style={[styles.customerDebt, { color: theme.textSecondary }]}>
                    {selectedCustomer
                      ? `${t("customers:debtBalance", { defaultValue: "Solde carnet" })}: ${formatCentimes(selectedCustomer.outstandingBalance || 0)}`
                      : t("sales:directPayment", { defaultValue: "Paiement direct sans carnet" })}
                  </ThemedText>
                </View>
              </View>

              {/* Customer Selector Dropdown if active */}
              {showCustomerPicker && (
                <View style={[styles.customerPickerList, { borderTopColor: theme.borderLight }]}>
                  <Pressable
                    style={styles.customerPickerItem}
                    onPress={() => {
                      setCustomerId(null);
                      setShowCustomerPicker(false);
                    }}
                  >
                    <ThemedText style={[styles.customerPickerName, { color: theme.textPrimary }]}>
                      {t("sales:walkInCustomer", { defaultValue: "Passant (Sans carnet)" })}
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
                      <ThemedText style={[styles.customerPickerName, { color: theme.textPrimary }]}>
                        {c.name}
                      </ThemedText>
                      <ThemedText style={[styles.customerPickerDebt, { color: theme.warning }]}>
                        {formatCentimes(c.outstandingBalance || 0)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Payment Method Selector with Cards matching Stitch design */}
            <View style={styles.methodSection}>
              <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                {t("receipt:payment_method", { defaultValue: "Mode de règlement" })}
              </ThemedText>

              <View style={styles.methodGrid}>
                {/* Cash */}
                <Pressable
                  onPress={() => setPaymentMethod("cash")}
                  style={[
                    styles.methodBtn,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    paymentMethod === "cash" && [styles.methodBtnSelected, { backgroundColor: theme.primaryLight, borderColor: theme.primary }],
                  ]}
                >
                  <View style={[styles.paymentIcon, { backgroundColor: theme.primaryLight }]}>
                    <SymbolView
                      name={{
                        ios: "banknote" as any,
                        android: "payments" as any,
                        web: "payments" as any,
                      }}
                      size={22}
                      tintColor={
                        paymentMethod === "cash"
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.paymentText}>
                    <ThemedText style={[styles.methodBtnText, { color: theme.textPrimary }, paymentMethod === "cash" && [styles.methodBtnTextSelected, { color: theme.primary }]]}>
                      {t("receipt:cash", { defaultValue: "Espèces" })}
                    </ThemedText>
                    <ThemedText style={[styles.methodSubLabel, { color: theme.textSecondary }]}>
                      {t("sales:payment_cash")}
                    </ThemedText>
                  </View>
                </Pressable>

                {/* Electronic */}
                <Pressable
                  onPress={() => setPaymentMethod("electronic")}
                  style={[
                    styles.methodBtn,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    paymentMethod === "electronic" && [styles.methodBtnSelected, { backgroundColor: theme.primaryLight, borderColor: theme.primary }],
                  ]}
                >
                  <View style={[styles.paymentIcon, { backgroundColor: theme.primaryLight }]}>
                    <SymbolView
                      name={{
                        ios: "creditcard" as any,
                        android: "credit_card" as any,
                        web: "credit_card" as any,
                      }}
                      size={22}
                      tintColor={
                        paymentMethod === "electronic"
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.paymentText}>
                    <ThemedText style={[styles.methodBtnText, { color: theme.textPrimary }, paymentMethod === "electronic" && [styles.methodBtnTextSelected, { color: theme.primary }]]}>
                      {t("receipt:electronic", { defaultValue: "Carte / CIB" })}
                    </ThemedText>
                    <ThemedText style={[styles.methodSubLabel, { color: theme.textSecondary }]}>
                      {t("sales:payment_electronic")}
                    </ThemedText>
                  </View>
                </Pressable>

                {/* Credit / Carnet Dette */}
                <Pressable
                  onPress={() => setPaymentMethod("credit")}
                  style={[
                    styles.methodBtn,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    paymentMethod === "credit" && [styles.methodBtnSelected, { backgroundColor: theme.primaryLight, borderColor: theme.primary }],
                  ]}
                >
                  <View style={[styles.paymentIcon, { backgroundColor: theme.primaryLight }]}>
                    <SymbolView
                      name={{
                        ios: "book.closed" as any,
                        android: "menu_book" as any,
                        web: "menu_book" as any,
                      }}
                      size={22}
                      tintColor={
                        paymentMethod === "credit"
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.paymentText}>
                    <ThemedText style={[styles.methodBtnText, { color: theme.textPrimary }, paymentMethod === "credit" && [styles.methodBtnTextSelected, { color: theme.primary }]]}>
                      {t("receipt:credit", { defaultValue: "Dette (Carnet)" })}
                    </ThemedText>
                    <ThemedText style={[styles.methodSubLabel, { color: theme.textSecondary }]}>
                      {t("sales:payment_credit")}
                    </ThemedText>
                  </View>
                </Pressable>

                {/* Partial Payment */}
                <Pressable
                  onPress={() => setPaymentMethod("partial")}
                  style={[
                    styles.methodBtn,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    paymentMethod === "partial" && [styles.methodBtnSelected, { backgroundColor: theme.primaryLight, borderColor: theme.primary }],
                  ]}
                >
                  <View style={[styles.paymentIcon, { backgroundColor: theme.primaryLight }]}>
                    <SymbolView
                      name={{
                        ios: "price_change" as any,
                        android: "price_change" as any,
                        web: "price_change" as any,
                      }}
                      size={22}
                      tintColor={
                        paymentMethod === "partial"
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.paymentText}>
                    <ThemedText style={[styles.methodBtnText, { color: theme.textPrimary }, paymentMethod === "partial" && [styles.methodBtnTextSelected, { color: theme.primary }]]}>
                      {t("receipt:partial", { defaultValue: "Versement partiel" })}
                    </ThemedText>
                    <ThemedText style={[styles.methodSubLabel, { color: theme.textSecondary }]}>
                      {t("sales:payment_partial")}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Cash Calculator (Shown when payment is cash) */}
            {paymentMethod === "cash" && (
              <View style={[styles.cashCalculatorCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cashInputRow}>
                  <ThemedText style={[styles.cashInputLabel, { color: theme.textPrimary }]}>
                    {t("sales:amountReceived", { defaultValue: "Montant reçu" })}
                  </ThemedText>
                  <View style={[styles.cashInputWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <TextInput
                      style={[styles.cashTextInput, { color: theme.textPrimary }]}
                      value={(amountReceived / 100).toString()}
                      onChangeText={(val) => {
                        const num = parseFloat(val.replace(/[^0-9.]/g, "")) || 0;
                        setAmountReceived(Math.round(num * 100));
                      }}
                      keyboardType="decimal-pad"
                    />
                    <Text style={[styles.currencySuffix, { color: theme.textSecondary }]}>DZD</Text>
                  </View>
                </View>

                {/* Quick bill chips */}
                <View style={styles.chipsRow}>
                  <Pressable
                    style={[styles.quickChip, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                    onPress={handleExactCash}
                  >
                    <Text style={[styles.quickChipText, { color: theme.textPrimary }]}>
                      {t("sales:exactAmount", { defaultValue: "Compte juste" })}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickChip, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                    onPress={() => handleQuickAddCash(50000)}
                  >
                    <Text style={[styles.quickChipText, { color: theme.textPrimary }]}>+500 DZD</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickChip, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                    onPress={() => handleQuickAddCash(100000)}
                  >
                    <Text style={[styles.quickChipText, { color: theme.textPrimary }]}>+1,000 DZD</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickChip, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                    onPress={() => handleQuickAddCash(200000)}
                  >
                    <Text style={[styles.quickChipText, { color: theme.textPrimary }]}>+2,000 DZD</Text>
                  </Pressable>
                </View>

                {/* Change Due Display */}
                <View style={[styles.changeDueRow, { backgroundColor: theme.surface, borderColor: theme.primaryLight }]}>
                  <ThemedText style={[styles.changeDueLabel, { color: theme.primary }]}>
                    {t("receipt:change_due", { defaultValue: "Monnaie à rendre" })}
                  </ThemedText>
                  <Text style={[styles.changeDueAmount, { color: theme.primary }]}>
                    {formatCentimes(changeDue)}
                  </Text>
                </View>
              </View>
            )}

            {/* Confirm CTA */}
            <View style={styles.ctaWrapper}>
              <PrimaryButton
                title={isSaving ? t("common:loading", { defaultValue: "Enregistrement..." }) : t("sales:confirmSale", { defaultValue: "Valider la vente" })}
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
    color: Colors.light.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalCardAmount: {
    ...Typography.moneyDisplay,
    fontSize: 26,
    color: Colors.light.textPrimary,
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
    color: Colors.light.textPrimary,
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
  paymentIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.primaryLight,
  },
  paymentText: {
    flex: 1,
  },
  methodSubLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 10,
    marginTop: 1,
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
    backgroundColor: Colors.light.surface,
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