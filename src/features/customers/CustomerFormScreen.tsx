import React, { useState, useEffect, useCallback } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  getById,
  create,
  update,
} from "@/database/repositories/customerRepository";

interface CustomerFormScreenProps {
  customerId?: number;
}

export function CustomerFormScreen({ customerId }: CustomerFormScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; customerId?: string }>();

  const resolvedId = customerId || (params.id ? Number(params.id) : params.customerId ? Number(params.customerId) : undefined);
  const isEditing = !!resolvedId;

  const [loading, setLoading] = useState(isEditing);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!resolvedId) return;

    async function loadCustomer() {
      try {
        const customer = await getById(resolvedId!);
        if (customer) {
          setName(customer.name);
          setPhone(customer.phone || "");
          setNote(customer.note || "");
        }
      } catch (err) {
        Alert.alert(t("common:error"), t("customers:notFound"));
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [resolvedId, t]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(true);
      return;
    }

    setNameError(false);
    setIsSaving(true);

    try {
      if (isEditing && resolvedId) {
        await update(resolvedId, {
          name: trimmedName,
          phone: phone.trim() || undefined,
          note: note.trim() || undefined,
        });
      } else {
        await create({
          name: trimmedName,
          phone: phone.trim() || null,
          note: note.trim() || null,
          is_active: true,
        });
      }
      router.back();
    } catch (err) {
      Alert.alert(t("common:error"), t("customers:errorSave"));
    } finally {
      setIsSaving(false);
    }
  }, [name, phone, note, isEditing, resolvedId, router, t]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

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
            {isEditing ? t("customers:editCustomer") : t("customers:newCustomer")}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {t("customers:carnetDette")}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Main Form Card */}
        <View style={styles.card}>
          <ThemedText style={styles.cardSectionTitle}>
            {t("customers:identityAndContact")}
          </ThemedText>

          {/* Customer Name Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>
                {t("customers:customerName")}
              </ThemedText>
              <ThemedText style={styles.requiredAsterisk}>*</ThemedText>
            </View>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError && text.trim()) setNameError(false);
              }}
              placeholder={t("customers:customerNamePlaceholder")}
              placeholderTextColor={Colors.light.textMuted}
              autoCapitalize="words"
              style={[styles.input, nameError && styles.inputError]}
            />
            {nameError && (
              <ThemedText style={styles.errorText}>
                {t("customers:nameRequired")}
              </ThemedText>
            )}
            <ThemedText style={styles.fieldHint}>
              {t("customers:nameHelp")}
            </ThemedText>
          </View>

          {/* Phone Number Field */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>
              {t("customers:phone")}
            </ThemedText>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder={t("customers:phonePlaceholder")}
              placeholderTextColor={Colors.light.textMuted}
              keyboardType="phone-pad"
              autoCapitalize="none"
              style={styles.input}
            />
            <ThemedText style={styles.fieldHint}>
              {t("customers:phoneHelp")}
            </ThemedText>
          </View>

          {/* Merchant Note Field */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>
              {t("customers:merchantNote")}
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t("customers:notePlaceholder")}
              placeholderTextColor={Colors.light.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[styles.input, styles.textArea]}
            />
            <ThemedText style={styles.fieldHint}>
              {t("customers:noteHelp")}
            </ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <ThemedText style={styles.cancelBtnText}>
              {t("common:cancel")}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <ThemedText style={styles.saveBtnText}>
                  {isEditing
                    ? t("customers:saveChanges")
                    : t("customers:createCustomer")}
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: Spacing.lg,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    marginBottom: 6,
  },
  requiredAsterisk: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.destructive,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: Colors.light.destructive,
  },
  textArea: {
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.destructive,
    marginTop: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
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
  saveBtn: {
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
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
