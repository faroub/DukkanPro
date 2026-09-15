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
  Colors,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useOnboarding, type OnboardingProfile } from "@/hooks/useOnboarding";
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
  const { t } = useTranslation();
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
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      {/* Top Header Bar matching Stitch */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <View style={styles.logoAndBrand}>
          <View style={styles.logoBadge}>
            <SymbolView
              name={{
                ios: "storefront.fill" as any,
                android: "storefront" as any,
                web: "storefront" as any,
              }}
              size={20}
              tintColor={Colors.light.primary}
            />
          </View>
          <View style={styles.brandTextWrapper}>
            <ThemedText style={styles.brandTitle}>
              Dukkan<ThemedText style={[styles.brandTitle, { color: Colors.light.primary }]}>Pro</ThemedText>
            </ThemedText>
            <ThemedText style={styles.brandSubtitle}>
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
              tintColor={Colors.light.textSecondary}
            />
          </Pressable>

          <View style={styles.avatarCircle}>
            <SymbolView
              name={{
                ios: "person.fill" as any,
                android: "person" as any,
                web: "person" as any,
              }}
              size={18}
              tintColor={Colors.light.surface}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting & Shop Profile Card matching Stitch */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>
                {t("onboarding.emptyDashboard.readyBadge", {
                  defaultValue: "Ready to trade",
                })}
              </Text>
            </View>

            <ThemedText style={styles.welcomeHeading} numberOfLines={1}>
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
                tintColor={Colors.light.textMuted}
              />
              <ThemedText style={styles.shopOwnerText} numberOfLines={1}>
                {t("onboarding.emptyDashboard.ownerDetails", {
                  owner: ownerName,
                  city: "Algiers",
                  defaultValue: `Owner: ${ownerName} • Algiers`,
                })}
              </ThemedText>
            </View>
          </View>

          <Pressable
            style={styles.settingsButton}
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
              tintColor={Colors.light.textSecondary}
            />
          </Pressable>
        </View>

        {/* Today's Summary Card matching Stitch */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleGroup}>
              <View style={styles.pulseDot} />
              <ThemedText style={styles.summaryTitle}>
                {t("onboarding.emptyDashboard.todaySummary", {
                  defaultValue: "Today's Summary",
                })}
              </ThemedText>
            </View>
            <ThemedText style={styles.summaryTime}>
              {t("onboarding.emptyDashboard.justNow", {
                defaultValue: "Just now",
              })}
            </ThemedText>
          </View>

          <View style={styles.summaryGrid}>
            {/* Sales */}
            <View style={styles.summaryTile}>
              <View style={styles.summaryTileHeader}>
                <SymbolView
                  name={{
                    ios: "banknote" as any,
                    android: "payments" as any,
                    web: "payments" as any,
                  }}
                  size={14}
                  tintColor={Colors.light.textSecondary}
                />
                <Text style={styles.summaryTileLabel}>
                  {t("onboarding.emptyDashboard.salesLabel", {
                    defaultValue: "Sales",
                  })}
                </Text>
              </View>
              <View style={styles.summaryTileValueRow}>
                <Text style={styles.summaryTileNumber}>0</Text>
                <Text style={styles.summaryCurrency}>DZD</Text>
              </View>
            </View>

            {/* Receipts */}
            <View style={styles.summaryTile}>
              <View style={styles.summaryTileHeader}>
                <SymbolView
                  name={{
                    ios: "doc.plaintext" as any,
                    android: "receipt_long" as any,
                    web: "receipt_long" as any,
                  }}
                  size={14}
                  tintColor={Colors.light.textSecondary}
                />
                <Text style={styles.summaryTileLabel}>
                  {t("onboarding.emptyDashboard.receiptsLabel", {
                    defaultValue: "Receipts",
                  })}
                </Text>
              </View>
              <View style={styles.summaryTileValueRow}>
                <Text style={styles.summaryTileNumber}>0</Text>
              </View>
            </View>

            {/* Buyers */}
            <View style={styles.summaryTile}>
              <View style={styles.summaryTileHeader}>
                <SymbolView
                  name={{
                    ios: "person.2" as any,
                    android: "group" as any,
                    web: "group" as any,
                  }}
                  size={14}
                  tintColor={Colors.light.textSecondary}
                />
                <Text style={styles.summaryTileLabel}>
                  {t("onboarding.emptyDashboard.buyersLabel", {
                    defaultValue: "Buyers",
                  })}
                </Text>
              </View>
              <View style={styles.summaryTileValueRow}>
                <Text style={styles.summaryTileNumber}>0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Empty State Hero Banner matching Stitch */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconCircle}>
            <SymbolView
              name={{
                ios: "archivebox.fill" as any,
                android: "inventory_2" as any,
                web: "inventory_2" as any,
              }}
              size={32}
              tintColor={Colors.light.primary}
            />
          </View>

          <ThemedText style={styles.heroTitle}>
            {t("onboarding.emptyDashboard.heroTitle", {
              defaultValue: "Start by adding your first product",
            })}
          </ThemedText>

          <ThemedText style={styles.heroSubtitle}>
            {t("onboarding.emptyDashboard.heroSubtitle", {
              defaultValue:
                "Create your product catalog to start making sales and recording customer debts easily.",
            })}
          </ThemedText>

          <Pressable
            style={styles.heroCtaButton}
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
              tintColor={Colors.light.surface}
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
            <ThemedText style={styles.quickActionsTitle}>
              {t("onboarding.emptyDashboard.quickActions", {
                defaultValue: "Quick actions",
              })}
            </ThemedText>
            <ThemedText style={styles.quickActionsSub}>
              {t("onboarding.emptyDashboard.shortcuts", {
                defaultValue: "Shortcuts",
              })}
            </ThemedText>
          </View>

          <View style={styles.quickActionsGrid}>
            {/* Action 1: New Sale */}
            <Pressable
              style={styles.quickActionTile}
              onPress={handleNewSale}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconBubble, styles.actionIconPrimary]}>
                <SymbolView
                  name={{
                    ios: "cart.fill" as any,
                    android: "point_of_sale" as any,
                    web: "point_of_sale" as any,
                  }}
                  size={20}
                  tintColor={Colors.light.primary}
                />
              </View>
              <Text style={styles.actionTileTitle}>
                {t("onboarding.emptyDashboard.newSale", {
                  defaultValue: "New Sale",
                })}
              </Text>
              <Text style={styles.actionTileSubtitle}>
                {t("onboarding.emptyDashboard.newSaleSub", {
                  defaultValue: "Quick POS",
                })}
              </Text>
            </Pressable>

            {/* Action 2: Add Product */}
            <Pressable
              style={styles.quickActionTile}
              onPress={handleAddProduct}
              accessibilityRole="button"
            >
              <View style={styles.actionIconBubble}>
                <SymbolView
                  name={{
                    ios: "barcode" as any,
                    android: "barcode_scanner" as any,
                    web: "barcode_scanner" as any,
                  }}
                  size={20}
                  tintColor={Colors.light.textPrimary}
                />
              </View>
              <Text style={styles.actionTileTitle}>
                {t("onboarding.emptyDashboard.addProduct", {
                  defaultValue: "Add Product",
                })}
              </Text>
              <Text style={styles.actionTileSubtitle}>
                {t("onboarding.emptyDashboard.addProductSub", {
                  defaultValue: "Scan or type",
                })}
              </Text>
            </Pressable>

            {/* Action 3: Add Customer */}
            <Pressable
              style={styles.quickActionTile}
              onPress={handleAddCustomer}
              accessibilityRole="button"
            >
              <View style={styles.actionIconBubble}>
                <SymbolView
                  name={{
                    ios: "person.badge.plus" as any,
                    android: "person_add" as any,
                    web: "person_add" as any,
                  }}
                  size={20}
                  tintColor={Colors.light.textPrimary}
                />
              </View>
              <Text style={styles.actionTileTitle}>
                {t("onboarding.emptyDashboard.addCustomer", {
                  defaultValue: "Add Customer",
                })}
              </Text>
              <Text style={styles.actionTileSubtitle}>
                {t("onboarding.emptyDashboard.addCustomerSub", {
                  defaultValue: "Carnet crédit",
                })}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Getting Started Guide Pill Card matching Stitch */}
        <Pressable
          style={styles.guideCard}
          onPress={handleAddProduct}
          accessibilityRole="button"
        >
          <View style={styles.guideLeft}>
            <View style={styles.guideIconWrapper}>
              <SymbolView
                name={{
                  ios: "lightbulb.fill" as any,
                  android: "lightbulb" as any,
                  web: "lightbulb" as any,
                }}
                size={18}
                tintColor={Colors.light.warning}
              />
            </View>

            <View style={styles.guideTextWrapper}>
              <ThemedText style={styles.guideTitle}>
                {t("onboarding.emptyDashboard.gettingStarted", {
                  defaultValue: "Getting started guide",
                })}
              </ThemedText>
              <ThemedText style={styles.guideSubtitle}>
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
            tintColor={Colors.light.textMuted}
          />
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
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
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  brandTextWrapper: {
    justifyContent: "center",
  },
  brandTitle: {
    ...Typography.label,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    lineHeight: 16,
  },
  brandSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.primary,
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
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  profileInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  readyBadge: {
    backgroundColor: Colors.light.primaryLight,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.primaryDark,
  },
  welcomeHeading: {
    ...Typography.heading2,
    color: Colors.light.textPrimary,
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
    color: Colors.light.textSecondary,
    flex: 1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    backgroundColor: Colors.light.primary,
  },
  summaryTitle: {
    ...Typography.label,
    color: Colors.light.textPrimary,
  },
  summaryTime: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: Colors.light.backgroundElement,
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
    color: Colors.light.textSecondary,
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
    color: Colors.light.textPrimary,
  },
  summaryCurrency: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  heroBanner: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    textAlign: "center",
    ...Shadows.sm,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
    textAlign: "center",
    marginBottom: 6,
    maxWidth: 280,
  },
  heroSubtitle: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.lg,
    maxWidth: 300,
  },
  heroCtaButton: {
    width: "100%",
    height: 46,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  heroCtaButtonText: {
    color: Colors.light.surface,
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
    color: Colors.light.textPrimary,
  },
  quickActionsSub: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  quickActionTile: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  actionIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  actionIconPrimary: {
    backgroundColor: Colors.light.primaryLight,
  },
  actionTileTitle: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  actionTileSubtitle: {
    fontSize: 10,
    color: Colors.light.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    backgroundColor: Colors.light.warningLight,
    justifyContent: "center",
    alignItems: "center",
  },
  guideTextWrapper: {
    flex: 1,
  },
  guideTitle: {
    ...Typography.label,
    color: Colors.light.textPrimary,
  },
  guideSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
