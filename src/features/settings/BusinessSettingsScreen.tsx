import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { showToast } from "@/components/use-toast";
import {
  BorderRadius,
  Colors,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";

/**
 * BusinessSettingsScreen - Screen for managing store profile and receipt headers.
 * Sourced directly from Stitch design `3._business_profile_settings`.
 * - Business name, owner name, business type, phone number, address, and RC
 * - DZD currency displayed as fixed/locked
 * - Clean input wrappers with 48px height and icon prefixes
 * - Ledger sync reassurance card and save feedback
 * - Strictly LTR layout across all languages
 */
export function BusinessSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [businessName, setBusinessName] = useState("Supérette El-Amel");
  const [ownerName, setOwnerName] = useState("Karim Belkacem");
  const [businessType, setBusinessType] = useState(
    "Alimentation Générale / Superette"
  );
  const [phoneNumber, setPhoneNumber] = useState("+213 550 12 34 56");
  const [storeAddress, setStoreAddress] = useState(
    "Rue Didouche Mourad, Alger Centre"
  );
  const [rcNumber, setRcNumber] = useState("RC: 16/00-1234567");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(() => {
    if (!businessName.trim()) {
      showToast(t("errors.requiredField") || "Le nom du magasin est requis");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Profile saved successfully! / Profil enregistré !");
    }, 400);
  }, [businessName, t]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView style={styles.container}>
        {/* Breadcrumb Context */}
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={18} color={Colors.light.textSecondary} />
          <ThemedText style={styles.breadcrumbText}>
            {t("navigation.back") || "Back to More"}
          </ThemedText>
        </TouchableOpacity>

        {/* Screen Heading */}
        <View style={styles.headerSection}>
          <View style={styles.badgeRow}>
            <MaterialIcons name="verified" size={16} color={Colors.light.primary} />
            <ThemedText style={styles.badgeText}>Active Store Profile</ThemedText>
          </View>
          <ThemedText style={styles.headingTitle}>
            Business Profile & Identity
          </ThemedText>
          <ThemedText style={styles.headingSubtitle}>
            Information displayed on receipts, invoices, and payment reminders.
          </ThemedText>
        </View>

        {/* Store Photo / Header Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.photoContainer}>
            <MaterialIcons name="storefront" size={28} color={Colors.light.primary} />
          </View>
          <View style={styles.previewInfo}>
            <View style={styles.previewNameRow}>
              <ThemedText style={styles.previewName}>
                {businessName || "Supérette El-Amel"}
              </ThemedText>
              <MaterialIcons name="check-circle" size={18} color={Colors.light.primary} />
            </View>
            <ThemedText style={styles.previewLocation}>
              Alger Centre • DZD Account
            </ThemedText>
            <View style={styles.previewReceiptBadge}>
              <MaterialIcons name="receipt-long" size={14} color={Colors.light.primary} />
              <ThemedText style={styles.previewReceiptText}>
                Receipt Header Preview Active
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* 1. Business Name */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>Business Name</ThemedText>
              <ThemedText style={styles.fieldRequired}>Required</ThemedText>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="storefront"
                size={20}
                color={Colors.light.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Supérette El-Amel"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
          </View>

          {/* 2. Owner / Manager Name */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>Owner / Manager Name</ThemedText>
              <ThemedText style={styles.fieldRequired}>Required</ThemedText>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="person"
                size={20}
                color={Colors.light.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Karim Belkacem"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
          </View>

          {/* 3. Business Type */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>Business Type</ThemedText>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="category"
                size={20}
                color={Colors.light.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={businessType}
                onChangeText={setBusinessType}
                placeholder="Alimentation Générale / Superette"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
          </View>

          {/* 4. Phone Number */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>Phone Number</ThemedText>
              <View style={styles.whatsappBadge}>
                <MaterialIcons name="chat" size={13} color={Colors.light.primary} />
                <ThemedText style={styles.whatsappText}>WhatsApp</ThemedText>
              </View>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="call"
                size={20}
                color={Colors.light.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder="+213 550 12 34 56"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
            <ThemedText style={styles.fieldHelper}>
              Used to send automated customer debt reminders and POS receipts.
            </ThemedText>
          </View>

          {/* 5. Address / Location */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>Address / Location</ThemedText>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="location-on"
                size={20}
                color={Colors.light.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={storeAddress}
                onChangeText={setStoreAddress}
                placeholder="Rue Didouche Mourad, Alger Centre"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
          </View>

          {/* 6. Commercial Registry (RC) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>Commercial Registry (RC)</ThemedText>
              <ThemedText style={styles.fieldLegal}>Legal Info</ThemedText>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="badge"
                size={20}
                color={Colors.light.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={rcNumber}
                onChangeText={setRcNumber}
                placeholder="RC: 16/00-1234567"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
          </View>

          {/* 7. Currency (Locked / Display only) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>Currency</ThemedText>
              <View style={styles.lockedBadge}>
                <MaterialIcons name="lock" size={13} color={Colors.light.textMuted} />
                <ThemedText style={styles.lockedText}>Display only</ThemedText>
              </View>
            </View>
            <View style={[styles.inputWrapper, styles.inputDisabled]}>
              <MaterialIcons
                name="payments"
                size={20}
                color={Colors.light.textMuted}
                style={styles.inputIcon}
              />
              <ThemedText style={styles.disabledText}>DZD (Algerian Dinar)</ThemedText>
              <MaterialIcons name="lock" size={18} color={Colors.light.textMuted} />
            </View>
            <ThemedText style={styles.fieldHelper}>
              Fixed to Algerian Dinar for regional fiscal & ledger consistency.
            </ThemedText>
          </View>
        </View>

        {/* Ledger Sync Notification Card */}
        <View style={styles.syncCard}>
          <View style={styles.syncIconContainer}>
            <MaterialIcons name="security" size={22} color={Colors.light.primary} />
          </View>
          <View style={styles.syncContent}>
            <ThemedText style={styles.syncTitle}>Ledger Data Synced</ThemedText>
            <ThemedText style={styles.syncSubtitle}>
              Updated details synchronize automatically across linked POS terminals.
            </ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && { opacity: 0.8 }]}
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
            <ThemedText style={styles.cancelButtonText}>
              {t("common.cancel") || "Cancel"}
            </ThemedText>
          </TouchableOpacity>
        </View>
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
    backgroundColor: Colors.light.background,
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
    color: Colors.light.textSecondary,
  },
  headerSection: {
    gap: Spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  headingTitle: {
    ...Typography.heading2,
    color: Colors.light.textPrimary,
  },
  headingSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primaryLight,
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
    color: Colors.light.textPrimary,
  },
  previewLocation: {
    fontSize: 13,
    color: Colors.light.textSecondary,
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
    color: Colors.light.primary,
  },
  formCard: {
    backgroundColor: Colors.light.surface,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    color: Colors.light.textPrimary,
  },
  fieldRequired: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  fieldLegal: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  whatsappBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  whatsappText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lockedText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.button,
    paddingHorizontal: 12,
  },
  inputDisabled: {
    backgroundColor: Colors.light.surfaceAlt,
    borderColor: Colors.light.border,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: Colors.light.textPrimary,
  },
  disabledText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  fieldHelper: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  syncCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.surfaceAlt,
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  syncIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  syncContent: {
    flex: 1,
  },
  syncTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  syncSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  actionsContainer: {
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.button,
    ...Shadows.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
});
