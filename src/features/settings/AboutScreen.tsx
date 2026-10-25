import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * AboutScreen - Dedicated About DukkanPro information page.
 * - Displays brand logo, version, features, and developer trademark
 * - Exclusive location for the 'mzilab' trademark with direct link to https://mzilab.de
 */
export function AboutScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = i18n.language?.startsWith("ar");

  const currentYear = new Date().getFullYear();

  const handleOpenWebsite = () => {
    Linking.openURL("https://mzilab.de").catch((err) =>
      console.error("Failed to open URL", err)
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        {
          backgroundColor: theme.background,
          paddingTop: Math.max(insets.top, Spacing.lg),
          paddingBottom: insets.bottom + Spacing.xxl,
          paddingLeft: insets.left + Spacing.lg,
          paddingRight: insets.right + Spacing.lg,
        },
      ]}
      showsVerticalScrollIndicator={false}
      id="about-screen"
    >
      <ThemedView style={styles.container}>
        {/* Back Breadcrumb */}
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => router.back()}
          activeOpacity={0.7}
          id="btn-about-back"
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.textSecondary}
          />
          <ThemedText
            style={[styles.breadcrumbText, { color: theme.textSecondary }]}
          >
            {t("navigation.back") || "Back"}
          </ThemedText>
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <SymbolView
              name={{
                ios: "storefront.fill" as any,
                android: "storefront" as any,
                web: "storefront" as any,
              }}
              size={48}
              tintColor={theme.primary}
            />
          </View>

          <ThemedText style={[styles.title, { color: theme.textPrimary }]}>
            Dukkan
            <ThemedText style={[styles.title, { color: theme.primary }]}>
              Pro
            </ThemedText>
          </ThemedText>

          <View style={[styles.versionBadge, { backgroundColor: theme.primaryLight }]}>
            <ThemedText style={[styles.versionText, { color: theme.primary }]}>
              v2.4.1
            </ThemedText>
          </View>

          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {t("settings.aboutSubtitle") ||
              "DukkanPro, retail software for Algerian merchants"}
          </ThemedText>
        </View>

        {/* Core Capabilities Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ThemedText style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isArabic ? "المميزات الرئيسية" : "Features & Capabilities"}
          </ThemedText>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="point-of-sale" size={20} color={theme.primary} />
              <ThemedText style={[styles.featureText, { color: theme.textPrimary }]}>
                {isArabic ? "نقطة بيع سريعة ومسح الباركود" : "Fast POS Checkout & Barcode Scanner"}
              </ThemedText>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="menu-book" size={20} color={theme.primary} />
              <ThemedText style={[styles.featureText, { color: theme.textPrimary }]}>
                {isArabic ? "دفتر الديون والكريدي للزبائن" : "Customer Carnet & Credit Management"}
              </ThemedText>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="translate" size={20} color={theme.primary} />
              <ThemedText style={[styles.featureText, { color: theme.textPrimary }]}>
                {isArabic ? "محرك متعدد اللغات (عربية، فرنسية، إنجليزية)" : "Multi-Language Engine (Arabic, French, English)"}
              </ThemedText>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="security" size={20} color={theme.primary} />
              <ThemedText style={[styles.featureText, { color: theme.textPrimary }]}>
                {isArabic ? "بيانات مشفرة ومحلية تعمل دون إنترنت" : "Offline-First Encrypted SQLite Storage"}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Developer & Website Link Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ThemedText style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isArabic ? "المطور والعلامة التجارية" : "Developer & Trademark"}
          </ThemedText>

          <View style={styles.devRow}>
            <ThemedText style={[styles.devLabel, { color: theme.textSecondary }]}>
              {isArabic ? "المطور الرسمي:" : "Developer:"}
            </ThemedText>
            <ThemedText style={[styles.devValue, { color: theme.textPrimary }]}>
              mzilab
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[styles.websiteButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            onPress={handleOpenWebsite}
            activeOpacity={0.7}
            id="btn-open-mzilab"
          >
            <MaterialIcons name="language" size={20} color={theme.primary} />
            <ThemedText style={[styles.websiteText, { color: theme.primary }]}>
              mzilab.de
            </ThemedText>
            <MaterialIcons name="open-in-new" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Dedicated Trademark Footer with Direct Link */}
        <TouchableOpacity
          style={styles.trademarkFooter}
          onPress={handleOpenWebsite}
          activeOpacity={0.7}
          id="btn-trademark-link"
        >
          <ThemedText style={[styles.trademarkText, { color: theme.textMuted }]}>
            © mzilab {currentYear} • <ThemedText style={{ color: theme.primary, textDecorationLine: "underline" }}>mzilab.de</ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
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
  header: {
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
    ...Shadows.md,
    borderWidth: 1,
  },
  title: {
    ...Typography.heading1,
    fontSize: 26,
    textAlign: "center",
  },
  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    marginTop: 6,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  description: {
    ...Typography.bodyLarge,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardTitle: {
    ...Typography.heading3,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  featureList: {
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    ...Typography.body,
    fontSize: 14,
    flex: 1,
  },
  devRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  devLabel: {
    fontSize: 14,
  },
  devValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  websiteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  websiteText: {
    fontSize: 15,
    fontWeight: "700",
  },
  trademarkFooter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  trademarkText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
