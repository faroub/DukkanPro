import { useRouter, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useOnboarding, type OnboardingProfile } from "@/hooks/useOnboarding";
import { useTheme } from "@/hooks/use-theme";
import { getCurrencySymbol } from "@/utils/money";
import { useTranslation } from "react-i18next";

interface EmptyDashboardScreenProps {
  onAddProduct?: () => void;
  onNewSale?: () => void;
  onAddCustomer?: () => void;
  onOpenSettings?: () => void;
}

export function EmptyDashboardScreen({
  onAddProduct,
  onNewSale,
  onAddCustomer,
  onOpenSettings,
}: EmptyDashboardScreenProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);

  useEffect(() => {
    let mounted = true;
    useOnboarding.getBusinessProfile().then((res) => {
      if (mounted && res) {
        setProfile(res);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleNewSale = () => {
    if (onNewSale) {
      onNewSale();
    } else {
      router.push("/(tabs)/sell" as Href);
    }
  };

  const handleAddProduct = () => {
    if (onAddProduct) {
      onAddProduct();
    } else {
      router.push("/products/new" as Href);
    }
  };

  const handleAddCustomer = () => {
    if (onAddCustomer) {
      onAddCustomer();
    } else {
      router.push("/customers/new" as Href);
    }
  };

  const handleSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      router.push("/(tabs)/more" as Href);
    }
  };

  const businessName =
    profile?.businessName ||
    t("onboarding.businessName.defaultShopName", {
      defaultValue: "Supérette El-Amel",
    });

  const ownerName = profile?.ownerName || "Karim Benali";
  const currencySymbol = getCurrencySymbol(profile?.currency || "DZD", i18n.language);
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header Bar matching Stitch */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, Spacing.md),
            backgroundColor: theme.surface,
            borderBottomColor: theme.borderLight,
          },
        ]}
      >
        <View style={styles.logoAndBrand}>
          <View style={[styles.logoBadge, { backgroundColor: theme.primaryLight }]}>
            <SymbolView
              name={{
                ios: "storefront.fill" as any,
                android: "storefront" as any,
                web: "storefront" as any,
              }}
              size={20}
              tintColor={theme.primary}
            />
          </View>
          <View style={styles.brandTextWrapper}>
            <ThemedText style={[styles.brandTitle, { color: theme.textPrimary }]}>
              Dukkan<ThemedText style={[styles.brandTitle, { color: theme.primary }]}>Pro</ThemedText>
            </ThemedText>
            <ThemedText style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
              {t("onboarding.emptyDashboard.brandSubtitle", {
                defaultValue: "Empty Dashboard",
              })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.notificationButton}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <SymbolView
              name={{
                ios: "bell" as any,
                android: "notifications" as any,
                web: "notifications" as any,
              }}
              size={22}
              tintColor={theme.textSecondary}
            />
          </Pressable>

          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <SymbolView
              name={{
                ios: "person.fill" as any,
                android: "person" as any,
                web: "person" as any,
              }}
              size={18}
              tintColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting & Shop Profile Card matching Stitch */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.profileInfo}>
            <View style={[styles.readyBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.readyBadgeText, { color: theme.primary }]}>
                {t("onboarding.emptyDashboard.readyBadge", {
                  defaultValue: "Ready to trade",
                })}
              </Text>
            </View>

            <ThemedText style={[styles.welcomeHeading, { color: theme.textPrimary }]} numberOfLines={1}>
              {t("onboarding.emptyDashboard.welcome", {
                name: businessName,
                defaultValue: `Welcome, ${businessName}!`,
              })}
            </ThemedText>

            <View style={styles.shopOwnerRow}>
              <SymbolView
                name={{
                  ios: "storefront" as any,
                  android: "storefront" as any,
                  web: "storefront" as any,
                }}
                size={15}
                tintColor={theme.textMuted}
              />
              <ThemedText style={[styles.shopOwnerText, { color: theme.textSecondary }]} numberOfLines={1}>
                {t("onboarding.emptyDashboard.ownerDetails", {
                  owner: ownerName,
                  city: "Algiers",
                  defaultValue: `Owner: ${ownerName} • Algiers`,
                })}
              </ThemedText>
            </View>
          </View>

          <Pressable
            style={[styles.settingsButton, { backgroundColor: theme.backgroundElement }]}
            onPress={handleSettings}
            accessibilityRole="button"
            accessibilityLabel="Store Settings"
          >
            <SymbolView
              name={{
                ios: "slider.horizontal.3" as any,
                android: "tune" as any,
                web: "tune" as any,
              }}
              size={20}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        </View>

        {/* Today's Summary Card matching Stitch */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleGroup}>
              <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
              <ThemedText style={[styles.summaryTitle, { color: theme.textPrimary }]}>
                {t("onboarding.emptyDashboard.todaySummary", {
                  defaultValue: "Today's Summary",
                })}
              </ThemedText>
            </View>
            <ThemedText style={[styles.summaryTime, { color: theme.textSecondary }]}>
              {t("onboarding.emptyDashboard.justNow", {
                defaultValue: "Just now",
              })}
            </ThemedText>
          </View>

          <View style={styles.summaryGrid}>
            {/* Sales */}
            <View style={[styles.summaryTile, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.summaryTileHeader}>
                <SymbolView
                  name={{
                    ios: "banknote" as any,
                    android: "payments" as any,
                    web: "payments" as any,
                  }}
                  size={14}
                  tintColor={theme.textSecondary}
                />
                <Text style={[styles.summaryTileLabel, { color: theme.textSecondary }]}>
                  {t("onboarding.emptyDashboard.salesLabel", {
                    defaultValue: "Sales",
                  })}
                </Text>
              </View>
              <View style={styles.summaryTileValueRow}>
                <Text style={[styles.summaryTileNumber, { color: theme.textPrimary }]}>0</Text>
                <Text style={[styles.summaryCurrency, { color: theme.textSecondary }]}>{currencySymbol}</Text>
              </View>
            </View>

            {/* Receipts */}
            <View style={[styles.summaryTile, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.summaryTileHeader}>
                <SymbolView
                  name={{
                    ios: "doc.plaintext" as any,
                    android: "receipt_long" as any,
                    web: "receipt_long" as any,
                  }}
                  size={14}
                  tintColor={theme.textSecondary}
                />
                <Text style={[styles.summaryTileLabel, { color: theme.textSecondary }]}>
                  {t("onboarding.emptyDashboard.receiptsLabel", {
                    defaultValue: "Receipts",
                  })}
                </Text>
              </View>
              <View style={styles.summaryTileValueRow}>
                <Text style={[styles.summaryTileNumber, { color: theme.textPrimary }]}>0</Text>
              </View>
            </View>

            {/* Buyers */}
            <View style={[styles.summaryTile, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.summaryTileHeader}>
                <SymbolView
                  name={{
                    ios: "person.2" as any,
                    android: "group" as any,
                    web: "group" as any,
                  }}
                  size={14}
                  tintColor={theme.textSecondary}
                />
                <Text style={[styles.summaryTileLabel, { color: theme.textSecondary }]}>
                  {t("onboarding.emptyDashboard.buyersLabel", {
                    defaultValue: "Buyers",
                  })}
                </Text>
              </View>
              <View style={styles.summaryTileValueRow}>
                <Text style={[styles.summaryTileNumber, { color: theme.textPrimary }]}>0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Empty State Hero Banner matching Stitch */}
        <View style={[styles.heroBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.heroIconCircle, { backgroundColor: theme.primaryLight }]}>
            <SymbolView
              name={{
                ios: "archivebox.fill" as any,
                android: "inventory_2" as any,
                web: "inventory_2" as any,
              }}
              size={32}
              tintColor={theme.primary}
            />
          </View>

          <ThemedText style={[styles.heroTitle, { color: theme.textPrimary }]}>
            {t("onboarding.emptyDashboard.heroTitle", {
              defaultValue: "Start by adding your first product",
            })}
          </ThemedText>

          <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            {t("onboarding.emptyDashboard.heroSubtitle", {
              defaultValue:
                "Create your product catalog to start making sales and recording customer debts easily.",
            })}
          </ThemedText>

          <Pressable
            style={[styles.heroCtaButton, { backgroundColor: theme.primary }]}
            onPress={handleAddProduct}
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.emptyDashboard.addFirstProduct", {
              defaultValue: "Add your first product",
            })}
          >
            <SymbolView
              name={{
                ios: "plus.circle.fill" as any,
                android: "add_circle" as any,
                web: "add_circle" as any,
              }}
              size={20}
              tintColor="#FFFFFF"
            />
            <Text style={styles.heroCtaButtonText}>
              {t("onboarding.emptyDashboard.addFirstProduct", {
                defaultValue: "Add your first product",
              })}
            </Text>
          </Pressable>
        </View>

        {/* Quick Action Buttons Section matching Stitch */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsHeader}>
            <ThemedText style={[styles.quickActionsTitle, { color: theme.textPrimary }]}>
              {t("onboarding.emptyDashboard.quickActions", {
                defaultValue: "Quick actions",
              })}
            </ThemedText>
            <ThemedText style={[styles.quickActionsSub, { color: theme.textSecondary }]}>
              {t("onboarding.emptyDashboard.shortcuts", {
                defaultValue: "Shortcuts",
              })}
            </ThemedText>
          </View>

          <View style={styles.quickActionsGrid}>
            {/* Action 1: New Sale */}
            <Pressable
              style={[styles.quickActionTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleNewSale}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBubble, { backgroundColor: theme.primaryLight }]}>
                <SymbolView
                  name={{
                    ios: "cart.fill" as any,
                    android: "point_of_sale" as any,
                    web: "point_of_sale" as any,
                  }}
                  size={20}
                  tintColor={theme.primary}
                />
              </View>
              <Text style={[styles.actionTileTitle, { color: theme.textPrimary }]}>
                {t("onboarding.emptyDashboard.newSale", {
                  defaultValue: "New Sale",
                })}
              </Text>
              <Text style={[styles.actionTileSubtitle, { color: theme.textMuted }]}>
                {t("onboarding.emptyDashboard.newSaleSub", {
                  defaultValue: "Quick POS",
                })}
              </Text>
            </Pressable>

            {/* Action 2: Add Product */}
            <Pressable
              style={[styles.quickActionTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleAddProduct}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBubble, { backgroundColor: theme.backgroundElement }]}>
                <SymbolView
                  name={{
                    ios: "barcode" as any,
                    android: "barcode_scanner" as any,
                    web: "barcode_scanner" as any,
                  }}
                  size={20}
                  tintColor={theme.textPrimary}
                />
              </View>
              <Text style={[styles.actionTileTitle, { color: theme.textPrimary }]}>
                {t("onboarding.emptyDashboard.addProduct", {
                  defaultValue: "Add Product",
                })}
              </Text>
              <Text style={[styles.actionTileSubtitle, { color: theme.textMuted }]}>
                {t("onboarding.emptyDashboard.addProductSub", {
                  defaultValue: "Scan or type",
                })}
              </Text>
            </Pressable>

            {/* Action 3: Add Customer */}
            <Pressable
              style={[styles.quickActionTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleAddCustomer}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBubble, { backgroundColor: theme.backgroundElement }]}>
                <SymbolView
                  name={{
                    ios: "person.badge.plus" as any,
                    android: "person_add" as any,
                    web: "person_add" as any,
                  }}
                  size={20}
                  tintColor={theme.textPrimary}
                />
              </View>
              <Text style={[styles.actionTileTitle, { color: theme.textPrimary }]}>
                {t("onboarding.emptyDashboard.addCustomer", {
                  defaultValue: "Add Customer",
                })}
              </Text>
              <Text style={[styles.actionTileSubtitle, { color: theme.textMuted }]}>
                {t("onboarding.emptyDashboard.addCustomerSub", {
                  defaultValue: "Carnet crédit",
                })}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Getting Started Guide Pill Card matching Stitch */}
        <Pressable
          style={[styles.guideCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handleAddProduct}
          accessibilityRole="button"
        >
          <View style={styles.guideLeft}>
            <View style={[styles.guideIconWrapper, { backgroundColor: theme.warningLight }]}>
              <SymbolView
                name={{
                  ios: "lightbulb.fill" as any,
                  android: "lightbulb" as any,
                  web: "lightbulb" as any,
                }}
                size={18}
                tintColor={theme.warning}
              />
            </View>

            <View style={styles.guideTextWrapper}>
              <ThemedText style={[styles.guideTitle, { color: theme.textPrimary }]}>
                {t("onboarding.emptyDashboard.gettingStarted", {
                  defaultValue: "Getting started guide",
                })}
              </ThemedText>
              <ThemedText style={[styles.guideSubtitle, { color: theme.textSecondary }]}>
                {t("onboarding.emptyDashboard.step1Of3", {
                  defaultValue: "Step 1 of 3: Add initial stock",
                })}
              </ThemedText>
            </View>
          </View>

          <SymbolView
            name={{
              ios: "chevron.right" as any,
              android: "chevron_right" as any,
              web: "chevron_right" as any,
            }}
            size={20}
            tintColor={theme.textMuted}
          />
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ComponentDimensions.screenPadding,
    height: 56,
    borderBottomWidth: 1,
  },
  logoAndBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  brandTextWrapper: {
    justifyContent: "center",
  },
  brandTitle: {
    ...Typography.label,
    fontWeight: "700",
    lineHeight: 16,
  },
  brandSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderRadius: BorderRadius.xl,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    ...Shadows.sm,
  },
  profileInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  readyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  welcomeHeading: {
    ...Typography.heading2,
  },
  shopOwnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  shopOwnerText: {
    ...Typography.caption,
    fontSize: 12,
    flex: 1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    borderRadius: BorderRadius.xl,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    ...Shadows.sm,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  summaryTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryTitle: {
    ...Typography.label,
  },
  summaryTime: {
    ...Typography.caption,
    fontSize: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  summaryTile: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    minHeight: 74,
    justifyContent: "space-between",
  },
  summaryTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryTileLabel: {
    ...Typography.caption,
    fontSize: 12,
  },
  summaryTileValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginTop: 4,
  },
  summaryTileNumber: {
    ...Typography.moneySmall,
    fontWeight: "700",
  },
  summaryCurrency: {
    fontSize: 10,
    fontWeight: "600",
  },
  heroBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    alignItems: "center",
    textAlign: "center",
    ...Shadows.sm,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...Typography.heading3,
    textAlign: "center",
    marginBottom: 6,
    maxWidth: 280,
  },
  heroSubtitle: {
    ...Typography.caption,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.lg,
    maxWidth: 300,
  },
  heroCtaButton: {
    width: "100%",
    height: 46,
    borderRadius: BorderRadius.button,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  heroCtaButtonText: {
    color: "#FFFFFF",
    ...Typography.label,
    fontSize: 15,
  },
  quickActionsSection: {
    gap: Spacing.xs,
  },
  quickActionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  quickActionsTitle: {
    ...Typography.label,
  },
  quickActionsSub: {
    ...Typography.caption,
    fontSize: 12,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  quickActionTile: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    ...Shadows.sm,
  },
  actionIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  actionTileTitle: {
    ...Typography.caption,
    fontWeight: "600",
    textAlign: "center",
  },
  actionTileSubtitle: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: BorderRadius.xl,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    ...Shadows.sm,
  },
  guideLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  guideIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  guideTextWrapper: {
    flex: 1,
  },
  guideTitle: {
    ...Typography.label,
  },
  guideSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
});
