import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { recordPayment, getCustomerDebt } from "@/services/customers/customerBalanceService";
import { getById as getCustomerById } from "@/database/repositories/customerRepository";
import { formatCentimes, formatCentimesToInputDzd, getCurrencySymbol, parseDzdToCentimes } from "@/utils/money";

interface RecordPaymentScreenProps {
  customerId: number;
  customerName?: string;
  currentDebt?: number; // in centimes
}

export function RecordPaymentScreen({
  customerId,
  customerName: initialCustomerName,
  currentDebt: initialCurrentDebt,
}: RecordPaymentScreenProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  const [customerName, setCustomerName] = useState(initialCustomerName || "");
  const [currentDebt, setCurrentDebt] = useState(initialCurrentDebt || 0);

  const [amountInput, setAmountInput] = useState<string>(() =>
    formatCentimesToInputDzd(initialCurrentDebt || 0),
  );
  const [method, setMethod] = useState<"cash" | "electronic">("cash");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (customerId && (!customerName || currentDebt === 0)) {
      Promise.all([getCustomerById(customerId), getCustomerDebt(customerId)]).then(
        ([cust, debt]) => {
          if (cust) setCustomerName(cust.name);
          if (debt !== undefined) {
            setCurrentDebt(debt);
            setAmountInput(formatCentimesToInputDzd(debt));
          }
        }
      );
    }
  }, [customerId, customerName, currentDebt]);

  const parsedCentimes = useMemo(() => {
    return parseDzdToCentimes(amountInput);
  }, [amountInput]);

  const isOverpaying = parsedCentimes > currentDebt;
  const remainingDebtCentimes = Math.max(0, currentDebt - parsedCentimes);

  const handleQuickFillCentimes = (centimes: number) => {
    setAmountInput(formatCentimesToInputDzd(centimes));
  };

  const handleConfirm = useCallback(async () => {
    if (parsedCentimes <= 0) {
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
            remaining: formatCentimes(remainingDebtCentimes, i18n.language as any),
          }),
          [
            {
              text: t("common:ok"),
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        const latestDebt = await getCustomerDebt(customerId);
        setCurrentDebt(latestDebt);
        setAmountInput(formatCentimesToInputDzd(latestDebt));
        Alert.alert(
          t("common:error"),
          t("customers:overPaymentWarning", {
            defaultValue: "Payment cannot exceed the customer's current debt balance.",
          })
        );
      }
    } catch (err: any) {
      Alert.alert(t("common:error"), err.message || t("common:unknownError"));
    } finally {
      setIsProcessing(false);
    }
  }, [
    customerId,
    parsedCentimes,
    isOverpaying,
    remainingDebtCentimes,
    method,
    note,
    router,
    t,
    i18n.language,
  ]);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t("common:back")}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.textPrimary}
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
        showsVerticalScrollIndicator={false}
      >
        {/* Outstanding Debt Info Card */}
        <View style={styles.debtCard}>
          <View style={styles.debtCardLeft}>
            <View style={styles.avatarCircle}>
              <ThemedText style={styles.avatarText}>
                {customerName ? customerName.slice(0, 2).toUpperCase() : "CU"}
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

        {/* Payment Amount Card */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:paymentAmount")}
          </ThemedText>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="attach-money"
              size={24}
              color={theme.primary}
              style={styles.inputIcon}
            />
            <TextInput
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="decimal-pad"
              style={styles.largeInput}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
            />
            <ThemedText style={styles.currencyBadge}>{getCurrencySymbol(undefined, i18n.language)}</ThemedText>
          </View>
          <ThemedText style={[styles.inputHintText, { color: theme.textMuted }]}>
            {i18n.language?.startsWith("ar")
              ? "أدخل المبلغ بالدينار (مثال: 10.50 لدفع 10.50 دج)"
              : i18n.language?.startsWith("fr")
              ? "Saisissez le montant en DZD (ex: 10.50 pour 10,50 DZD)"
              : "Enter amount in DZD (e.g. 10.50 for 10.50 DZD)"}
          </ThemedText>

          {/* Quick Amount Chips */}
          <View style={styles.quickFillContainer}>
            {currentDebt > 0 && (
              <TouchableOpacity
                style={[
                  styles.quickFillChip,
                  parsedCentimes === currentDebt && styles.quickFillChipActive,
                ]}
                onPress={() => handleQuickFillCentimes(currentDebt)}
              >
                <ThemedText
                  style={[
                    styles.quickFillText,
                    parsedCentimes === currentDebt && styles.quickFillTextActive,
                  ]}
                >
                  {t("customers:fullAmount")} ({formatCentimes(currentDebt, i18n.language as any)})
                </ThemedText>
              </TouchableOpacity>
            )}

            {currentDebt >= 200000 && (
              <TouchableOpacity
                style={[
                  styles.quickFillChip,
                  parsedCentimes === Math.round(currentDebt / 2) &&
                    styles.quickFillChipActive,
                ]}
                onPress={() => handleQuickFillCentimes(Math.round(currentDebt / 2))}
              >
                <ThemedText
                  style={[
                    styles.quickFillText,
                    parsedCentimes === Math.round(currentDebt / 2) &&
                      styles.quickFillTextActive,
                  ]}
                >
                  50% ({formatCentimes(Math.round(currentDebt / 2), i18n.language as any)})
                </ThemedText>
              </TouchableOpacity>
            )}

            {currentDebt >= 100000 && (
              <TouchableOpacity
                style={[
                  styles.quickFillChip,
                  parsedCentimes === 100000 && styles.quickFillChipActive,
                ]}
                onPress={() => handleQuickFillCentimes(100000)}
              >
                <ThemedText
                  style={[
                    styles.quickFillText,
                    parsedCentimes === 100000 && styles.quickFillTextActive,
                  ]}
                >
                  {formatCentimes(100000, i18n.language as any)}
                </ThemedText>
              </TouchableOpacity>
            )}

            {currentDebt >= 200000 && (
              <TouchableOpacity
                style={[
                  styles.quickFillChip,
                  parsedCentimes === 200000 && styles.quickFillChipActive,
                ]}
                onPress={() => handleQuickFillCentimes(200000)}
              >
                <ThemedText
                  style={[
                    styles.quickFillText,
                    parsedCentimes === 200000 && styles.quickFillTextActive,
                  ]}
                >
                  {formatCentimes(200000, i18n.language as any)}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Overpaying warning */}
          {isOverpaying && (
            <View style={styles.warningBox}>
              <MaterialIcons
                name="warning"
                size={18}
                color={theme.error}
              />
              <ThemedText style={styles.warningText}>
                {t("customers:overPaymentWarning")}
              </ThemedText>
            </View>
          )}

          {/* Remaining Debt Preview */}
          {!isOverpaying && parsedCentimes > 0 && (
            <View style={styles.previewBox}>
              <ThemedText style={styles.previewLabel}>
                {t("customers:remainingBalanceAfter")}
              </ThemedText>
              <ThemedText
                style={[
                  styles.previewValue,
                  remainingDebtCentimes === 0
                    ? styles.previewValueSettled
                    : styles.previewValueDebt,
                ]}
              >
                {formatCentimes(remainingDebtCentimes, i18n.language as any)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Payment Method Card */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:paymentMethod")}
          </ThemedText>
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[
                styles.methodOption,
                method === "cash" && styles.methodOptionSelected,
              ]}
              onPress={() => setMethod("cash")}
            >
              <MaterialIcons
                name="payments"
                size={20}
                color={
                  method === "cash" ? theme.primary : theme.textSecondary
                }
              />
              <ThemedText
                style={[
                  styles.methodLabel,
                  method === "cash" && styles.methodLabelSelected,
                ]}
              >
                {t("customers:paymentMethodCash", { defaultValue: "نقداً (كاش)" })}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodOption,
                method === "electronic" && styles.methodOptionSelected,
              ]}
              onPress={() => setMethod("electronic")}
            >
              <MaterialIcons
                name="credit-card"
                size={20}
                color={
                  method === "electronic"
                    ? theme.primary
                    : theme.textSecondary
                }
              />
              <ThemedText
                style={[
                  styles.methodLabel,
                  method === "electronic" && styles.methodLabelSelected,
                ]}
              >
                {t("customers:paymentMethodElectronic", { defaultValue: "دفع إلكتروني" })}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes Card */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:note")} ({t("common:optional")})
          </ThemedText>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <MaterialIcons
              name="notes"
              size={20}
              color={theme.textSecondary}
              style={[styles.inputIcon, { marginTop: 2 }]}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t("customers:receiptNotePlaceholder")}
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={2}
              style={[styles.largeInput, styles.textAreaInput]}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (isProcessing || parsedCentimes <= 0 || isOverpaying) &&
              styles.submitBtnDisabled,
          ]}
          onPress={handleConfirm}
          disabled={isProcessing || parsedCentimes <= 0 || isOverpaying}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
              <ThemedText style={styles.submitBtnText}>
                {t("customers:confirmPayment")}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Footer Trademark */}
        <FooterTrademark />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    iconButton: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
    },
    headerInfo: {
      flex: 1,
      marginHorizontal: Spacing.sm,
    },
    headerTitle: {
      ...Typography.heading3,
      color: theme.textPrimary,
    },
    headerSubtitle: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginTop: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: 48,
      maxWidth: 600,
      alignSelf: "center",
      width: "100%",
    },
    debtCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.surface,
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    debtCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      ...Typography.label,
      fontWeight: "700",
      color: theme.primary,
    },
    customerName: {
      ...Typography.label,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    debtCardLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginTop: 2,
    },
    debtAmountValue: {
      ...Typography.heading3,
      color: theme.error,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    sectionTitle: {
      ...Typography.caption,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.lg,
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
      color: theme.textPrimary,
      paddingVertical: 0,
    },
    currencyBadge: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    inputHintText: {
      fontSize: 11,
      marginTop: 4,
      textAlign: "center",
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
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.primaryLight,
    },
    quickFillChipActive: {
      backgroundColor: theme.primary,
    },
    quickFillText: {
      ...Typography.caption,
      fontWeight: "600",
      color: theme.primary,
    },
    quickFillTextActive: {
      color: "#FFFFFF",
    },
    warningBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: theme.errorLight,
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.sm,
    },
    warningText: {
      ...Typography.caption,
      color: theme.error,
      fontWeight: "600",
      flex: 1,
    },
    previewBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.surfaceAlt,
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.sm,
    },
    previewLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    previewValue: {
      ...Typography.caption,
      fontWeight: "700",
    },
    previewValueDebt: {
      color: theme.warning,
    },
    previewValueSettled: {
      color: theme.primary,
    },
    methodSelector: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    methodOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xs,
      paddingVertical: 12,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    methodOptionSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    methodLabel: {
      ...Typography.caption,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    methodLabelSelected: {
      color: theme.primary,
      fontWeight: "700",
    },
    textAreaContainer: {
      height: 70,
      alignItems: "flex-start",
      paddingVertical: Spacing.sm,
    },
    textAreaInput: {
      fontSize: 14,
      fontWeight: "400",
    },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: BorderRadius.xl,
      backgroundColor: theme.primary,
      marginTop: Spacing.sm,
      ...Shadows.sm,
    },
    submitBtnDisabled: {
      opacity: 0.5,
    },
    submitBtnText: {
      ...Typography.label,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
