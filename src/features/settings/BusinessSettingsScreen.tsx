/**
 * BusinessSettingsScreen — Merchant Profile & Shop Configuration
 *
 * Fully integrated with Stitch design exports:
 * - Live Header Card preview with receipt header simulation
 * - Structured form cards with icons & validation
 * - WhatsApp phone number integration hint
 * - Currency selector: DZD (default), EUR, USD
 *
 * All state is persisted to SQLite business_profiles table via repository.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  ComponentDimensions,
} from "@/constants/theme";
import * as businessProfile from "@/database/repositories/businessProfileRepository";
import { useTheme } from "@/hooks/use-theme";

export function BusinessSettingsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [currency, setCurrency] = useState<"DZD" | "EUR" | "USD">("DZD");
  const [isSaving, setIsSaving] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);

  // Load the stored profile once, so the form reflects what's saved on disk.
  useEffect(() => {
    businessProfile.get().then((profile) => {
      if (!profile) return;
      setProfileId(profile.id);
      setBusinessName(profile.business_name);
      setOwnerName(profile.owner_name);
      setBusinessType(profile.business_type);
      setPhoneNumber(profile.phone_number ?? "");
      setStoreAddress(profile.address ?? "");
      setRcNumber(profile.rc_number ?? "");
      setCurrency((profile.currency as any) || "DZD");
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!businessName.trim()) {
      showToast(t("errors.requiredField") || "Le nom du magasin est requis");
      return;
    }
    setIsSaving(true);
    try {
      const shared = {
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        business_type: businessType.trim() || "grocery",
        currency: currency || "DZD",
        selected_locale: "fr" as const,
        phone_number: phoneNumber.trim() || null,
        address: storeAddress.trim() || null,
        rc_number: rcNumber.trim() || null,
      };
      if (profileId !== null) {
        await businessProfile.update({ id: profileId, ...shared });
      } else {
        const created = await businessProfile.create(shared);
        setProfileId(created.id);
      }
      showToast(t("settings.profileSaved") || "Profile saved successfully!");
    } catch (error) {
      console.error("Failed to save business profile:", error);
      Alert.alert(
        t("common.error") || "Error",
        t("settings.saveFailed") || "Failed to save profile changes."
      );
    } finally {
      setIsSaving(false);
    }
  }, [businessName, ownerName, businessType, currency, phoneNumber, storeAddress, rcNumber, profileId, t]);

  const showToast = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("", message);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        {
          backgroundColor: theme.background,
          paddingTop: Math.max(insets.top, Spacing.sm),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.container}>
        {/* Breadcrumb Back Navigation */}
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={theme.primary}
          />
          <ThemedText
            style={[styles.breadcrumbText, { color: theme.primary }]}
          >
            {t("common.back") || "Retour à Plus"}
          </ThemedText>
        </TouchableOpacity>

        {/* Section Header */}
        <View style={styles.headerSection}>
          <View
            style={[
              styles.badgeRow,
              { backgroundColor: theme.primaryLight },
            ]}
          >
            <MaterialIcons
              name="verified"
              size={14}
              color={theme.primary}
            />
            <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
              {t("settings.activeProfile") || "Active Store Profile"}
            </ThemedText>
          </View>
          <ThemedText
            style={[styles.headingTitle, { color: theme.textPrimary }]}
          >
            {t("settings.businessProfile") || "Business Profile & Identity"}
          </ThemedText>
          <ThemedText
            style={[styles.headingSubtitle, { color: theme.textSecondary }]}
          >
            {t("settings.businessProfileSub") ||
              "Information displayed on receipts, invoices, and payment reminders."}
          </ThemedText>
        </View>

        {/* Live Receipt Card Header Preview */}
        <View
          style={[
            styles.previewCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.photoContainer,
              { backgroundColor: theme.primaryLight },
            ]}
          >
            <MaterialIcons
              name="storefront"
              size={32}
              color={theme.primary}
            />
          </View>
          <View style={styles.previewInfo}>
            <View style={styles.previewNameRow}>
              <ThemedText
                style={[styles.previewName, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                {businessName.trim() || t("settings.shopNamePlaceholder") || "Dukkan Store"}
              </ThemedText>
              <MaterialIcons
                name="check-circle"
                size={16}
                color={theme.primary}
              />
            </View>
            <ThemedText
              style={[
                styles.previewLocation,
                { color: theme.textSecondary },
              ]}
              numberOfLines={1}
            >
              {storeAddress || t("settings.addressPlaceholder") || "Address not set"} • {currency} Account
            </ThemedText>
            <View style={styles.previewReceiptBadge}>
              <MaterialIcons
                name="receipt-long"
                size={14}
                color={theme.secondary}
              />
              <ThemedText
                style={[styles.previewReceiptText, { color: theme.secondary }]}
              >
                {t("settings.receiptHeaderPreview") || "Receipt Header Preview Active"}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Form Container Card */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {/* 1. Business Name */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText
                style={[styles.fieldLabel, { color: theme.textPrimary }]}
              >
                {t("settings.businessName") || "Business Name"}
              </ThemedText>
              <ThemedText
                style={[styles.fieldRequired, { color: theme.error }]}
              >
                Required
              </ThemedText>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <MaterialIcons
                name="storefront"
                size={20}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Supérette El-Amel"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* 2. Owner / Manager Name */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText
                style={[styles.fieldLabel, { color: theme.textPrimary }]}
              >
                {t("settings.ownerName") || "Owner / Manager Name"}
              </ThemedText>
              <ThemedText
                style={[styles.fieldRequired, { color: theme.error }]}
              >
                Required
              </ThemedText>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <MaterialIcons
                name="person"
                size={20}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Karim Belkacem"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* 3. Business Type */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText
                style={[styles.fieldLabel, { color: theme.textPrimary }]}
              >
                {t("settings.businessType") || "Business Type"}
              </ThemedText>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <MaterialIcons
                name="category"
                size={20}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                value={businessType}
                onChangeText={setBusinessType}
                placeholder="Alimentation Générale / Superette"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* 4. Phone Number (WhatsApp Enabled) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText
                style={[styles.fieldLabel, { color: theme.textPrimary }]}
              >
                {t("settings.phoneNumber") || "Phone Number"}
              </ThemedText>
              <View style={styles.whatsappBadge}>
                <MaterialIcons name="chat" size={13} color={theme.primary} />
                <ThemedText
                  style={[styles.whatsappText, { color: theme.primary }]}
                >
                  WhatsApp
                </ThemedText>
              </View>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <MaterialIcons
                name="phone"
                size={20}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+213 550 12 34 56"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            <ThemedText
              style={[styles.fieldHelper, { color: theme.textSecondary }]}
            >
              Used to send automated customer debt reminders and POS receipts.
            </ThemedText>
          </View>

          {/* 5. Address / Location */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText
                style={[styles.fieldLabel, { color: theme.textPrimary }]}
              >
                {t("settings.storeAddress") || "Address / Location"}
              </ThemedText>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <MaterialIcons
                name="place"
                size={20}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                value={storeAddress}
                onChangeText={setStoreAddress}
                placeholder="Rue Didouche Mourad, Alger Centre"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* 6. Commercial Registry (RC Number) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText
                style={[styles.fieldLabel, { color: theme.textPrimary }]}
              >
                {t("settings.rcNumber") || "Commercial Registry (RC)"}
              </ThemedText>
              <ThemedText
                style={[styles.fieldLegal, { color: theme.textMuted }]}
              >
                Legal Info
              </ThemedText>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <MaterialIcons
                name="subtitles"
                size={20}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                value={rcNumber}
                onChangeText={setRcNumber}
                placeholder="RC: 16/00-1234567"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* 7. Currency Selection */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText
                style={[styles.fieldLabel, { color: theme.textPrimary }]}
              >
                {t("settings.currency") || "Currency"}
              </ThemedText>
            </View>
            <View style={styles.currencyChipsRow}>
              {[
                { code: "DZD", label: "DZD (د.ج)", sub: "Algerian Dinar" },
                { code: "EUR", label: "EUR (€)", sub: "Euro" },
                { code: "USD", label: "USD ($)", sub: "US Dollar" },
              ].map((item) => {
                const isSelected = currency === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.currencyChip,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.surfaceAlt,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setCurrency(item.code as any)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.currencyChipText,
                        { color: isSelected ? theme.primary : theme.textPrimary },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.currencyChipSub,
                        { color: isSelected ? theme.primary : theme.textMuted },
                      ]}
                    >
                      {item.sub}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
            <ThemedText
              style={[styles.fieldHelper, { color: theme.textSecondary }]}
            >
              {t("settings.currencyHelper") || "Selected currency will be used across receipts, sales, and products."}
            </ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.primary },
              isSaving && { opacity: 0.8 },
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
            <ThemedText style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save Changes / Enregistrer"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.cancelButtonText, { color: theme.textSecondary }]}
            >
              {t("common.cancel") || "Cancel"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Footer Trademark */}
        <FooterTrademark />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "transparent",
    gap: Spacing.md,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    alignSelf: "flex-start",
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerSection: {
    gap: Spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  headingTitle: {
    ...Typography.heading2,
  },
  headingSubtitle: {
    ...Typography.caption,
    lineHeight: 20,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: {
    flex: 1,
    minWidth: 0,
  },
  previewNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewName: {
    fontSize: 18,
    fontWeight: "600",
  },
  previewLocation: {
    fontSize: 13,
    marginTop: 2,
  },
  previewReceiptBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  previewReceiptText: {
    fontSize: 12,
    fontWeight: "600",
  },
  formCard: {
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: ComponentDimensions.formFieldGap,
    ...Shadows.sm,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  fieldRequired: {
    fontSize: 12,
  },
  fieldLegal: {
    fontSize: 12,
  },
  whatsappBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  whatsappText: {
    fontSize: 12,
    fontWeight: "600",
  },
  currencyChipsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  currencyChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  currencyChipSub: {
    fontSize: 10,
    marginTop: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: ComponentDimensions.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
  },
  fieldHelper: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  saveButton: {
    height: ComponentDimensions.buttonHeight,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...Shadows.md,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    height: ComponentDimensions.buttonHeight - 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
