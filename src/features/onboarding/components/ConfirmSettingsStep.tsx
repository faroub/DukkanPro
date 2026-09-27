import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
import { useTranslation } from "react-i18next";

interface ConfirmSettingsStepProps {
  businessName: string;
  ownerName: string;
  businessType: string;
  currency?: string;
  onConfirm: () => void;
  onEditStep: (stepIndex: number) => void;
  onBack?: () => void;
  stepNumber?: number;
  totalSteps?: number;
}

export function ConfirmSettingsStep({
  businessName,
  ownerName,
  businessType,
  currency = "DZD",
  onConfirm,
  onEditStep,
  onBack,
  stepNumber = 3,
  totalSteps = 3,
}: ConfirmSettingsStepProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const categoryNames: Record<string, string> = {
    grocery: t("onboarding.businessType.grocery", {
      defaultValue: "Grocery shop",
    }),
    bakery: t("onboarding.businessType.bakery", {
      defaultValue: "Home bakery",
    }),
    instagram_seller: t("onboarding.businessType.instagram", {
      defaultValue: "Instagram seller",
    }),
    clothing: t("onboarding.businessType.clothing", {
      defaultValue: "Clothing & Fashion",
    }),
    cosmetics: t("onboarding.businessType.cosmetics", {
      defaultValue: "Cosmetics & Beauty",
    }),
    general_retail: t("onboarding.businessType.general", {
      defaultValue: "General Retail",
    }),
  };

  const businessTypeDisplay =
    categoryNames[businessType] ||
    t("onboarding.confirm.defaultType", {
      defaultValue: "General Retail",
    });

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar Navigation matching Stitch */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.headerIconButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t("common.back", { defaultValue: "Back" })}
          >
            <SymbolView
              name={{
                ios: "arrow.left" as any,
                android: "arrow_back" as any,
                web: "arrow_back" as any,
              }}
              size={22}
              tintColor={theme.textPrimary}
            />
          </Pressable>

          <ThemedText style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {t("onboarding.confirm.headerTitle", {
              defaultValue: "Confirmation",
            })}
          </ThemedText>

          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <SymbolView
              name={{
                ios: "person.fill" as any,
                android: "person" as any,
                web: "person" as any,
              }}
              size={16}
              tintColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Step Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={[styles.stepPill, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={[styles.stepPillText, { color: theme.textSecondary }]}>
              {t("onboarding.confirm.stepBadge", {
                step: stepNumber,
                total: totalSteps,
                defaultValue: `Step ${stepNumber} of ${totalSteps}`,
              })}
            </ThemedText>
          </View>

          <View style={styles.progressBars}>
            <View style={[styles.bar, styles.barActive, { backgroundColor: theme.primary }]} />
            <View style={[styles.bar, styles.barActive, { backgroundColor: theme.primary }]} />
            <View style={[styles.bar, styles.barActive, { backgroundColor: theme.primary }]} />
          </View>
        </View>

        {/* Page Titles */}
        <View style={styles.titleSection}>
          <ThemedText style={[styles.title, { color: theme.textPrimary }]}>
            {t("onboarding.confirm.title", {
              defaultValue: "Confirm & Start Trading",
            })}
          </ThemedText>

          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t("onboarding.confirm.subtitle", {
              defaultValue:
                "Review your shop settings before creating your workspace",
            })}
          </ThemedText>
        </View>

        {/* Summary Card matching Stitch */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Item 1: Shop Name */}
          <View style={styles.summaryRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.backgroundElement }]}>
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

              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                  {t("onboarding.confirm.labelShopName", {
                    defaultValue: "Shop Name",
                  })}
                </Text>
                <Text style={[styles.rowValue, { color: theme.textPrimary }]}>
                  {businessName || "Supérette El-Amel"}
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.editButton, { backgroundColor: theme.backgroundElement }]}
              onPress={() => onEditStep(1)}
              accessibilityRole="button"
              accessibilityLabel="Edit shop name"
            >
              <SymbolView
                name={{
                  ios: "pencil" as any,
                  android: "edit" as any,
                  web: "edit" as any,
                }}
                size={16}
                tintColor={theme.textSecondary}
              />
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          {/* Item 2: Owner Name */}
          <View style={styles.summaryRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.backgroundElement }]}>
                <SymbolView
                  name={{
                    ios: "person.fill" as any,
                    android: "person" as any,
                    web: "person" as any,
                  }}
                  size={20}
                  tintColor={theme.primary}
                />
              </View>

              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                  {t("onboarding.confirm.labelOwner", {
                    defaultValue: "Owner / Manager",
                  })}
                </Text>
                <Text style={[styles.rowValue, { color: theme.textPrimary }]}>
                  {ownerName || "Karim Benali"}
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.editButton, { backgroundColor: theme.backgroundElement }]}
              onPress={() => onEditStep(1)}
              accessibilityRole="button"
              accessibilityLabel="Edit owner name"
            >
              <SymbolView
                name={{
                  ios: "pencil" as any,
                  android: "edit" as any,
                  web: "edit" as any,
                }}
                size={16}
                tintColor={theme.textSecondary}
              />
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          {/* Item 3: Business Activity */}
          <View style={styles.summaryRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.backgroundElement }]}>
                <SymbolView
                  name={{
                    ios: "tag.fill" as any,
                    android: "category" as any,
                    web: "category" as any,
                  }}
                  size={20}
                  tintColor={theme.primary}
                />
              </View>

              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                  {t("onboarding.confirm.labelType", {
                    defaultValue: "Business Activity",
                  })}
                </Text>
                <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{businessTypeDisplay}</Text>
              </View>
            </View>

            <Pressable
              style={[styles.editButton, { backgroundColor: theme.backgroundElement }]}
              onPress={() => onEditStep(2)}
              accessibilityRole="button"
              accessibilityLabel="Edit business type"
            >
              <SymbolView
                name={{
                  ios: "pencil" as any,
                  android: "edit" as any,
                  web: "edit" as any,
                }}
                size={16}
                tintColor={theme.textSecondary}
              />
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

          {/* Item 4: Operating Currency */}
          <View style={styles.summaryRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: theme.backgroundElement }]}>
                <SymbolView
                  name={{
                    ios: "banknote.fill" as any,
                    android: "payments" as any,
                    web: "payments" as any,
                  }}
                  size={20}
                  tintColor={theme.primary}
                />
              </View>

              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                  {t("onboarding.confirm.labelCurrency", {
                    defaultValue: "Operating Currency",
                  })}
                </Text>
                <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{currency}</Text>
                <Text style={[styles.currencyNote, { color: theme.textMuted }]}>
                  {t("onboarding.confirm.currencyNote", {
                    defaultValue: "Configured in Settings",
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.lockedBadge}>
              <SymbolView
                name={{
                  ios: "lock.fill" as any,
                  android: "lock" as any,
                  web: "lock" as any,
                }}
                size={16}
                tintColor={theme.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Local Storage Reassurance Box matching Stitch */}
        <View style={[styles.infoBox, { backgroundColor: theme.backgroundElement }]}>
          <SymbolView
            name={{
              ios: "shield.checkmark.fill" as any,
              android: "verified_user" as any,
              web: "verified_user" as any,
            }}
            size={20}
            tintColor={theme.textSecondary}
          />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {t("onboarding.confirm.privacyInfo", {
              defaultValue:
                "Your store database will be initialized instantly on your device. Zero cloud lock-in.",
            })}
          </Text>
        </View>

        {/* Live Store Banner Header Preview matching Stitch */}
        <View style={[styles.storePreview, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.previewIconBox, { backgroundColor: theme.primaryLight }]}>
            <SymbolView
              name={{
                ios: "storefront.fill" as any,
                android: "storefront" as any,
                web: "storefront" as any,
              }}
              size={24}
              tintColor={theme.primary}
            />
          </View>

          <View style={styles.previewContent}>
            <Text style={[styles.previewBadge, { color: theme.primary }]}>
              {t("onboarding.confirm.readyToTrade", {
                defaultValue: "READY TO TRADE",
              })}
            </Text>

            <Text style={[styles.previewTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {businessName || "Supérette El-Amel"}
            </Text>

            <Text style={[styles.previewSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {businessTypeDisplay} • {currency}
            </Text>
          </View>

          <View style={[styles.previewCheckCircle, { backgroundColor: theme.primary }]}>
            <SymbolView
              name={{
                ios: "checkmark" as any,
                android: "check" as any,
                web: "check" as any,
              }}
              size={14}
              tintColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.startButton, { backgroundColor: theme.primary }]}
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.confirm.startTrading", {
            defaultValue: "Confirm & Start Trading",
          })}
        >
          <Text style={styles.startButtonText}>
            {t("onboarding.confirm.startTrading", {
              defaultValue: "Confirm & Start Trading",
            })}
          </Text>

          <SymbolView
            name={{
              ios: "arrow.right" as any,
              android: "arrow_forward" as any,
              web: "arrow_forward" as any,
            }}
            size={18}
            tintColor="#FFFFFF"
          />
        </Pressable>

        {onBack && (
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
          >
            <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>
              {t("common.back", { defaultValue: "Back" })}
            </Text>
          </Pressable>
        )}
      </View>
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
  scrollContent: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    height: 48,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontWeight: "700",
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  progressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  stepPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stepPillText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
  },
  progressBars: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  bar: {
    width: 28,
    height: 6,
    borderRadius: 3,
  },
  barActive: {},
  titleSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading1,
  },
  subtitle: {
    ...Typography.body,
    marginTop: 4,
  },
  summaryCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
    padding: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    ...Typography.caption,
    fontSize: 12,
  },
  rowValue: {
    ...Typography.body,
    fontWeight: "600",
    marginTop: 2,
  },
  currencyNote: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  lockedBadge: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  storePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  previewIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  previewContent: {
    flex: 1,
  },
  previewBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  previewTitle: {
    ...Typography.body,
    fontWeight: "600",
    fontSize: 14,
    marginTop: 2,
  },
  previewSubtitle: {
    ...Typography.caption,
    fontSize: 12,
  },
  previewCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
  startButton: {
    width: "100%",
    height: 48,
    borderRadius: BorderRadius.button,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  startButtonText: {
    color: "#FFFFFF",
    ...Typography.body,
    fontWeight: "600",
  },
  backButton: {
    height: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  backButtonText: {
    ...Typography.label,
    fontSize: 14,
  },
});
