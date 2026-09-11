import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export interface CatalogueSettingsData {
  showPrices: boolean;
  hideOutOfStock: boolean;
  shopName: string;
  contact: string;
  address: string;
  welcomeNote: string;
}

interface CatalogueSettingsProps {
  settings: CatalogueSettingsData;
  onSettingChange: <K extends keyof CatalogueSettingsData>(
    key: K,
    value: CatalogueSettingsData[K],
  ) => void;
  onProceedToSelector: () => void;
  onBack: () => void;
}

export function CatalogueSettings({
  settings,
  onSettingChange,
  onProceedToSelector,
  onBack,
}: CatalogueSettingsProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      id="catalogue-settings-scroll"
    >
      {/* Top Bar / Breadcrumb */}
      <View style={styles.topBar} id="catalogue-settings-topbar">
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          id="catalogue-settings-back-btn"
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={Colors.light.textPrimary}
          />
          <ThemedText style={styles.backButtonText}>
            {t("navigation.more")}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.readyBadge} id="catalogue-ready-badge">
          <View style={styles.pulseDot} />
          <ThemedText style={styles.readyBadgeText}>
            {t("catalogue.readyToShare")}
          </ThemedText>
        </View>
      </View>

      {/* Screen Title Block */}
      <View style={styles.headerBlock} id="catalogue-header-block">
        <ThemedText style={styles.title}>
          {t("catalogue.settingsTitle")}
        </ThemedText>
        <View style={styles.subtitleRow}>
          <MaterialIcons
            name="storefront"
            size={16}
            color={Colors.light.textSecondary}
          />
          <ThemedText style={styles.subtitle}>
            {t("catalogue.settingsSubtitle")} • {settings.shopName || "Supérette El-Amel"}
          </ThemedText>
        </View>
      </View>

      {/* Feature Intro Showcase Card */}
      <View style={styles.introCard} id="catalogue-intro-card">
        <View style={styles.introIconContainer}>
          <MaterialIcons
            name="menu-book"
            size={26}
            color={Colors.light.primary}
          />
        </View>
        <View style={styles.introContent}>
          <View style={styles.introHeadlineRow}>
            <ThemedText style={styles.introHeadline}>
              {t("catalogue.instantShowcase")}
            </ThemedText>
            <View style={styles.channelPill}>
              <MaterialIcons
                name="chat"
                size={12}
                color={Colors.light.secondary}
              />
              <ThemedText style={styles.channelPillText}>WhatsApp / SMS</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.introDesc}>
            {t("catalogue.instantShowcaseDesc")}
          </ThemedText>
        </View>
      </View>

      {/* Display Preferences Card */}
      <ThemedView style={styles.card} id="catalogue-preferences-card">
        <View style={styles.cardHeaderRow}>
          <MaterialIcons
            name="tune"
            size={20}
            color={Colors.light.primary}
          />
          <ThemedText style={styles.cardTitle}>
            {t("catalogue.displayPreferences")}
          </ThemedText>
        </View>

        {/* Toggle 1: Show Retail Prices */}
        <View style={styles.toggleRow} id="toggle-show-prices-row">
          <View style={styles.toggleInfo}>
            <View style={styles.toggleLabelRow}>
              <ThemedText style={styles.toggleLabel}>
                {t("catalogue.showRetailPrices")}
              </ThemedText>
              <View style={styles.currencyBadge}>
                <ThemedText style={styles.currencyBadgeText}>DZD</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.toggleDesc}>
              {t("catalogue.showRetailPricesDesc")}
            </ThemedText>
          </View>
          <Switch
            value={settings.showPrices}
            onValueChange={(val) => onSettingChange("showPrices", val)}
            trackColor={{
              false: Colors.light.disabledBackground,
              true: Colors.light.primary,
            }}
            thumbColor="#FFFFFF"
            id="switch-show-prices"
          />
        </View>

        <View style={styles.divider} />

        {/* Toggle 2: Hide Out-of-Stock */}
        <View style={styles.toggleRow} id="toggle-hide-stock-row">
          <View style={styles.toggleInfo}>
            <ThemedText style={styles.toggleLabel}>
              {t("catalogue.hideOutOfStock")}
            </ThemedText>
            <ThemedText style={styles.toggleDesc}>
              {t("catalogue.hideOutOfStockDesc")}
            </ThemedText>
          </View>
          <Switch
            value={settings.hideOutOfStock}
            onValueChange={(val) => onSettingChange("hideOutOfStock", val)}
            trackColor={{
              false: Colors.light.disabledBackground,
              true: Colors.light.primary,
            }}
            thumbColor="#FFFFFF"
            id="switch-hide-stock"
          />
        </View>
      </ThemedView>

      {/* Customer Header & Contact Card */}
      <ThemedView style={styles.card} id="catalogue-contact-card">
        <View style={styles.cardHeaderRow}>
          <MaterialIcons
            name="storefront"
            size={20}
            color={Colors.light.primary}
          />
          <ThemedText style={styles.cardTitle}>
            {t("catalogue.publicHeader")}
          </ThemedText>
          <View style={styles.editableTag}>
            <ThemedText style={styles.editableTagText}>
              {t("common.edit") || "Editable"}
            </ThemedText>
          </View>
        </View>

        {/* Shop Header Title */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            {t("catalogue.shopHeaderTitle")}
          </ThemedText>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="badge"
              size={18}
              color={Colors.light.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={settings.shopName}
              onChangeText={(val) => onSettingChange("shopName", val)}
              placeholder="Supérette El-Amel"
              placeholderTextColor={Colors.light.textMuted}
              id="input-shop-name"
            />
          </View>
        </View>

        {/* Order WhatsApp / Mobile */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <ThemedText style={styles.fieldLabel}>
              {t("catalogue.orderWhatsApp")}
            </ThemedText>
            <View style={styles.autoLinksBadge}>
              <MaterialIcons
                name="check-circle"
                size={12}
                color={Colors.light.primary}
              />
              <ThemedText style={styles.autoLinksText}>Auto-links</ThemedText>
            </View>
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="chat"
              size={18}
              color={Colors.light.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={settings.contact}
              onChangeText={(val) => onSettingChange("contact", val)}
              placeholder="+213 550 12 34 56"
              placeholderTextColor={Colors.light.textMuted}
              keyboardType="phone-pad"
              id="input-contact"
            />
          </View>
        </View>

        {/* Store Location / Address */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            {t("catalogue.storeLocation")}
          </ThemedText>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="place"
              size={18}
              color={Colors.light.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={settings.address}
              onChangeText={(val) => onSettingChange("address", val)}
              placeholder="Rue Didouche Mourad, Alger Centre"
              placeholderTextColor={Colors.light.textMuted}
              id="input-address"
            />
          </View>
        </View>

        {/* Welcome Note */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            {t("catalogue.welcomeNote")}
          </ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings.welcomeNote}
            onChangeText={(val) => onSettingChange("welcomeNote", val)}
            placeholder="Commandes par WhatsApp acceptées • Retrait rapide en boutique"
            placeholderTextColor={Colors.light.textMuted}
            multiline
            numberOfLines={2}
            id="input-welcome-note"
          />
        </View>
      </ThemedView>

      {/* Confidentiality Guaranteed Banner */}
      <View style={styles.privacyBanner} id="catalogue-privacy-guarantee">
        <View style={styles.privacyIconContainer}>
          <MaterialIcons
            name="verified-user"
            size={22}
            color={Colors.light.primary}
          />
        </View>
        <View style={styles.privacyContent}>
          <View style={styles.privacyTitleRow}>
            <ThemedText style={styles.privacyTitle}>
              {t("catalogue.guaranteedPrivacy")}
            </ThemedText>
            <MaterialIcons
              name="lock"
              size={14}
              color={Colors.light.primary}
            />
          </View>
          <ThemedText style={styles.privacyDesc}>
            {t("catalogue.guaranteedPrivacyDesc")}
          </ThemedText>
        </View>
      </View>

      {/* Action CTA Buttons */}
      <View style={styles.actionContainer} id="catalogue-settings-actions">
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onProceedToSelector}
          activeOpacity={0.8}
          id="btn-select-products"
        >
          <ThemedText style={styles.primaryButtonText}>
            {t("catalogue.selectProductsBtn")}
          </ThemedText>
          <MaterialIcons
            name="arrow-forward"
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
          activeOpacity={0.7}
          id="btn-cancel-settings"
        >
          <ThemedText style={styles.cancelButtonText}>
            {t("common.cancel")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxxxx,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  backButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  readyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  readyBadgeText: {
    ...Typography.badge,
    color: Colors.light.primary,
  },
  headerBlock: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading1,
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  introCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: Spacing.lg,
  },
  introIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  introContent: {
    flex: 1,
  },
  introHeadlineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  introHeadline: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  channelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  channelPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.secondary,
  },
  introDesc: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: Spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
    flex: 1,
  },
  editableTag: {
    backgroundColor: Colors.light.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  editableTagText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  toggleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  toggleLabel: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  currencyBadge: {
    backgroundColor: Colors.light.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currencyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  toggleDesc: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: Spacing.xs,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.light.textPrimary,
    marginBottom: 6,
  },
  autoLinksBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  autoLinksText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.textPrimary,
    height: "100%",
  },
  textArea: {
    height: 68,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FAFAFA",
    padding: Spacing.md,
    textAlignVertical: "top",
  },
  privacyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.primary + "25",
    marginBottom: Spacing.xxl,
  },
  privacyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  privacyTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  privacyDesc: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  actionContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    height: 52,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  primaryButtonText: {
    ...Typography.body,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
});
