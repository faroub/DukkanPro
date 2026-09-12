import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
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
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
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
            color={theme.textPrimary}
          />
          <ThemedText style={[styles.backButtonText, { color: theme.textPrimary }]}>
            {t("navigation.more")}
          </ThemedText>
        </TouchableOpacity>

        <View style={[styles.readyBadge, { backgroundColor: theme.primaryLight }]} id="catalogue-ready-badge">
          <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
          <ThemedText style={[styles.readyBadgeText, { color: theme.primary }]}>
            {t("catalogue.readyToShare")}
          </ThemedText>
        </View>
      </View>

      {/* Screen Title Block */}
      <View style={styles.headerBlock} id="catalogue-header-block">
        <ThemedText style={[styles.title, { color: theme.textPrimary }]}>
          {t("catalogue.settingsTitle")}
        </ThemedText>
        <View style={styles.subtitleRow}>
          <MaterialIcons
            name="storefront"
            size={16}
            color={theme.textSecondary}
          />
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t("catalogue.settingsSubtitle")} • {settings.shopName || "Supérette El-Amel"}
          </ThemedText>
        </View>
      </View>

      {/* Feature Intro Showcase Card */}
      <View style={[styles.introCard, { backgroundColor: theme.surface, borderColor: theme.border }]} id="catalogue-intro-card">
        <View style={[styles.introIconContainer, { backgroundColor: theme.primaryLight }]}>
          <MaterialIcons
            name="menu-book"
            size={26}
            color={theme.primary}
          />
        </View>
        <View style={styles.introContent}>
          <View style={styles.introHeadlineRow}>
            <ThemedText style={[styles.introHeadline, { color: theme.textPrimary }]}>
              {t("catalogue.instantShowcase")}
            </ThemedText>
            <View style={[styles.channelPill, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons
                name="chat"
                size={12}
                color={theme.primary}
              />
              <ThemedText style={[styles.channelPillText, { color: theme.primary }]}>WhatsApp / SMS</ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.introDesc, { color: theme.textSecondary }]}>
            {t("catalogue.instantShowcaseDesc")}
          </ThemedText>
        </View>
      </View>

      {/* Display Preferences Card */}
      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} id="catalogue-preferences-card">
        <View style={styles.cardHeaderRow}>
          <MaterialIcons
            name="tune"
            size={20}
            color={theme.primary}
          />
          <ThemedText style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {t("catalogue.displayPreferences")}
          </ThemedText>
        </View>

        {/* Toggle 1: Show Retail Prices */}
        <View style={styles.toggleRow} id="toggle-show-prices-row">
          <View style={styles.toggleInfo}>
            <View style={styles.toggleLabelRow}>
              <ThemedText style={[styles.toggleLabel, { color: theme.textPrimary }]}>
                {t("catalogue.showRetailPrices")}
              </ThemedText>
              <View style={[styles.currencyBadge, { backgroundColor: theme.surfaceAlt }]}>
                <ThemedText style={[styles.currencyBadgeText, { color: theme.textSecondary }]}>DZD</ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.toggleDesc, { color: theme.textSecondary }]}>
              {t("catalogue.showRetailPricesDesc")}
            </ThemedText>
          </View>
          <Switch
            value={settings.showPrices}
            onValueChange={(val) => onSettingChange("showPrices", val)}
            trackColor={{
              false: theme.border,
              true: theme.primary,
            }}
            thumbColor="#FFFFFF"
            id="switch-show-prices"
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Toggle 2: Hide Out-of-Stock */}
        <View style={styles.toggleRow} id="toggle-hide-stock-row">
          <View style={styles.toggleInfo}>
            <ThemedText style={[styles.toggleLabel, { color: theme.textPrimary }]}>
              {t("catalogue.hideOutOfStock")}
            </ThemedText>
            <ThemedText style={[styles.toggleDesc, { color: theme.textSecondary }]}>
              {t("catalogue.hideOutOfStockDesc")}
            </ThemedText>
          </View>
          <Switch
            value={settings.hideOutOfStock}
            onValueChange={(val) => onSettingChange("hideOutOfStock", val)}
            trackColor={{
              false: theme.border,
              true: theme.primary,
            }}
            thumbColor="#FFFFFF"
            id="switch-hide-stock"
          />
        </View>
      </ThemedView>

      {/* Customer Header & Contact Card */}
      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} id="catalogue-contact-card">
        <View style={styles.cardHeaderRow}>
          <MaterialIcons
            name="storefront"
            size={20}
            color={theme.primary}
          />
          <ThemedText style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {t("catalogue.publicHeader")}
          </ThemedText>
          <View style={[styles.editableTag, { backgroundColor: theme.surfaceAlt }]}>
            <ThemedText style={[styles.editableTagText, { color: theme.textSecondary }]}>
              {t("common.edit") || "Editable"}
            </ThemedText>
          </View>
        </View>

        {/* Shop Header Title */}
        <View style={styles.fieldGroup}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textPrimary }]}>
            {t("catalogue.shopHeaderTitle")}
          </ThemedText>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
            <MaterialIcons
              name="badge"
              size={18}
              color={theme.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              value={settings.shopName}
              onChangeText={(val) => onSettingChange("shopName", val)}
              placeholder="Supérette El-Amel"
              placeholderTextColor={theme.textMuted}
              id="input-shop-name"
            />
          </View>
        </View>

        {/* Order WhatsApp / Mobile */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textPrimary }]}>
              {t("catalogue.orderWhatsApp")}
            </ThemedText>
            <View style={styles.autoLinksBadge}>
              <MaterialIcons
                name="check-circle"
                size={12}
                color={theme.primary}
              />
              <ThemedText style={[styles.autoLinksText, { color: theme.primary }]}>Auto-links</ThemedText>
            </View>
          </View>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
            <MaterialIcons
              name="chat"
              size={18}
              color={theme.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              value={settings.contact}
              onChangeText={(val) => onSettingChange("contact", val)}
              placeholder="+213 550 12 34 56"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              id="input-contact"
            />
          </View>
        </View>

        {/* Store Location / Address */}
        <View style={styles.fieldGroup}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textPrimary }]}>
            {t("catalogue.storeLocation")}
          </ThemedText>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
            <MaterialIcons
              name="place"
              size={18}
              color={theme.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              value={settings.address}
              onChangeText={(val) => onSettingChange("address", val)}
              placeholder="Rue Didouche Mourad, Alger Centre"
              placeholderTextColor={theme.textMuted}
              id="input-address"
            />
          </View>
        </View>

        {/* Welcome Note */}
        <View style={styles.fieldGroup}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textPrimary }]}>
            {t("catalogue.welcomeNote")}
          </ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: theme.border, backgroundColor: theme.surfaceAlt, color: theme.textPrimary }]}
            value={settings.welcomeNote}
            onChangeText={(val) => onSettingChange("welcomeNote", val)}
            placeholder="Commandes par WhatsApp acceptées • Retrait rapide en boutique"
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={2}
            id="input-welcome-note"
          />
        </View>
      </ThemedView>

      {/* Confidentiality Guaranteed Banner */}
      <View style={[styles.privacyBanner, { backgroundColor: theme.primaryLight, borderColor: theme.primary + "25" }]} id="catalogue-privacy-guarantee">
        <View style={[styles.privacyIconContainer, { backgroundColor: theme.surface }]}>
          <MaterialIcons
            name="verified-user"
            size={22}
            color={theme.primary}
          />
        </View>
        <View style={styles.privacyContent}>
          <View style={styles.privacyTitleRow}>
            <ThemedText style={[styles.privacyTitle, { color: theme.primary }]}>
              {t("catalogue.guaranteedPrivacy")}
            </ThemedText>
            <MaterialIcons
              name="lock"
              size={14}
              color={theme.primary}
            />
          </View>
          <ThemedText style={[styles.privacyDesc, { color: theme.textSecondary }]}>
            {t("catalogue.guaranteedPrivacyDesc")}
          </ThemedText>
        </View>
      </View>

      {/* Action CTA Buttons */}
      <View style={styles.actionContainer} id="catalogue-settings-actions">
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
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
          <ThemedText style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
            {t("common.cancel")}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Footer Trademark */}
      <FooterTrademark />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  readyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  readyBadgeText: {
    ...Typography.badge,
  },
  headerBlock: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading1,
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subtitle: {
    ...Typography.caption,
  },
  introCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  introIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
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
  },
  channelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  channelPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  introDesc: {
    ...Typography.caption,
    lineHeight: 20,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
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
    flex: 1,
  },
  editableTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  editableTagText: {
    ...Typography.caption,
    fontSize: 12,
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
  },
  currencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currencyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  toggleDesc: {
    ...Typography.caption,
  },
  divider: {
    height: 1,
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
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    height: "100%",
  },
  textArea: {
    height: 68,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    textAlignVertical: "top",
  },
  privacyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.xxl,
  },
  privacyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  },
  privacyDesc: {
    ...Typography.caption,
    lineHeight: 18,
  },
  actionContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    height: 52,
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
  },
});
