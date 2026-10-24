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
import {
  recordRefund,
  getCustomerCredit,
} from "@/services/customers/customerBalanceService";
import { getById as getCustomerById } from "@/database/repositories/customerRepository";
import { formatCentimes, getActiveStoreCurrency, getCurrencySymbol, parseCentimes } from "@/utils/money";

interface RecordRefundScreenProps {
  customerId: number;
  customerName?: string;
  currentCredit?: number; // in centimes
}

/**
 * RecordRefundScreen — explicit merchant action returning money the shop owes
 * a customer (customer credit), e.g. after cancelling a sale they had paid for.
 * The refund is stored as a negative customer_payments row and consumes credit.
 */
export function RecordRefundScreen({
  customerId,
  customerName: initialCustomerName,
  currentCredit: initialCurrentCredit,
}: RecordRefundScreenProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  const [customerName, setCustomerName] = useState(initialCustomerName || "");
  const [currentCredit, setCurrentCredit] = useState(initialCurrentCredit || 0);

  useEffect(() => {
    // Always fetch the authoritative credit — route params are display hints
    // only (they can be stale after a refund).
    if (customerId) {
      Promise.all([getCustomerById(customerId), getCustomerCredit(customerId)]).then(
        ([cust, credit]) => {
          if (cust) setCustomerName(cust.name);
          setCurrentCredit(credit);
          setAmountInput(formatDinarsForInput(credit));
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  /**
   * Format an exact centime amount as a decimal string suitable for the amount
   * input, using the locale-appropriate decimal separator (parseCentimes expects
   * "," for fr/ar and "." for en). Preserves centimes exactly: 1050 → "10,50".
   */
  function formatDinarsForInput(centimes: number): string {
    const separator = i18n.language.startsWith("en") ? "." : ",";
    return (centimes / 100).toFixed(2).replace(".", separator);
  }
  const [amountInput, setAmountInput] = useState<string>("");
  const [method, setMethod] = useState<"cash" | "electronic">("cash");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse the input in EXACT centimes (locale-aware: "10,50" / "10.50" → 1050).
  const parsedCentimes = useMemo(
    () => parseCentimes(amountInput, i18n.language),
    [amountInput, i18n.language]
  );

  const isExceedingCredit = parsedCentimes > currentCredit;
  const remainingCreditCentimes = Math.max(0, currentCredit - parsedCentimes);

  const handleQuickFill = (centimes: number) => {
    setAmountInput(formatDinarsForInput(centimes));
  };

  const handleConfirm = useCallback(async () => {
    if (parsedCentimes <= 0) {
      Alert.alert(t("common:error"), t("customers:invalidAmount"));
      return;
    }

    if (isExceedingCredit) {
      Alert.alert(t("common:error"), t("customers:refundExceedsCredit"));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await recordRefund(
        customerId,
        parsedCentimes,
        method,
        note.trim() || undefined
      );

      if (result) {
        Alert.alert(
          t("customers:refundSuccess"),
          t("customers:refundCleared", {
            amount: formatCentimes(parsedCentimes, i18n.language as any),
            customer: customerName,
          }),
          [
            {
              text: t("common:ok"),
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        // Blocked inside the transaction (credit changed or insufficient).
        Alert.alert(t("common:error"), t("customers:refundExceedsCredit"));
      }
    } catch (err: any) {
      Alert.alert(t("common:error"), err.message || t("common:unknownError"));
    } finally {
      setIsProcessing(false);
    }
  }, [
    customerId,
    parsedCentimes,
    method,
    note,
    isExceedingCredit,
    customerName,
    t,
    i18n.language,
    router,
  ]);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  if (currentCredit <= 0) {
    return (
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={t("common:back")}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <ThemedText style={styles.headerTitle}>
              {t("customers:recordRefund")}
            </ThemedText>
            <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
              {customerName}
            </ThemedText>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="info" size={40} color={theme.textMuted} />
          <ThemedText style={styles.noCreditText}>
            {t("customers:noCreditToRefund")}
          </ThemedText>
        </View>
      </View>
    );
  }

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
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <ThemedText style={styles.headerTitle}>
            {t("customers:recordRefund")}
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
        {/* Available Credit Info Card */}
        <View style={styles.creditCard}>
          <View style={styles.creditCardLeft}>
            <View style={styles.avatarCircle}>
              <ThemedText style={styles.avatarText}>
                {customerName ? customerName.slice(0, 2).toUpperCase() : "CU"}
              </ThemedText>
            </View>
            <View>
              <ThemedText style={styles.customerName}>{customerName}</ThemedText>
              <ThemedText style={styles.creditCardLabel}>
                {t("customers:customerCredit")}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.creditAmountValue}>
            {formatCentimes(currentCredit, i18n.language as any)}
          </ThemedText>
        </View>

        {/* Refund Amount Input Section */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:refundAmount")} ({getActiveStoreCurrency()})
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

          {/* Quick Amount Chips */}
          <View style={styles.quickFillContainer}>
            {currentCredit > 0 && (
              <TouchableOpacity
                style={[
                  styles.quickFillChip,
                  parsedCentimes === currentCredit && styles.quickFillChipActive,
                ]}
                onPress={() => handleQuickFill(currentCredit)}
              >
                <ThemedText
                  style={[
                    styles.quickFillText,
                    parsedCentimes === currentCredit && styles.quickFillTextActive,
                  ]}
                >
                  {t("customers:fullAmount")} ({formatCentimes(currentCredit, i18n.language as any)})
                </ThemedText>
              </TouchableOpacity>
            )}

            {currentCredit >= 2000 && (
              <TouchableOpacity
                style={[
                  styles.quickFillChip,
                  parsedCentimes === Math.round(currentCredit / 2) &&
                    styles.quickFillChipActive,
                ]}
                onPress={() => handleQuickFill(Math.round(currentCredit / 2))}
              >
                <ThemedText
                  style={[
                    styles.quickFillText,
                    parsedCentimes === Math.round(currentCredit / 2) &&
                      styles.quickFillTextActive,
                  ]}
                >
                  50% ({formatCentimes(Math.round(currentCredit / 2), i18n.language as any)})
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Exceeding credit warning */}
          {isExceedingCredit && (
            <View style={styles.warningBox}>
              <MaterialIcons name="warning" size={18} color={theme.error} />
              <ThemedText style={styles.warningText}>
                {t("customers:refundExceedsCredit")}
              </ThemedText>
            </View>
          )}

          {/* Remaining Credit Preview */}
          {!isExceedingCredit && parsedCentimes > 0 && (
            <View style={styles.previewBox}>
              <ThemedText style={styles.previewLabel}>
                {t("customers:remainingCreditAfter")}
              </ThemedText>
              <ThemedText
                style={[
                  styles.previewValue,
                  remainingCreditCentimes === 0
                    ? styles.previewValueSettled
                    : styles.previewValueCredit,
                ]}
              >
                {formatCentimes(remainingCreditCentimes, i18n.language as any)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Refund Method Selection — how the money is handed back */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:refundMethod")}
          </ThemedText>

          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[styles.methodCard, method === "cash" && styles.methodCardActive]}
              onPress={() => setMethod("cash")}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="money"
                size={22}
                color={method === "cash" ? theme.primary : theme.textSecondary}
              />
              <View style={styles.methodInfo}>
                <ThemedText
                  style={[styles.methodName, method === "cash" && styles.methodNameActive]}
                >
                  {t("customers:cash")}
                </ThemedText>
                <ThemedText style={styles.methodDescription}>
                  {t("customers:cashDescription")}
                </ThemedText>
              </View>
              <MaterialIcons
                name={method === "cash" ? "radio-button-checked" : "radio-button-unchecked"}
                size={20}
                color={method === "cash" ? theme.primary : theme.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodCard, method === "electronic" && styles.methodCardActive]}
              onPress={() => setMethod("electronic")}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="credit-card"
                size={22}
                color={method === "electronic" ? theme.primary : theme.textSecondary}
              />
              <View style={styles.methodInfo}>
                <ThemedText
                  style={[styles.methodName, method === "electronic" && styles.methodNameActive]}
                >
                  {t("customers:edahabia")}
                </ThemedText>
                <ThemedText style={styles.methodDescription}>
                  BaridiMob / TPE
                </ThemedText>
              </View>
              <MaterialIcons
                name={method === "electronic" ? "radio-button-checked" : "radio-button-unchecked"}
                size={20}
                color={method === "electronic" ? theme.primary : theme.textSecondary}
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
            style={styles.noteInput}
            placeholder={t("customers:refundNotePlaceholder")}
            placeholderTextColor={theme.textMuted}
            multiline
          />
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (parsedCentimes <= 0 || isExceedingCredit || isProcessing) &&
              styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={parsedCentimes <= 0 || isExceedingCredit || isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color={theme.surface} />
          ) : (
            <>
              <MaterialIcons name="undo" size={20} color={theme.surface} />
              <ThemedText style={styles.confirmButtonText}>
                {t("customers:confirmRefund")}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <FooterTrademark />
    </View>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      gap: Spacing.md,
    },
    noCreditText: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: "center",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      backgroundColor: theme.background,
      gap: Spacing.md,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
      ...Shadows.sm,
    },
    headerInfo: {
      flex: 1,
    },
    headerTitle: {
      ...Typography.heading3,
      color: theme.textPrimary,
    },
    headerSubtitle: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    scrollContent: {
      padding: Spacing.md,
      paddingBottom: Spacing.xl,
      gap: Spacing.md,
    },
    creditCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Shadows.sm,
    },
    creditCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      flex: 1,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      ...Typography.label,
      color: theme.positive,
    },
    customerName: {
      ...Typography.body,
      color: theme.textPrimary,
    },
    creditCardLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    creditAmountValue: {
      ...Typography.heading2,
      color: theme.positive,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Shadows.sm,
    },
    sectionTitle: {
      ...Typography.body,
      color: theme.textPrimary,
      marginBottom: Spacing.md,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
    },
    inputIcon: {
      marginRight: Spacing.sm,
    },
    largeInput: {
      flex: 1,
      fontSize: 24,
      paddingVertical: Spacing.md,
      color: theme.textPrimary,
    },
    currencyBadge: {
      ...Typography.body,
      color: theme.textSecondary,
    },
    quickFillContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    quickFillChip: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    quickFillChipActive: {
      backgroundColor: theme.primary,
    },
    quickFillText: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    quickFillTextActive: {
      color: theme.surface,
    },
    warningBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: theme.errorLight,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    warningText: {
      flex: 1,
      ...Typography.caption,
      color: theme.error,
    },
    previewBox: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    previewLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    previewValue: {
      ...Typography.label,
      marginTop: Spacing.xs,
    },
    previewValueSettled: {
      color: theme.positive,
    },
    previewValueCredit: {
      color: theme.textPrimary,
    },
    methodRow: {
      gap: Spacing.sm,
    },
    methodCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    methodCardActive: {
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    methodInfo: {
      flex: 1,
    },
    methodName: {
      ...Typography.body,
      color: theme.textPrimary,
    },
    methodNameActive: {
      color: theme.primary,
    },
    methodDescription: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    noteInput: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      minHeight: 80,
      textAlignVertical: "top",
      color: theme.textPrimary,
    },
    confirmButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: theme.positive,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      ...Shadows.md,
    },
    confirmButtonDisabled: {
      opacity: 0.5,
    },
    confirmButtonText: {
      ...Typography.label,
      color: theme.surface,
    },
  });
}
