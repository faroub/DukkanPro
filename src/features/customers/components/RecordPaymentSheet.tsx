import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { formatCentimes } from "@/utils/money";
import { useTheme } from "@/hooks/use-theme";
import { recordPayment, canRecordPayment, getCustomerDebt } from "@/services/customers/customerBalanceService";

interface RecordPaymentSheetProps {
  customerId: number;
  customerName: string;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

export function RecordPaymentSheet({ customerId, customerName, onClose, onPaymentRecorded }: RecordPaymentSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [amount, setAmount] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "electronic">("cash");
  const [note, setNote] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [customerDebt, setCustomerDebt] = useState<number>(0);

  useEffect(() => {
    async function loadDebt() {
      const debt = await getCustomerDebt(customerId);
      setCustomerDebt(debt);
    }
    loadDebt();
  }, [customerId]);

  const handleMethodChange = (method: "cash" | "electronic") => {
    setSelectedMethod(method);
  };

  const handleInputChange = (text: string) => {
    setAmount(text);
  };

  const handleRecordPayment = async () => {
    const amountValue = parseFloat(amount) || 0;

    if (isNaN(amountValue) || amountValue <= 0) {
      setError(t("customers:paymentInvalidAmount"));
      return;
    }

    const canPay = await canRecordPayment(customerId, amountValue);
    if (!canPay) {
      setError(t("customers:paymentOverlimit", { debt: formatCentimes(customerDebt) }));
      return;
    }

    setIsSaving(true);

    try {
      await recordPayment(customerId, amountValue, selectedMethod, note);
      onPaymentRecorded();
      onClose();
    } catch (err) {
      setError(t("common:error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView type="background">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText type="title" style={[styles.title, { color: theme.textPrimary }]}>
          {t("customers:recordPayment")}
        </ThemedText>

        <ThemedText type="body" style={[styles.label, { color: theme.textSecondary }]}>
          {t("customers:customerName")}: {customerName}
        </ThemedText>

        <ThemedText type="body" style={[styles.label, { color: theme.textSecondary }]}>
          {t("customers:amount")} *:
        </ThemedText>
        <TextInput
          value={amount}
          onChangeText={handleInputChange}
          placeholder={t("customers:amountPlaceholder")}
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          autoCapitalize="none"
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.textPrimary,
            },
          ]}
        />
        {error ? (
          <ThemedText type="caption" style={[styles.errorText, { color: theme.error }]}>
            {error}
          </ThemedText>
        ) : null}

        <ThemedText type="body" style={[styles.label, { marginTop: 16, color: theme.textSecondary }]}>
          {t("customers:paymentMethod")}:
        </ThemedText>
        <View style={[styles.methodOptions, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            style={[
              styles.methodButton,
              {
                backgroundColor: selectedMethod === "cash" ? theme.primary : theme.borderLight,
              },
            ]}
            onPress={() => handleMethodChange("cash")}
          >
            <ThemedText type="caption" style={{ color: selectedMethod === "cash" ? "#FFFFFF" : theme.textSecondary }}>
              {t("sales:cash")}
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.methodButton,
              {
                backgroundColor: selectedMethod === "electronic" ? theme.primary : theme.borderLight,
              },
            ]}
            onPress={() => handleMethodChange("electronic")}
          >
            <ThemedText type="caption" style={{ color: selectedMethod === "electronic" ? "#FFFFFF" : theme.textSecondary }}>
              {t("sales:electronic")}
            </ThemedText>
          </Pressable>
        </View>

        {note !== '' && (
          <View style={styles.noteSection}>
            <ThemedText type="body" style={[styles.label, { color: theme.textSecondary }]}>
              {t("customers:note")}
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={(text) => setNote(text)}
              placeholder={t("customers:notePlaceholder")}
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={2}
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={handleRecordPayment}
            style={[styles.button, { backgroundColor: theme.primary }]}
            disabled={isSaving}
          >
            <ThemedText type="body" style={styles.buttonText}>
              {t("customers:recordPayment")}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: 'center',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  methodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  methodButton: {
    padding: 8,
    minWidth: 100,
    borderRadius: 6,
    alignItems: 'center',
  },
  noteSection: {
    marginTop: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
