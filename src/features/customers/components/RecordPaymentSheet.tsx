import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { formatCentimes } from "@/utils/money";
import { recordPayment, canRecordPayment, getCustomerDebt } from "@/services/customers/customerBalanceService";

interface RecordPaymentSheetProps {
  customerId: number;
  customerName: string;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

export function RecordPaymentSheet({ customerId, customerName, onClose, onPaymentRecorded }: RecordPaymentSheetProps) {
  const { t } = useTranslation();
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
      <View style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          {t("customers:recordPayment")}
        </ThemedText>

        <ThemedText type="body" style={styles.label}>
          {t("customers:customerName")}: {customerName}
        </ThemedText>

        <ThemedText type="body" style={styles.label}>
          {t("customers:amount")} *:
        </ThemedText>
        <TextInput
          value={amount}
          onChangeText={handleInputChange}
          placeholder={t("customers:amountPlaceholder")}
          keyboardType="number-pad"
          autoCapitalize="none"
          style={styles.input}
        />
        <ThemedText type="caption" style={styles.errorText}>
          {error}
        </ThemedText>

        <ThemedText type="body" style={{ ...styles.label, marginTop: 16 }}>
          {t("customers:paymentMethod")}:
        </ThemedText>
        <View style={styles.methodOptions}>
          <Pressable
            style={[
              styles.methodButton,
              selectedMethod === "cash" ? styles.methodActive : styles.methodInactive,
            ]}
            onPress={() => handleMethodChange("cash")}
          >
            <ThemedText type="caption" style={selectedMethod === "cash" ? styles.methodActiveText : styles.methodInactiveText}>
                {t("sell:cash")}
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.methodButton,
              selectedMethod === "electronic" ? styles.methodActive : styles.methodInactive,
            ]}
            onPress={() => handleMethodChange("electronic")}
          >
            <ThemedText type="caption" style={selectedMethod === "electronic" ? styles.methodActiveText : styles.methodInactiveText}>
                {t("sell:electronic")}
            </ThemedText>
          </Pressable>
        </View>

        {note !== '' && (
          <View style={styles.noteSection}>
            <ThemedText type="body" style={styles.label}>
              {t("customers:note")}
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={(text) => setNote(text)}
              placeholder={t("customers:notePlaceholder")}
              multiline
              numberOfLines={2}
              style={styles.input}
            />
          </View>
        )}

        <View style={styles.actions}>
          <Pressable onPress={handleRecordPayment} style={styles.button}>
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
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  methodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  methodButton: {
    padding: 8,
    minWidth: 100,
  },
  methodActive: {
    backgroundColor: '#1B6B3A',
  },
  methodInactive: {
    backgroundColor: '#F3F4F6',
  },
  methodText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  methodActiveText: {
    color: '#fff',
  },
  methodInactiveText: {
    color: Colors.light.textSecondary,
  },
  noteSection: {
    marginTop: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1B6B3A',
    alignItems: 'center',
    marginTop: 32,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});