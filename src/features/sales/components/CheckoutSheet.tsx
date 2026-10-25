/**
 * CheckoutSheet — POS payment and customer settlement modal.
 *
 * Contract:
 * - Live product prices and stock levels are re-validated against SQLite when the sheet opens
 *   and synchronously on-demand during checkout confirmation.
 * - Checkout calculations (subtotal, total, change due, underpayment debt) use live prices
 *   to ensure exact financial match between tender, total, and recorded sales.
 * - Prevents rapid double-tap duplicate sales via synchronous ref guards and blocks zero-item checkout creation.
 */

import { SymbolView } from "expo-symbols";
import { useCallback, useState, useEffect, useRef } from "react";
import {
  Alert,
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
import { formatCentimes, getCurrencySymbol } from "@/utils/money";
import { get as getBusinessProfile } from "@/database/repositories/businessProfileRepository";
import { getById as getProductById } from "@/database/repositories/productRepository";
import { useTranslation } from "react-i18next";
import { useCustomers } from "@/hooks/useCustomers";
import { useCartStoreHook } from "@/stores/cartStore";

interface CheckoutSheetProps {
  visible: boolean;
  onRequestClose: () => void;
  onCheckout: (paymentDetails: {
    method: "cash" | "electronic" | "mixed" | "partial" | "credit";
    amountPaid?: number;
    note?: string;
    customerId?: number;
    validatedItems?: Array<{
      productId: number;
      quantity: number;
      unitSalePriceCentimes: number;
    }>;
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
  const { items, discount } = useCartStoreHook();
  const { t, i18n } = useTranslation();

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "electronic" | "credit" | "partial"
  >("cash");
  const [note, setNote] = useState<string>("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const isConfirmingRef = useRef(false);

  // Live re-computed subtotal and validated items from SQLite
  const [liveSubtotal, setLiveSubtotal] = useState<number>(cartTotal);
  const [validatedItems, setValidatedItems] = useState<
    Array<{ productId: number; quantity: number; unitSalePriceCentimes: number }>
  >([]);

  useEffect(() => {
    if (!visible) {
      isConfirmingRef.current = false;
      setIsConfirming(false);
      return;
    }
    if (items.length === 0) return;

    let isMounted = true;
    (async () => {
      let sum = 0;
      const valItems: Array<{ productId: number; quantity: number; unitSalePriceCentimes: number }> = [];

      for (const item of items) {
        const liveProduct = await getProductById(item.product.id);
        const unitPrice = liveProduct?.sale_price_centimes ?? item.product.sale_price_centimes;
        sum += unitPrice * item.quantity;
        valItems.push({
          productId: item.product.id,
          quantity: item.quantity,
          unitSalePriceCentimes: unitPrice,
        });
      }

      if (isMounted) {
        setLiveSubtotal(sum);
        setValidatedItems(valItems);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [visible, items]);

  const displayTotal = Math.max(0, liveSubtotal - (discount || 0));
  const isValidating = visible && items.length > 0 && validatedItems.length !== items.length;

  const [amountReceived, setAmountReceived] = useState<number>(displayTotal);
  const [partialAmount, setPartialAmount] = useState<number>(
    Math.round(displayTotal / 2),
  );

  useEffect(() => {
    if (visible) {
      setAmountReceived(displayTotal);
      setPartialAmount(Math.round(displayTotal / 2));
    }
  }, [visible, displayTotal]);

  // Fetch real customers from SQLite
  const { customers } = useCustomers({ onlyActive: true });

  const [storeCurrency, setStoreCurrency] = useState<string>("DZD");

  useEffect(() => {
    getBusinessProfile().then((p) => {
      if (p?.currency) setStoreCurrency(p.currency);
    });
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const changeDue = Math.max(0, amountReceived - displayTotal);
  const remainingAfterPartial = Math.max(0, displayTotal - partialAmount);

  const handleQuickAddCash = (centimesToAdd: number) => {
    setAmountReceived((prev) => prev + centimesToAdd);
  };

  const handleExactCash = () => {
    setAmountReceived(displayTotal);
  };

  const handleConfirm = useCallback(async () => {
    // Synchronously check ref to block rapid double-taps before React's re-render
    if (isSaving || isConfirmingRef.current || items.length === 0) return;

    isConfirmingRef.current = true;
    setIsConfirming(true);

    try {
      // Re-validate live stock and price for all items in cart synchronously on demand
      const checkoutItems: Array<{
        productId: number;
        quantity: number;
        unitSalePriceCentimes: number;
      }> = [];

      let currentLiveSubtotal = 0;

      for (const item of items) {
        const liveProduct = await getProductById(item.product.id);
        if (!liveProduct || !liveProduct.is_active) {
          Alert.alert(
            t("common:error", { defaultValue: "Error" }),
            t("products:productNotAvailable", {
              name: item.product.name,
              defaultValue: `'${item.product.name}' is no longer available in the catalogue.`,
            }),
          );
          isConfirmingRef.current = false;
          setIsConfirming(false);
          return;
        }

        if ((liveProduct.stock_quantity || 0) < item.quantity) {
          Alert.alert(
            t("common:confirmTitle", { defaultValue: "Insufficient Stock" }),
            t("products:insufficientStockMessage", {
              name: liveProduct.name,
              available: liveProduct.stock_quantity,
              requested: item.quantity,
              defaultValue: `Insufficient stock for '${liveProduct.name}'. Available: ${liveProduct.stock_quantity}, requested: ${item.quantity}`,
            }),
          );
          isConfirmingRef.current = false;
          setIsConfirming(false);
          return;
        }

        const unitPrice = liveProduct.sale_price_centimes;
        currentLiveSubtotal += unitPrice * item.quantity;

        checkoutItems.push({
          productId: liveProduct.id,
          quantity: item.quantity,
          unitSalePriceCentimes: unitPrice,
        });
      }

      if (checkoutItems.length === 0) {
        Alert.alert(
          t("common:error", { defaultValue: "Error" }),
          t("sales:emptyCartError", {
            defaultValue: "Cannot process checkout for an empty cart.",
          }),
        );
        isConfirmingRef.current = false;
        setIsConfirming(false);
        return;
      }

      const liveTotal = Math.max(0, currentLiveSubtotal - (discount || 0));

      const effectiveAmountPaid =
        paymentMethod === "cash"
          ? amountReceived
          : paymentMethod === "partial"
            ? partialAmount
            : paymentMethod === "credit"
              ? 0
              : liveTotal;

      const remaining = Math.max(0, liveTotal - effectiveAmountPaid);

      if ((paymentMethod === "credit" || paymentMethod === "partial" || remaining > 0) && !customerId) {
        Alert.alert(
          t("common:confirmTitle", { defaultValue: "Customer Required" }),
          t("sales:customerRequiredForDebt", {
            defaultValue: "Please select a customer to record partial payment or debt.",
          }),
        );
        setShowCustomerPicker(true);
        isConfirmingRef.current = false;
        setIsConfirming(false);
        return;
      }

      onCheckout({
        method: paymentMethod,
        amountPaid: effectiveAmountPaid,
        note,
        customerId: customerId || undefined,
        validatedItems: checkoutItems,
      });
    } catch (err) {
      console.error("Confirm checkout error:", err);
      isConfirmingRef.current = false;
      setIsConfirming(false);
    }
  }, [items, isSaving, paymentMethod, amountReceived, partialAmount, discount, note, customerId, onCheckout, t]);

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
                  {formatCentimes(displayTotal)}
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
                    <Text style={[styles.currencySuffix, { color: theme.textSecondary }]}>{getCurrencySymbol(storeCurrency, i18n.language)}</Text>
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
                    <Text style={[styles.quickChipText, { color: theme.textPrimary }]}>+500 {getCurrencySymbol(storeCurrency, i18n.language)}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickChip, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                    onPress={() => handleQuickAddCash(100000)}
                  >
                    <Text style={[styles.quickChipText, { color: theme.textPrimary }]}>+1,000 {getCurrencySymbol(storeCurrency, i18n.language)}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickChip, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                    onPress={() => handleQuickAddCash(200000)}
                  >
                    <Text style={[styles.quickChipText, { color: theme.textPrimary }]}>+2,000 {getCurrencySymbol(storeCurrency, i18n.language)}</Text>
                  </Pressable>
                </View>

                {/* Change Due Display */}
                <View style={[styles.changeDueRow, { backgroundColor: theme.surface, borderColor: theme.primaryLight }]}>
                  <ThemedText style={[styles.changeDueLabel, { color: theme.primary }]}>
                    {t("receipt:change_due", { defaultValue: "Monnaie à rendre" })}
                  </ThemedText>
                  <Text style={[styles.changeDueAmount, { color: theme.primary }]}>
                    {formatCentimes(changeDue, i18n.language, storeCurrency)}
                  </Text>
                </View>
              </View>
            )}

            {/* Partial Payment Calculator (Shown when payment is partial) */}
            {paymentMethod === "partial" && (
              <View
                style={[
                  styles.cashCalculatorCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.cashInputRow}>
                  <ThemedText
                    style={[styles.cashInputLabel, { color: theme.textPrimary }]}
                  >
                    {t("sales:amountReceived", {
                      defaultValue: "Montant reçu",
                    })}
                  </ThemedText>
                  <View
                    style={[
                      styles.cashInputWrapper,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.cashTextInput, { color: theme.textPrimary }]}
                      value={(partialAmount / 100).toString()}
                      onChangeText={(val) => {
                        const num =
                          parseFloat(val.replace(/[^0-9.]/g, "")) || 0;
                        setPartialAmount(Math.round(num * 100));
                      }}
                      keyboardType="decimal-pad"
                    />
                    <Text
                      style={[styles.currencySuffix, { color: theme.textSecondary }]}
                    >
                      {getCurrencySymbol(storeCurrency, i18n.language)}
                    </Text>
                  </View>
                </View>

                {/* Remaining Balance Display */}
                <View
                  style={[
                    styles.changeDueRow,
                    { backgroundColor: theme.surface, borderColor: theme.warning },
                  ]}
                >
                  <ThemedText
                    style={[styles.changeDueLabel, { color: theme.warning }]}
                  >
                    {t("sales:remainingBalance", {
                      defaultValue: "Solde restant",
                    })}
                  </ThemedText>
                  <Text style={[styles.changeDueAmount, { color: theme.warning }]}>
                    {formatCentimes(remainingAfterPartial)}
                  </Text>
                </View>
              </View>
            )}

            {/* Confirm CTA */}
            <View style={styles.ctaWrapper}>
              <PrimaryButton
                title={
                  isSaving || isConfirming
                    ? t("common:loading", { defaultValue: "Enregistrement..." })
                    : t("sales:confirmSale", { defaultValue: "Valider la vente" })
                }
                onPress={handleConfirm}
                disabled={isSaving || isConfirming || isValidating || items.length === 0}
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
