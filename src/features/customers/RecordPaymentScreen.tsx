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
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { recordPayment, getCustomerDebt } from "@/services/customers/customerBalanceService";
import { getById as getCustomerById } from "@/database/repositories/customerRepository";
import { formatCentimes } from "@/utils/money";

interface RecordPaymentScreenProps {
  customerId: number;
  customerName: string;
  currentDebt: number; // in centimes
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

  useEffect(() => {
    if (customerId && (!customerName || currentDebt === 0)) {
      Promise.all([getCustomerById(customerId), getCustomerDebt(customerId)]).then(
        ([cust, debt]) => {
          if (cust) setCustomerName(cust.name);
          if (debt !== undefined) {
            setCurrentDebt(debt);
            setAmountInput(String(Math.round(debt / 100)));
          }
        }
      );
    }
  }, [customerId]);

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
              text: t("common:ok"),
              onPress: () => router.back(),
            },
          ]
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
    parsedDinars,
    method,
    note,
    isOverpaying,
    customerName,
    t,
    i18n.language,
    router,
  ]);

  const styles = useMemo(() => createStyles(theme), [theme]);

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

        {/* Payment Amount Input Section */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:paymentAmount")} (DZD)
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
              keyboardType="number-pad"
              style={styles.largeInput}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
            />
            <ThemedText style={styles.currencyBadge}>DZD</ThemedText>
          </View>

          {/* Quick Amount Chips */}
          <View style={styles.quickFillContainer}>
            {debtDinars > 0 && (
              <TouchableOpacity
                style={[
                  styles.quickFillChip,
                  parsedDinars === debtDinars && styles.quickFillChipActive,
                ]}
                onPress={() => handleQuickFill(debtDinars)}
              >
                <ThemedText
                  style={[
                    styles.quickFillText,
                    parsedDinars === debtDinars && styles.quickFillTextActive,
                  ]}
                >
                  {t("customers:fullAmount")} ({debtDinars} DZD)
                </ThemedText>
              </TouchableOpacity>
            )}

            {debtDinars >= 2000 && (
              <TouchableOpacity
                style={[
                  styles.quickFillChip,
                  parsedDinars === Math.round(debtDinars / 2) &&
                    styles.quickFillChipActive,
                ]}
                onPress={() => handleQuickFill(Math.round(debtDinars / 2))}
              >
                <ThemedText
                  style={[
                    styles.quickFillText,
                    parsedDinars === Math.round(debtDinars / 2) &&
                      styles.quickFillTextActive,
                  ]}
                >
                  50% ({Math.round(debtDinars / 2)} DZD)
                </ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.quickFillChip,
                parsedDinars === 1000 && styles.quickFillChipActive,
              ]}
              onPress={() => handleQuickFill(1000)}
            >
              <ThemedText
                style={[
                  styles.quickFillText,
                  parsedDinars === 1000 && styles.quickFillTextActive,
                ]}
              >
                1000 DZD
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickFillChip,
                parsedDinars === 2000 && styles.quickFillChipActive,
              ]}
              onPress={() => handleQuickFill(2000)}
            >
              <ThemedText
                style={[
                  styles.quickFillText,
                  parsedDinars === 2000 && styles.quickFillTextActive,
                ]}
              >
                2000 DZD
              </ThemedText>
            </TouchableOpacity>
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
          {!isOverpaying && parsedDinars > 0 && (
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

        {/* Payment Method Selection */}
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
                name="money"
                size={22}
                color={
                  method === "cash" ? theme.primary : theme.textSecondary
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
                  method === "cash" ? theme.primary : theme.textSecondary
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
                    ? theme.primary
                    : theme.textSecondary
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
                    ? theme.primary
                    : theme.textSecondary
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
            placeholderTextColor={theme.textMuted}
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
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.errorLight,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.error,
    },
    customerName: {
      ...Typography.label,
      fontWeight: "600",
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
      gap: 8,
      backgroundColor: theme.errorLight,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginTop: Spacing.md,
    },
    warningText: {
      ...Typography.caption,
      color: theme.error,
      flex: 1,
    },
    previewBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.surfaceAlt,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginTop: Spacing.md,
    },
    previewLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    previewValue: {
      ...Typography.label,
      fontWeight: "700",
    },
    previewValueSettled: {
      color: theme.primary,
    },
    previewValueDebt: {
      color: theme.error,
    },
    methodRow: {
      gap: Spacing.sm,
    },
    methodCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    methodCardActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    methodInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    methodName: {
      ...Typography.label,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    methodNameActive: {
      color: theme.primary,
    },
    methodDescription: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginTop: 2,
    },
    noteInput: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.textPrimary,
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
      borderRadius: BorderRadius.xl,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelBtnText: {
      ...Typography.label,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    confirmBtn: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: BorderRadius.xl,
      backgroundColor: theme.primary,
      ...Shadows.sm,
    },
    confirmBtnDisabled: {
      opacity: 0.5,
    },
    confirmBtnText: {
      ...Typography.label,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
