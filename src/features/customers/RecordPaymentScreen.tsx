import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { recordPayment } from "@/services/customers/customerBalanceService";
import { formatCentimes } from "@/utils/money";

interface RecordPaymentScreenProps {
  customerId: number;
  customerName: string;
  currentDebt: number; // in centimes
}

export function RecordPaymentScreen({
  customerId,
  customerName,
  currentDebt,
}: RecordPaymentScreenProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  // Debt in Dinars (1 Dinar = 100 centimes)
  const debtDinars = Math.round(currentDebt / 100);

  const [amountInput, setAmountInput] = useState<string>(String(debtDinars));
  const [method, setMethod] = useState<"cash" | "electronic">("cash");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Parsed amount in Dinars
  const parsedDinars = useMemo(() => {
    const cleaned = amountInput.replace(/[^0-9]/g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
  }, [amountInput]);

  const parsedCentimes = parsedDinars * 100;
  const isOverpaying = parsedCentimes > currentDebt;
  const remainingDebtCentimes = Math.max(0, currentDebt - parsedCentimes);

  const handleQuickFill = (dinars: number) => {
    setAmountInput(String(dinars));
  };

  const handleConfirm = useCallback(async () => {
    if (parsedDinars <= 0) {
      Alert.alert(t("common:error"), t("customers:invalidAmount"));
      return;
    }

    if (isOverpaying) {
      Alert.alert(t("common:error"), t("customers:overPaymentWarning"));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await recordPayment(
        customerId,
        parsedCentimes,
        method,
        note.trim() || undefined
      );

      if (result) {
        Alert.alert(
          t("customers:paymentSuccess"),
          t("customers:paymentCleared", {
            amount: formatCentimes(parsedCentimes, i18n.language as any),
            customer: customerName,
          }),
          [
            {
              text: t("common:confirm"),
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(t("common:error"), t("customers:paymentFailed"));
      }
    } catch (err) {
      Alert.alert(t("common:error"), t("customers:paymentFailed"));
    } finally {
      setIsProcessing(false);
    }
  }, [
    customerId,
    parsedDinars,
    isOverpaying,
    parsedCentimes,
    method,
    note,
    customerName,
    router,
    t,
    i18n.language,
  ]);

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t("common:back")}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={Colors.light.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <ThemedText style={styles.headerTitle}>
            {t("customers:recordPayment")}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
            {customerName}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Current Debt Card */}
        <View style={styles.debtCard}>
          <View style={styles.debtCardLeft}>
            <View style={styles.avatarCircle}>
              <ThemedText style={styles.avatarText}>
                {customerName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View>
              <ThemedText style={styles.customerName}>{customerName}</ThemedText>
              <ThemedText style={styles.debtCardLabel}>
                {t("customers:currentDebt")}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.debtAmountValue}>
            {formatCentimes(currentDebt, i18n.language as any)}
          </ThemedText>
        </View>

        {/* Amount Input Card */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:paymentAmount")}
          </ThemedText>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="payments"
              size={22}
              color={Colors.light.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              style={styles.largeInput}
            />
            <ThemedText style={styles.currencyBadge}>DZD</ThemedText>
          </View>

          {/* Quick Fill Chips */}
          <View style={styles.quickFillContainer}>
            <TouchableOpacity
              style={[
                styles.quickFillChip,
                parsedDinars === debtDinars && styles.quickFillChipActive,
              ]}
              onPress={() => handleQuickFill(debtDinars)}
            >
              <MaterialIcons
                name="done-all"
                size={16}
                color={
                  parsedDinars === debtDinars
                    ? "#FFFFFF"
                    : Colors.light.primary
                }
              />
              <ThemedText
                style={[
                  styles.quickFillText,
                  parsedDinars === debtDinars && styles.quickFillTextActive,
                ]}
              >
                {t("customers:fullDebt")} ({debtDinars} DZD)
              </ThemedText>
            </TouchableOpacity>

            {debtDinars > 100 && (
              <TouchableOpacity
                style={styles.quickFillChip}
                onPress={() => handleQuickFill(Math.floor(debtDinars / 2))}
              >
                <ThemedText style={styles.quickFillText}>
                  50% ({Math.floor(debtDinars / 2)} DZD)
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Overpayment Warning */}
          {isOverpaying && (
            <View style={styles.warningBox}>
              <MaterialIcons
                name="warning"
                size={18}
                color={Colors.light.destructive}
              />
              <ThemedText style={styles.warningText}>
                {t("customers:overPaymentWarning")}
              </ThemedText>
            </View>
          )}

          {/* Balance Preview */}
          {!isOverpaying && parsedDinars > 0 && (
            <View style={styles.previewBox}>
              <ThemedText style={styles.previewLabel}>
                {t("customers:newBalancePreview")}
              </ThemedText>
              <ThemedText
                style={[
                  styles.previewValue,
                  remainingDebtCentimes === 0
                    ? styles.previewValueSettled
                    : styles.previewValueDebt,
                ]}
              >
                {remainingDebtCentimes === 0
                  ? t("customers:settled")
                  : formatCentimes(remainingDebtCentimes, i18n.language as any)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:paymentMethod")}
          </ThemedText>

          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[
                styles.methodCard,
                method === "cash" && styles.methodCardActive,
              ]}
              onPress={() => setMethod("cash")}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="payments"
                size={22}
                color={
                  method === "cash" ? Colors.light.primary : Colors.light.textSecondary
                }
              />
              <View style={styles.methodInfo}>
                <ThemedText
                  style={[
                    styles.methodName,
                    method === "cash" && styles.methodNameActive,
                  ]}
                >
                  {t("customers:cash")}
                </ThemedText>
                <ThemedText style={styles.methodDescription}>
                  {t("customers:cashRecommended")}
                </ThemedText>
              </View>
              <MaterialIcons
                name={
                  method === "cash"
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={20}
                color={
                  method === "cash" ? Colors.light.primary : Colors.light.textSecondary
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodCard,
                method === "electronic" && styles.methodCardActive,
              ]}
              onPress={() => setMethod("electronic")}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="credit-card"
                size={22}
                color={
                  method === "electronic"
                    ? Colors.light.primary
                    : Colors.light.textSecondary
                }
              />
              <View style={styles.methodInfo}>
                <ThemedText
                  style={[
                    styles.methodName,
                    method === "electronic" && styles.methodNameActive,
                  ]}
                >
                  {t("customers:edahabia")}
                </ThemedText>
                <ThemedText style={styles.methodDescription}>
                  BaridiMob / TPE
                </ThemedText>
              </View>
              <MaterialIcons
                name={
                  method === "electronic"
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={20}
                color={
                  method === "electronic"
                    ? Colors.light.primary
                    : Colors.light.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Note / Memo */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:note")} ({t("common:optional")})
          </ThemedText>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t("customers:receiptNotePlaceholder")}
            placeholderTextColor={Colors.light.textMuted}
            style={styles.noteInput}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <ThemedText style={styles.cancelBtnText}>
              {t("common:cancel")}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (isOverpaying || parsedDinars <= 0 || isProcessing) &&
                styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={isOverpaying || parsedDinars <= 0 || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <ThemedText style={styles.confirmBtnText}>
                  {t("customers:confirmPayment")}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  iconButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxxxx,
  },
  debtCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: Spacing.md,
  },
  debtCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.destructive,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  debtCardLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  debtAmountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.destructive,
  },
  sectionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  largeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    paddingVertical: 0,
  },
  currencyBadge: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  quickFillContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: "wrap",
  },
  quickFillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primaryLight,
  },
  quickFillChipActive: {
    backgroundColor: Colors.light.primary,
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  quickFillTextActive: {
    color: "#FFFFFF",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  warningText: {
    fontSize: 12,
    color: Colors.light.destructive,
    flex: 1,
  },
  previewBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surfaceAlt,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  previewLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  previewValueSettled: {
    color: Colors.light.primary,
  },
  previewValueDebt: {
    color: Colors.light.destructive,
  },
  methodRow: {
    gap: Spacing.sm,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    backgroundColor: Colors.light.surface,
  },
  methodCardActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  methodInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  methodName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  methodNameActive: {
    color: Colors.light.primary,
  },
  methodDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  noteInput: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
