import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
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
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();
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
      style={[styles.container, { backgroundColor: theme.background }]}
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
            color={theme.textPrimary}
          />
          <ThemedText style={[styles.backButtonText, { color: theme.textPrimary }]}>
            {t("catalogue.selectProductsTitle")}
          </ThemedText>
        </TouchableOpacity>

        <View style={[styles.brochureBadge, { backgroundColor: theme.primaryLight }]} id="catalogue-brochure-badge">
          <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
          <ThemedText style={[styles.brochureBadgeText, { color: theme.primary }]}>
            {t("catalogue.previewSubtitle")}
          </ThemedText>
        </View>
      </View>

      {/* Screen Title */}
      <View style={styles.titleBlock} id="catalogue-preview-title">
        <ThemedText style={[styles.title, { color: theme.textPrimary }]}>
          {t("catalogue.previewTitle")}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Aperçu Client • Public Brochure
        </ThemedText>
      </View>

      {/* Privacy Guarantee Banner */}
      <View style={[styles.privacyBanner, { backgroundColor: theme.surface, borderColor: theme.borderLight }]} id="catalogue-preview-privacy-banner">
        <View style={[styles.privacyIconContainer, { backgroundColor: theme.primaryLight }]}>
          <MaterialIcons
            name="verified-user"
            size={22}
            color={theme.primary}
          />
        </View>
        <View style={styles.privacyContent}>
          <ThemedText style={[styles.privacyTitle, { color: theme.textPrimary }]}>
            {t("catalogue.publicDocument")}
          </ThemedText>
          <ThemedText style={[styles.privacyDesc, { color: theme.textSecondary }]}>
            {t("catalogue.publicDocNotice")}
          </ThemedText>
        </View>
        <View style={[styles.itemsPill, { backgroundColor: theme.surfaceAlt }]}>
          <ThemedText style={[styles.itemsPillText, { color: theme.textPrimary }]}>
            {displayProducts.length} {t("catalogue.itemsCount")}
          </ThemedText>
        </View>
      </View>

      {/* The Printable Brochure Sheet Card */}
      <View style={[styles.sheetCard, { backgroundColor: theme.surface, borderColor: theme.border }]} id="catalogue-sheet-document">
        {/* Top Green Accent Line */}
        <View style={[styles.accentLine, { backgroundColor: theme.primary }]} />

        {/* Store Header */}
        <View style={styles.sheetHeader}>
          <View style={[styles.storeIconCircle, { backgroundColor: theme.surfaceAlt }]}>
            <MaterialIcons
              name="storefront"
              size={28}
              color={theme.primary}
            />
          </View>
          <ThemedText style={[styles.storeTitle, { color: theme.textPrimary }]}>
            {settings.shopName || "Supérette El-Amel"}
          </ThemedText>
          <ThemedText style={[styles.storeCategory, { color: theme.textSecondary }]}>
            Alimentation Générale & Produits Frais
          </ThemedText>

          {/* Contact Details */}
          <View style={styles.contactRow}>
            {settings.address ? (
              <View style={styles.contactItem}>
                <MaterialIcons
                  name="place"
                  size={14}
                  color={theme.textSecondary}
                />
                <ThemedText style={[styles.contactText, { color: theme.textSecondary }]}>
                  {settings.address}
                </ThemedText>
              </View>
            ) : null}
            {settings.contact ? (
              <View style={styles.contactItem}>
                <MaterialIcons
                  name="chat"
                  size={14}
                  color={theme.primary}
                />
                <ThemedText style={[styles.contactText, { color: theme.primary, fontWeight: "600" }]}>
                  {settings.contact}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {/* Welcome Note Pill */}
          {settings.welcomeNote ? (
            <View style={[styles.welcomePill, { backgroundColor: theme.primaryLight }]}>
              <ThemedText style={[styles.welcomePillText, { color: theme.primary }]}>
                {settings.welcomeNote}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={[styles.sheetDivider, { backgroundColor: theme.borderLight }]} />

        {/* Product Items Table/List */}
        <View style={styles.productsList} id="brochure-products-list">
          {displayProducts.map((product, index) => {
            const isAvailable = product.stock > 0;
            return (
              <View
                key={product.id}
                style={[styles.sheetProductRow, { borderBottomColor: theme.surfaceAlt }]}
                id={`brochure-item-${product.id}`}
              >
                <ThemedText style={[styles.itemIndex, { color: theme.textMuted }]}>
                  {index + 1}.
                </ThemedText>
                <View style={styles.itemDetails}>
                  <ThemedText style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {product.name}
                  </ThemedText>
                  {product.category ? (
                    <ThemedText style={[styles.itemCategory, { color: theme.textSecondary }]}>
                      {product.category}
                    </ThemedText>
                  ) : null}
                </View>

                <View style={styles.itemRight}>
                  {settings.showPrices && (
                    <ThemedText style={[styles.itemPrice, { color: theme.primary }]}>
                      {formatCentimes(product.price_centimes)}
                    </ThemedText>
                  )}
                  <View
                    style={[
                      styles.statusBadge,
                      isAvailable ? { backgroundColor: theme.primaryLight } : { backgroundColor: theme.errorLight },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        isAvailable ? { color: theme.primary } : { color: theme.error },
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

        <View style={[styles.sheetDivider, { backgroundColor: theme.borderLight }]} />

        {/* Sheet Footer */}
        <View style={styles.sheetFooter}>
          <ThemedText style={[styles.thanksText, { color: theme.textPrimary }]}>
            {t("catalogue.thanksMessage")}
          </ThemedText>
          <View style={styles.footerMetaRow}>
            <MaterialIcons
              name="calendar-today"
              size={12}
              color={theme.textSecondary}
            />
            <ThemedText style={[styles.footerMetaText, { color: theme.textSecondary }]}>
              {t("catalogue.validNotice")} • {new Date().toLocaleDateString()}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Share Action Buttons */}
      <View style={styles.actionsContainer} id="catalogue-share-actions">
        {/* Share PDF Button */}
        <TouchableOpacity
          style={[styles.pdfShareButton, { backgroundColor: theme.primary }]}
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
          style={[styles.textShareButton, { backgroundColor: theme.surface, borderColor: theme.primary }]}
          onPress={handleShareText}
          disabled={sharingText}
          activeOpacity={0.8}
          id="btn-share-text"
        >
          {sharingText ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <>
              <MaterialIcons name="send" size={18} color={theme.primary} />
              <ThemedText style={[styles.textShareButtonText, { color: theme.primary }]}>
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
            color={theme.textSecondary}
          />
          <ThemedText style={[styles.editLinkText, { color: theme.textSecondary }]}>
            {t("catalogue.editSelection")}
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
  brochureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  brochureBadgeText: {
    ...Typography.badge,
  },
  titleBlock: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading1,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.caption,
  },
  privacyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
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
  privacyTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "700",
  },
  privacyDesc: {
    ...Typography.caption,
    fontSize: 12,
  },
  itemsPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  itemsPillText: {
    ...Typography.badge,
    fontSize: 11,
  },
  sheetCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  accentLine: {
    height: 6,
  },
  sheetHeader: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  storeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  storeTitle: {
    ...Typography.heading2,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  storeCategory: {
    ...Typography.caption,
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
  },
  welcomePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    marginTop: 4,
  },
  welcomePillText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  sheetDivider: {
    height: 1,
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
  },
  itemIndex: {
    ...Typography.body,
    fontWeight: "600",
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
  },
  itemCategory: {
    ...Typography.caption,
    fontSize: 12,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  itemPrice: {
    ...Typography.moneySm,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
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
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  pdfShareButton: {
    height: 52,
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
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  textShareButtonText: {
    ...Typography.body,
    fontWeight: "700",
  },
  editLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  editLinkText: {
    ...Typography.body,
  },
});
