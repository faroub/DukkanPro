import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
    market_vendor: t("onboarding.businessType.market", {
      defaultValue: "Market vendor",
    }),
    service_seller: t("onboarding.businessType.services", {
      defaultValue: "Service seller",
    }),
    other: t("onboarding.businessType.other", { defaultValue: "Other" }),
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
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
              tintColor={Colors.light.textPrimary}
            />
          </Pressable>

          <ThemedText style={styles.headerTitle}>
            {t("onboarding.confirmSettings.headerTitle", {
              defaultValue: "Confirm Settings",
            })}
          </ThemedText>

          <View style={styles.avatarCircle}>
            <SymbolView
              name={{
                ios: "person.fill" as any,
                android: "person" as any,
                web: "person" as any,
              }}
              size={16}
              tintColor={Colors.light.surface}
            />
          </View>
        </View>

        {/* Step Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.stepPill}>
            <ThemedText style={styles.stepPillText}>
              {t("onboarding.confirmSettings.stepBadge", {
                step: stepNumber,
                total: totalSteps,
                defaultValue: `Step ${stepNumber} of ${totalSteps}`,
              })}
            </ThemedText>
          </View>

          <View style={styles.progressBars}>
            <View style={[styles.bar, styles.barActive]} />
            <View style={[styles.bar, styles.barActive]} />
            <View style={[styles.bar, styles.barActive]} />
          </View>
        </View>

        {/* Page Titles */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>
            {t("onboarding.confirmSettings.title", {
              defaultValue: "Review & confirm",
            })}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("onboarding.confirmSettings.subtitle", {
              defaultValue:
                "Double-check your business setup before starting",
            })}
          </ThemedText>
        </View>

        {/* Central Summary Card Container */}
        <View style={styles.summaryCard}>
          {/* Row 1: Business Name */}
          <View style={styles.summaryRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
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
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>
                  {t("onboarding.confirmSettings.businessNameLabel", {
                    defaultValue: "Business name",
                  })}
                </ThemedText>
                <ThemedText style={styles.rowValue} numberOfLines={1}>
                  {businessName || "My Store"}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={() => onEditStep(1)}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.confirmSettings.editBusinessName", {
                defaultValue: "Edit business name",
              })}
            >
              <SymbolView
                name={{
                  ios: "pencil" as any,
                  android: "edit" as any,
                  web: "edit" as any,
                }}
                size={16}
                tintColor={Colors.light.textSecondary}
              />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Row 2: Owner Name */}
          <View style={styles.summaryRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <SymbolView
                  name={{
                    ios: "person.fill" as any,
                    android: "person" as any,
                    web: "person" as any,
                  }}
                  size={20}
                  tintColor={Colors.light.primary}
                />
              </View>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>
                  {t("onboarding.confirmSettings.ownerNameLabel", {
                    defaultValue: "Your name",
                  })}
                </ThemedText>
                <ThemedText style={styles.rowValue} numberOfLines={1}>
                  {ownerName || businessName}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={() => onEditStep(1)}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.confirmSettings.editOwnerName", {
                defaultValue: "Edit owner name",
              })}
            >
              <SymbolView
                name={{
                  ios: "pencil" as any,
                  android: "edit" as any,
                  web: "edit" as any,
                }}
                size={16}
                tintColor={Colors.light.textSecondary}
              />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Row 3: Business Type */}
          <View style={styles.summaryRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <SymbolView
                  name={{
                    ios: "tag.fill" as any,
                    android: "category" as any,
                    web: "category" as any,
                  }}
                  size={20}
                  tintColor={Colors.light.primary}
                />
              </View>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>
                  {t("onboarding.confirmSettings.businessTypeLabel", {
                    defaultValue: "Business type",
                  })}
                </ThemedText>
                <ThemedText style={styles.rowValue} numberOfLines={1}>
                  {categoryNames[businessType] || businessType}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={() => onEditStep(2)}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.confirmSettings.editBusinessType", {
                defaultValue: "Edit business type",
              })}
            >
              <SymbolView
                name={{
                  ios: "pencil" as any,
                  android: "edit" as any,
                  web: "edit" as any,
                }}
                size={16}
                tintColor={Colors.light.textSecondary}
              />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Row 4: Currency */}
          <View style={styles.summaryRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <SymbolView
                  name={{
                    ios: "banknote.fill" as any,
                    android: "payments" as any,
                    web: "payments" as any,
                  }}
                  size={20}
                  tintColor={Colors.light.primary}
                />
              </View>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>
                  {t("onboarding.confirmSettings.currencyLabel", {
                    defaultValue: "Currency",
                  })}
                </ThemedText>
                <ThemedText style={styles.rowValue}>
                  {currency} (Algerian Dinar)
                </ThemedText>
                <Text style={styles.currencyNote}>
                  {t("onboarding.confirmSettings.currencyNote", {
                    defaultValue: "Default currency for Algeria (locked)",
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
                tintColor={Colors.light.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Soft Informational Note Box */}
        <View style={styles.infoBox}>
          <SymbolView
            name={{
              ios: "info-circle" as any,
              android: "info" as any,
              web: "info" as any,
            }}
            size={18}
            tintColor={Colors.light.textSecondary}
          />
          <ThemedText style={styles.infoText}>
            {t("onboarding.confirmSettings.infoText", {
              defaultValue:
                "You can update your business name, logo, and receipt details anytime in the Settings tab.",
            })}
          </ThemedText>
        </View>

        {/* Store Preview Vignette matching Stitch */}
        <View style={styles.storePreview}>
          <View style={styles.previewIconBox}>
            <SymbolView
              name={{
                ios: "storefront.fill" as any,
                android: "storefront" as any,
                web: "storefront" as any,
              }}
              size={26}
              tintColor={Colors.light.primary}
            />
          </View>
          <View style={styles.previewContent}>
            <ThemedText style={styles.previewBadge}>
              {t("onboarding.confirmSettings.previewReadyBadge", {
                defaultValue: "READY TO LAUNCH",
              })}
            </ThemedText>
            <ThemedText style={styles.previewTitle}>
              {t("onboarding.confirmSettings.previewTitle", {
                defaultValue: "Your digital ledger is prepared",
              })}
            </ThemedText>
            <ThemedText style={styles.previewSubtitle}>
              {t("onboarding.confirmSettings.previewSubtitle", {
                defaultValue: "Point of Sale, debts & inventory",
              })}
            </ThemedText>
          </View>
          <View style={styles.previewCheckCircle}>
            <SymbolView
              name={{
                ios: "checkmark" as any,
                android: "check" as any,
                web: "check" as any,
              }}
              size={14}
              tintColor={Colors.light.surface}
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Section matching Stitch */}
      <View style={styles.footer}>
        <Pressable
          style={styles.startButton}
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.confirmSettings.startButton", {
            defaultValue: "Start using Dukkan OS",
          })}
        >
          <Text style={styles.startButtonText}>
            {t("onboarding.confirmSettings.startButton", {
              defaultValue: "Start using Dukkan OS",
            })}
          </Text>
          <SymbolView
            name={{
              ios: "arrow.right" as any,
              android: "arrow_forward" as any,
              web: "arrow_forward" as any,
            }}
            size={18}
            tintColor={Colors.light.surface}
          />
        </Pressable>

        {onBack && (
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
          >
            <SymbolView
              name={{
                ios: "arrow.left" as any,
                android: "arrow_back" as any,
                web: "arrow_back" as any,
              }}
              size={16}
              tintColor={Colors.light.textSecondary}
            />
            <ThemedText style={styles.backButtonText}>
              {t("onboarding.confirmSettings.backToStep2", {
                defaultValue: "Back to step 2",
              })}
            </ThemedText>
          </Pressable>
        )}
      </View>
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
    color: Colors.light.textPrimary,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
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
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stepPillText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.border,
  },
  barActive: {
    backgroundColor: Colors.light.primary,
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading1,
    color: Colors.light.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  rowValue: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  currencyNote: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundElement,
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
    backgroundColor: Colors.light.borderLight,
    marginVertical: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  storePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  previewIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  previewContent: {
    flex: 1,
  },
  previewBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },
  previewTitle: {
    ...Typography.body,
    fontWeight: "600",
    fontSize: 14,
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  previewSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  previewCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
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
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  startButtonText: {
    color: Colors.light.surface,
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
    color: Colors.light.textSecondary,
  },
});
