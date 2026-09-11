import { View, ScrollView, StyleSheet, TextInput, Pressable, Modal, Text, Alert } from 'react-native';
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRoute } from "expo-router";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCentimes, parseCentimes } from "@/utils/money";
import { Typography, Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

interface RecordPaymentScreenProps {
  customerId: number;
  customerName: string;
  currentDebt: number;
}

export function RecordPaymentScreen({ customerId, customerName, currentDebt }: RecordPaymentScreenProps) {
  const { t } = useTranslation();
  const [paymentAmount, setPaymentAmount] = useState<string>(String(currentDebt));
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'edahabia'>('cash');
  const [receiptNote, setReceiptNote] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const route = useRoute();

  // Calculate new balance after payment
  const newBalance = currentDebt - parseFloat(paymentAmount);

  const handleConfirmPayment = useCallback(async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > currentDebt) {
      Alert.alert(
        t("common:error"),
        amount > currentDebt
          ? t("customers:overPaymentWarning")
          : t("customers:invalidAmount")
      );
      return;
    }

    setIsProcessing(true);
    try {
      // In a full implementation, this would record the payment
      // and update the customer's balance in the database
      setTimeout(() => {
        // Celebration animation - balance cleared
        Alert.alert(
          t("customers:paymentSuccess"),
          t("customers:paymentCleared", { amount: formatCentimes(amount), customer: customerName })
        );
      }, 600);
    } catch (err) {
      Alert.alert(t("common:error"), t("customers:paymentFailed"));
    } finally {
      setIsProcessing(false);
    }
  }, [paymentAmount, currentDebt, customerName, t]);

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {t("customers:recordPayment")}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            {t("customers:forCustomer", { customer: customerName })}
          </ThemedText>
        </View>

        {/* Current Debt Display */}
        <View style={styles.currentDebtCard}>
          <ThemedText type="body" style={styles.currentDebtLabel}>
            {t("customers:currentDebt")}
          </ThemedText>
          <Text style={styles.currentDebtAmount}>
            {formatCentimes(currentDebt)} DZD
          </Text>
        </View>

        {/* Payment Amount Section */}
        <View style={styles.paymentAmountSection}>
          <ThemedText type="body" style={styles.paymentLabel}>
            {t("customers:paymentAmount")}
          </ThemedText>
          <div style={styles.visualInput}>
            <ThemedText type="body" style={styles.inputIcon}>
              <Text style={styles.materialSymbol}>price_change</Text>
            </ThemedText>
            <TextInput
              value={paymentAmount}
              onChangeText={(text) => setPaymentAmount(text)}
              keyboardType="number-pad"
              placeholder={t("customers:amountPlaceholder")}
              autoCapitalize="none"
              style={styles.inputField}
            />
            <ThemedText type="body" style={styles.currencyLabel}>DZD</ThemedText>
          </div>

          {/* Quick Fill Chips */}
          <View style={styles.chipGrid}>
            <Pressable style={styles.chipButton} onPress={() => setPaymentAmount(String(currentDebt))}>
              <ThemedText type="body" style={styles.chipIcon}>
                <Text style={styles.materialSymbol}>done_all</Text>
              </ThemedText>
              <Text style={styles.chipText}>
                {t("customers:fullDebt")}
              </Text>
            </Pressable>
            <Pressable style={styles.chipButton} onPress={() => setPaymentAmount("50")}>
              <ThemedText type="body" style={styles.chipIcon}>
                <Text style={styles.materialSymbol}>payments</Text>
              </ThemedText>
              <Text style={styles.chipText}>50 DZD</Text>
            </Pressable>
            <Pressable style={styles.chipButton} onPress={() => setPaymentAmount("100")}>
              <ThemedText type="body" style={styles.chipIcon}>
                <Text style={styles.materialSymbol}>payments</Text>
              </ThemedText>
              <Text style={styles.chipText}>100 DZD</Text>
            </Pressable>
            <Pressable style={styles.chipButton} onPress={() => setPaymentAmount("custom")}>
              <ThemedText type="body" style={styles.chipIcon}>
                <Text style={styles.materialSymbol}>edit</Text>
              </ThemedText>
              <Text style={styles.chipText}>
                {t("customers:customAmount")}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Overpayment Warning */}
        {parseFloat(paymentAmount) > currentDebt && (
          <View style={styles.overpaymentWarning}>
            <ThemedText type="body" style={styles.warningIcon}>
              <Text style={styles.materialSymbol}>warning</Text>
            </ThemedText>
            <ThemedText type="body" style={styles.warningTitle}>
              {t("customers:overPaymentWarningTitle")}
            </ThemedText>
            <ThemedText type="caption" style={styles.warningDescription}>
              {t("customers:overPaymentWarningDetails", {
                remaining: formatCentimes(currentDebt),
                excess: formatCentimes(parseFloat(paymentAmount) - currentDebt),
              })}
            </ThemedText>
          </View>
        )}

        {/* Payment Method Selection */}
        <View style={styles.paymentMethodSection}>
          <ThemedText type="body" style={styles.sectionLabel}>
            {t("customers:paymentMethod")}
          </ThemedText>

          {/* Cash Option */}
          <Pressable style={styles.paymentMethodCard} onPress={() => setPaymentMethod('cash')}>
            <View style={styles.methodWrapper}>
              <ThemedText type="body" style={styles.methodIcon}>
                <Text style={styles.materialSymbol}>payments</Text>
              </ThemedText>
              <View style={styles.methodCheck}>
                <Text style={styles.materialSymbol}>check</Text>
              </View>
            </View>
            <View style={styles.methodDetails}>
              <ThemedText type="body" style={styles.methodName}>
                {t("customers:cash")}
              </ThemedText>
              <ThemedText type="caption" style={styles.methodSubtitle}>
                {t("customers:cashDescription")}
              </ThemedText>
            </View>
          </Pressable>

          {/* Edahabia/CIB Option */}
          <Pressable style={styles.paymentMethodCard} onPress={() => setPaymentMethod('edahabia')}>
            <View style={styles.methodWrapper}>
              <ThemedText type="body" style={styles.methodIcon}>
                <Text style={styles.materialSymbol}>contactless</Text>
              </ThemedText>
              <View style={styles.methodCheck}>
                <Text style={styles.materialSymbol}>check</Text>
              </View>
            </View>
            <View style={styles.methodDetails}>
              <ThemedText type="body" style={styles.methodName}>
                {t("customers:edahabia")}
              </ThemedText>
              <ThemedText type="caption" style={styles.methodSubtitle}>
                {t("customers:edahabiaDescription")}
              </ThemedText>
            </View>
          </Pressable>
        </View>

        {/* Receipt Note */}
        {currentDebt > 0 && (
          <View style={styles.receiptNoteSection}>
            <ThemedText type="body" style={styles.noteLabel}>
              {t("customers:referenceNote")}
            </ThemedText>
            <TextInput
              value={receiptNote}
              onChangeText={(text) => setReceiptNote(text)}
              placeholder={t("customers:notePlaceholder")}
              multiline
              numberOfLines={3}
              style={styles.noteInput}
            />
          </View>
        )}

        {/* Settlement Calculation Card */}
        <View style={styles.settlementCard}>
          <ThemedText type="caption" style={styles.cardLabel}>
            {t("customers:impactOnBalance")}
          </ThemedText>

          <View style={styles.row1}>
            <ThemedText type="body" style={styles.rowLabel}>
              {t("customers:currentDebt")}
            </ThemedText>
            <Text style={styles.rowValue}>
              {formatCentimes(currentDebt)} DZD
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row2}>
            <ThemedText type="body" style={styles.rowLabel}>
              {t("customers:paymentToApply")}
            </ThemedText>
            <Text style={styles.rowValueNegative}>
              -{formatCentimes(parseFloat(paymentAmount))} DZD
            </Text>
          </View>

          {parseFloat(paymentAmount) >= currentDebt && (
            <ThemedText type="body" style={styles.row3}>
              <ThemedText type="body" style={styles.cellLabel}>
                {t("customers:newBalance")}
              </ThemedText>
              <Text style={styles.cellValue}>
                {newBalance <= 0 ? "0 DZD" : formatCentimes(newBalance)} DZD
              </Text>
            </ThemedText>
          )}

          {parseFloat(paymentAmount) < currentDebt && (
            <ThemedText type="body" style={styles.row3}>
              <ThemedText type="body" style={styles.cellLabel}>
                {t("customers:remainingBalance")}
              </ThemedText>
              <Text style={styles.cellValue}>
                {formatCentimes(newBalance)} DZD
              </Text>
            </ThemedText>
          )}
        </View>

        {/* Confirm Payment Button */}
        <View style={styles.actionBar}>
          <Pressable style={styles.confirmButton} onPress={handleConfirmPayment} disabled={isProcessing}>
            <ThemedText type="body" style={styles.confirmButtonText}>
              {isProcessing
                ? t("common:processing")
                : t("customers:confirmPayment", { amount: formatCentimes(parseFloat(paymentAmount)) })}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  currentDebtCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentDebtLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  currentDebtAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.destructive,
  },
  paymentAmountSection: {
    marginBottom: Spacing.lg,
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  visualInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  inputIcon: {
    flex: 1,
    paddingHorizontal: 12,
  },
  materialSymbol: {
    fontSize: 20,
    color: Colors.light.primary,
  },
  inputField: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: Spacing.md,
  },
  currencyLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chipButton: {
    flex: 1,
    minWidth: 80,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipIcon: {
    fontSize: 18,
    color: Colors.light.primary,
    marginBottom: Spacing.xs,
  },
  chipText: {
    fontSize: 12,
    textAlign: 'center',
    color: Colors.light.textPrimary,
  },
  overpaymentWarning: {
    backgroundColor: Colors.light.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningIcon: {
    fontSize: 20,
    color: Colors.light.warning,
    marginRight: Spacing.md,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.warning,
    marginBottom: Spacing.xs,
  },
  warningDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  paymentMethodSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  paymentMethodCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  methodWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodIcon: {
    fontSize: 20,
    color: Colors.light.primary,
  },
  methodCheck: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  methodSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  receiptNoteSection: {
    marginBottom: Spacing.lg,
  },
  noteLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  noteInput: {
    height: 80,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  settlementCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  row1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  row2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: Spacing.md,
  },
  row3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  rowLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  rowValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  rowValueNegative: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.destructive,
  },
  cellLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  cellValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.destructive,
    flex: 1,
    textAlign: 'right',
  },
  actionBar: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  confirmButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    textAlign: 'center',
  },
});