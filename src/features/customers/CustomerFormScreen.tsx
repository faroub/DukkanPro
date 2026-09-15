import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
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
  const theme = useTheme();
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

  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

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
            {isEditing
              ? t("customers:editCustomer")
              : t("customers:addCustomer")}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {isEditing
              ? t("customers:updateInfoSubtitle")
              : t("customers:newCustomerSubtitle")}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Customer Name Input */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>
              {t("customers:nameRequired")}
            </ThemedText>
            <View
              style={[
                styles.inputWrapper,
                nameError && styles.inputWrapperError,
              ]}
            >
              <MaterialIcons
                name="person"
                size={20}
                color={theme.textSecondary}
                style={styles.fieldIcon}
              />
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError && text.trim()) setNameError(false);
                }}
                placeholder={t("customers:namePlaceholder")}
                placeholderTextColor={theme.textMuted}
                style={styles.textInput}
              />
            </View>
            {nameError && (
              <ThemedText style={styles.errorText}>
                {t("customers:nameRequiredError")}
              </ThemedText>
            )}
          </View>

          {/* Phone Number Input */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>
              {t("customers:phone")} ({t("common:optional")})
            </ThemedText>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="phone"
                size={20}
                color={theme.textSecondary}
                style={styles.fieldIcon}
              />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={t("customers:phonePlaceholder")}
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                style={styles.textInput}
              />
            </View>
            <ThemedText style={styles.helperText}>
              {t("customers:phoneHelperText")}
            </ThemedText>
          </View>

          {/* Notes Input */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>
              {t("customers:note")} ({t("common:optional")})
            </ThemedText>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <MaterialIcons
                name="notes"
                size={20}
                color={theme.textSecondary}
                style={[styles.fieldIcon, { marginTop: 2 }]}
              />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t("customers:notePlaceholder")}
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                style={[styles.textInput, styles.textAreaInput]}
              />
            </View>
          </View>
        </View>

        {/* Form Actions */}
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
                  {isEditing ? t("common:save") : t("customers:createCustomer")}
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
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
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
    card: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      gap: Spacing.lg,
      marginBottom: Spacing.lg,
      ...Shadows.sm,
    },
    fieldGroup: {
      gap: Spacing.xs,
    },
    fieldLabel: {
      ...Typography.caption,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      minHeight: 48,
      borderWidth: 1,
      borderColor: "transparent",
    },
    inputWrapperError: {
      borderColor: theme.error,
      backgroundColor: theme.errorLight,
    },
    fieldIcon: {
      marginRight: Spacing.sm,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      color: theme.textPrimary,
      paddingVertical: Spacing.sm,
    },
    textAreaWrapper: {
      alignItems: "flex-start",
      paddingVertical: Spacing.sm,
    },
    textAreaInput: {
      minHeight: 70,
      textAlignVertical: "top",
    },
    errorText: {
      ...Typography.caption,
      color: theme.error,
      marginTop: 2,
    },
    helperText: {
      ...Typography.caption,
      color: theme.textSecondary,
      fontSize: 11,
      marginTop: 2,
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
    saveBtn: {
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
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      ...Typography.label,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
