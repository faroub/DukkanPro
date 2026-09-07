import React, { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet, TextInput } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useTranslation } from "react-i18next";
import { useCartStoreHook } from "@/stores/cartStore";
import { formatCentimes } from "@/utils/money";
import { validateSale } from "@/services/sales/saleService";

interface SaleConfirmationProps {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: (paymentMethod: string, customerId?: number, note?: string) => void;
  cartTotal: number;
}

export function SaleConfirmation({
  visible,
  onRequestClose,
  onConfirm,
  cartTotal,
}: SaleConfirmationProps) {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'electronic' | 'mixed' | 'partial' | 'credit'>('cash');
  const [note, setNote] = useState<string>("");
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const { items, total, itemCount, subtotal, discount, preserveCart } = useCartStoreHook();

  // Customers for credit/partial selection - in a real app this would come from storage
  const [customers, setCustomers] = useState<Array<{ id: number; name: string }>>([
    { id: 1, name: "علی رمضان" },
    { id: 2, name: "سعاد أحمد" },
  ]);

  const handleConfirm = () => {
    const validation = validateSale(items.map((item) => ({ productId: item.product.id, quantity: item.quantity })), paymentMethod, new Map());

    if (!validation.valid) {
      // Show error - missing customer for credit/partial
      return;
    }

    // For partial payment, require amount paid - handled in checkout flow
    // For credit and partial, require customer
    if (paymentMethod === "credit" || paymentMethod === "partial") {
      if (!customerId) {
        setShowCustomerSelector(true);
        return;
      }
    }

    onConfirm(paymentMethod, customerId, note);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="title">{t('sell.confirmSale')}</ThemedText>
            <Pressable style={styles.closeButton} onPress={onRequestClose}>
              <ThemedText type="body">×</ThemedText>
            </Pressable>
          </View>

          <View style={styles.body}>
            <ThemedText type="body" style={{ marginBottom: 8 }}>
              {t('sell.total')}
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600", color: "#1B6B3A" }}>
              {formatCentimes(cartTotal)}
            </ThemedText>
          </View>

          {/* Payment Method Selection */}
          <View style={{ ...styles.section, marginBottom: 16 }}>
            <ThemedText type="body" style={{ marginBottom: 8 }}>
              {t('sell.paymentMethod')}
            </ThemedText>

            <View style={styles.paymentMethods}>
              {[
                { value: "cash", label: t("sell.cash"), icon: "cash" },
                { value: "electronic", label: t("sell.electronic"), icon: "credit-card" },
                { value: "mixed", label: t("sell.mixed"), icon: "merge" },
                { value: "partial", label: t("sell.partial"), icon: "currency-exchange" },
                { value: "credit", label: t("sell.credit"), icon: "account-clock" },
              ].map((method) => (
                <Pressable
                  key={method.value}
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === method.value && styles.paymentMethodButtonSelected,
                  ]}
                  onPress={() => setPaymentMethod(method.value as any)}
                >
                  <ThemedText style={styles.paymentMethodText}>
                    {method.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Customer selector for credit/partial */}
          {showCustomerSelector && (
            <View style={{ ...styles.section, marginBottom: 16 }}>
              <ThemedText type="body" style={{ marginBottom: 8 }}>
                {t('sell.selectCustomer')}
              </ThemedText>
              <View style={styles.customerList}>
                {customers.map((customer) => (
                  <Pressable
                    key={customer.id}
                    style={styles.customerItem}
                    onPress={() => {
                      setCustomerId(customer.id);
                      setShowCustomerSelector(false);
                    }}
                  >
                    <ThemedText type="body">{customer.name}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Note input */}
          {paymentMethod === "partial" && (
            <View style={{ ...styles.section, marginBottom: 16 }}>
              <ThemedText type="body" style={{ marginBottom: 8 }}>
                {t('sell.amountPaid')}
              </ThemedText>
              <View style={styles.noteInput}>
                <TextInput
                  value={note}
                  onChangeText={(text) => setNote(text)}
                  placeholder={t("sell.amountPaidPlaceholder")}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable style={[styles.cancelButton, !preserveCart && styles.disabledButton]} onPress={onRequestClose}>
              <ThemedText type="body" style={{ color: "#6B7280" }}>
                {t('sell.cancel')}
              </ThemedText>
            </Pressable>
            <Pressable style={[styles.confirmButton, !preserveCart && styles.disabledButton]} onPress={handleConfirm} disabled={itemCount === 0}>
              <ThemedText type="body" style={{ color: "#fff", fontWeight: "600" }}>
                {t('sell.confirmPayment')}
              </ThemedText>
            </Pressable>
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  closeButton: {
    padding: 8,
  },
  body: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  paymentMethods: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  paymentMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
  },
  paymentMethodButtonSelected: {
    backgroundColor: "#1B6B3A",
    borderColor: "#1B6B3A",
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  selectCustomer: {
    marginBottom: 12,
  },
  customerList: {
    marginTop: 8,
  },
  customerItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginBottom: 4,
  },
  noteInput: {
    marginTop: 8,
    flexDirection: "row",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    marginRight: 8,
    backgroundColor: "#f8f9fa",
  },
  confirmButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#1B6B3A",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
    pointerEvents: "none",
  },
});