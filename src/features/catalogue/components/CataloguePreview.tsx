import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import {
    CatalogueProduct,
    shareCataloguePDF,
    shareCatalogueText,
} from "@/services/catalogue/catalogueService";
import { formatCentimes } from "@/utils/money";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

export interface CataloguePreviewSettings {
  showPrices: boolean;
  hideOutOfStock: boolean;
  shopName: string;
  contact: string;
  address: string;
  welcomeNote: string;
}

interface CataloguePreviewProps {
  products: CatalogueProduct[];
  settings: CataloguePreviewSettings;
  onEditSelection: () => void;
  onBack: () => void;
}

export function CataloguePreview({
  products,
  settings,
  onEditSelection,
  onBack,
}: CataloguePreviewProps) {
  const { t } = useTranslation();
  const [sharingPDF, setSharingPDF] = useState(false);
  const [sharingText, setSharingText] = useState(false);

  // Filter products based on out-of-stock setting
  const displayProducts = products.filter(
    (p) => !settings.hideOutOfStock || p.stock > 0,
  );

  const handleSharePDF = async () => {
    if (sharingPDF) return;
    setSharingPDF(true);
    try {
      await shareCataloguePDF(settings, displayProducts, t);
    } catch (err) {
      Alert.alert(
        t("common.error"),
        err instanceof Error ? err.message : "Failed to share PDF",
      );
    } finally {
      setSharingPDF(false);
    }
  };

  const handleShareText = async () => {
    if (sharingText) return;
    setSharingText(true);
    try {
      await shareCatalogueText(settings, displayProducts, t);
    } catch (err) {
      Alert.alert(
        t("common.error"),
        err instanceof Error ? err.message : "Failed to share message",
      );
    } finally {
      setSharingText(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      id="catalogue-preview-screen"
    >
      {/* Top Bar */}
      <View style={styles.topBar} id="catalogue-preview-topbar">
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          id="catalogue-preview-back-btn"
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={Colors.light.textPrimary}
          />
          <ThemedText style={styles.backButtonText}>
            {t("catalogue.selectProductsTitle")}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.brochureBadge} id="catalogue-brochure-badge">
          <View style={styles.pulseDot} />
          <ThemedText style={styles.brochureBadgeText}>
            {t("catalogue.previewSubtitle")}
          </ThemedText>
        </View>
      </View>

      {/* Screen Title */}
      <View style={styles.titleBlock} id="catalogue-preview-title">
        <ThemedText style={styles.title}>
          {t("catalogue.previewTitle")}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Aperçu Client • Public Brochure
        </ThemedText>
      </View>

      {/* Privacy Guarantee Banner */}
      <View style={styles.privacyBanner} id="catalogue-preview-privacy-banner">
        <View style={styles.privacyIconContainer}>
          <MaterialIcons
            name="verified-user"
            size={22}
            color={Colors.light.primary}
          />
        </View>
        <View style={styles.privacyContent}>
          <ThemedText style={styles.privacyTitle}>
            {t("catalogue.publicDocument")}
          </ThemedText>
          <ThemedText style={styles.privacyDesc}>
            {t("catalogue.publicDocNotice")}
          </ThemedText>
        </View>
        <View style={styles.itemsPill}>
          <ThemedText style={styles.itemsPillText}>
            {displayProducts.length} {t("catalogue.itemsCount")}
          </ThemedText>
        </View>
      </View>

      {/* The Printable Brochure Sheet Card */}
      <View style={styles.sheetCard} id="catalogue-sheet-document">
        {/* Top Green Accent Line */}
        <View style={styles.accentLine} />

        {/* Store Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.storeIconCircle}>
            <MaterialIcons
              name="storefront"
              size={28}
              color={Colors.light.primary}
            />
          </View>
          <ThemedText style={styles.storeTitle}>
            {settings.shopName || "Supérette El-Amel"}
          </ThemedText>
          <ThemedText style={styles.storeCategory}>
            Alimentation Générale & Produits Frais
          </ThemedText>

          {/* Contact Details */}
          <View style={styles.contactRow}>
            {settings.address ? (
              <View style={styles.contactItem}>
                <MaterialIcons
                  name="place"
                  size={14}
                  color={Colors.light.textSecondary}
                />
                <ThemedText style={styles.contactText}>
                  {settings.address}
                </ThemedText>
              </View>
            ) : null}
            {settings.contact ? (
              <View style={styles.contactItem}>
                <MaterialIcons
                  name="chat"
                  size={14}
                  color={Colors.light.primary}
                />
                <ThemedText style={[styles.contactText, { color: Colors.light.primary, fontWeight: "600" }]}>
                  {settings.contact}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {/* Welcome Note Pill */}
          {settings.welcomeNote ? (
            <View style={styles.welcomePill}>
              <ThemedText style={styles.welcomePillText}>
                {settings.welcomeNote}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.sheetDivider} />

        {/* Product Items Table/List */}
        <View style={styles.productsList} id="brochure-products-list">
          {displayProducts.map((product, index) => {
            const isAvailable = product.stock > 0;
            return (
              <View
                key={product.id}
                style={styles.sheetProductRow}
                id={`brochure-item-${product.id}`}
              >
                <ThemedText style={styles.itemIndex}>
                  {index + 1}.
                </ThemedText>
                <View style={styles.itemDetails}>
                  <ThemedText style={styles.itemName} numberOfLines={1}>
                    {product.name}
                  </ThemedText>
                  {product.category ? (
                    <ThemedText style={styles.itemCategory}>
                      {product.category}
                    </ThemedText>
                  ) : null}
                </View>

                <View style={styles.itemRight}>
                  {settings.showPrices && (
                    <ThemedText style={styles.itemPrice}>
                      {formatCentimes(product.price_centimes)}
                    </ThemedText>
                  )}
                  <View
                    style={[
                      styles.statusBadge,
                      isAvailable ? styles.statusAvail : styles.statusOut,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        isAvailable ? styles.statusTextAvail : styles.statusTextOut,
                      ]}
                    >
                      {isAvailable
                        ? t("catalogue.available")
                        : t("catalogue.outOfStock")}
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sheetDivider} />

        {/* Sheet Footer */}
        <View style={styles.sheetFooter}>
          <ThemedText style={styles.thanksText}>
            {t("catalogue.thanksMessage")}
          </ThemedText>
          <View style={styles.footerMetaRow}>
            <MaterialIcons
              name="calendar-today"
              size={12}
              color={Colors.light.textSecondary}
            />
            <ThemedText style={styles.footerMetaText}>
              {t("catalogue.validNotice")} • {new Date().toLocaleDateString()}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Share Action Buttons */}
      <View style={styles.actionsContainer} id="catalogue-share-actions">
        {/* Share PDF Button */}
        <TouchableOpacity
          style={styles.pdfShareButton}
          onPress={handleSharePDF}
          disabled={sharingPDF}
          activeOpacity={0.8}
          id="btn-share-pdf"
        >
          {sharingPDF ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" />
              <ThemedText style={styles.pdfShareButtonText}>
                {t("catalogue.shareAsPdf")} ↗
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Share WhatsApp / Text Button */}
        <TouchableOpacity
          style={styles.textShareButton}
          onPress={handleShareText}
          disabled={sharingText}
          activeOpacity={0.8}
          id="btn-share-text"
        >
          {sharingText ? (
            <ActivityIndicator color={Colors.light.primary} size="small" />
          ) : (
            <>
              <MaterialIcons name="send" size={18} color={Colors.light.primary} />
              <ThemedText style={styles.textShareButtonText}>
                {t("catalogue.shareAsWhatsApp")}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Edit Selection Link */}
        <TouchableOpacity
          style={styles.editLink}
          onPress={onEditSelection}
          activeOpacity={0.7}
          id="btn-edit-selection"
        >
          <MaterialIcons
            name="edit"
            size={16}
            color={Colors.light.textSecondary}
          />
          <ThemedText style={styles.editLinkText}>
            {t("catalogue.editSelection")}
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
  brochureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  brochureBadgeText: {
    ...Typography.badge,
    color: Colors.light.primary,
  },
  titleBlock: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading1,
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  privacyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: Spacing.lg,
  },
  privacyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  privacyDesc: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  itemsPill: {
    backgroundColor: Colors.light.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  itemsPillText: {
    ...Typography.badge,
    color: Colors.light.textPrimary,
    fontSize: 11,
  },
  sheetCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  accentLine: {
    height: 6,
    backgroundColor: Colors.light.primary,
  },
  sheetHeader: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  storeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  storeTitle: {
    ...Typography.heading2,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    marginBottom: 2,
    textAlign: "center",
  },
  storeCategory: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  welcomePill: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    marginTop: 4,
  },
  welcomePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
    textAlign: "center",
  },
  sheetDivider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginHorizontal: Spacing.lg,
  },
  productsList: {
    padding: Spacing.lg,
  },
  sheetProductRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surfaceAlt,
  },
  itemIndex: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.textMuted,
    width: 24,
  },
  itemDetails: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  itemName: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  itemCategory: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  itemPrice: {
    ...Typography.moneySm,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  statusAvail: {
    backgroundColor: Colors.light.primaryLight,
  },
  statusOut: {
    backgroundColor: Colors.light.errorLight,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusTextAvail: {
    color: Colors.light.primary,
  },
  statusTextOut: {
    color: Colors.light.error,
  },
  sheetFooter: {
    padding: Spacing.lg,
    alignItems: "center",
    gap: 4,
  },
  thanksText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  footerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerMetaText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  pdfShareButton: {
    height: 52,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pdfShareButtonText: {
    ...Typography.body,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  textShareButton: {
    height: 48,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  textShareButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  editLink: {
    height: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  editLinkText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
});
