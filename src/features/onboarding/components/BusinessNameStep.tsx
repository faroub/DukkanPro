import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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

interface BusinessNameStepProps {
  onContinue: (data: {
    businessName: string;
    ownerName: string;
    category?: string;
  }) => void;
  onBack?: () => void;
  initialBusinessName?: string;
  initialOwnerName?: string;
  stepNumber?: number;
  totalSteps?: number;
}

export function BusinessNameStep({
  onContinue,
  onBack,
  initialBusinessName = "",
  initialOwnerName = "",
  stepNumber = 1,
  totalSteps = 3,
}: BusinessNameStepProps) {
  const { t } = useTranslation();
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [ownerName, setOwnerName] = useState(initialOwnerName);
  const [selectedCategory, setSelectedCategory] = useState("grocery");
  const [error, setError] = useState<string | null>(null);

  const categories = [
    {
      id: "grocery",
      label: t("onboarding.businessName.catGrocery", {
        defaultValue: "Grocery & Food",
      }),
      icon: "storefront",
    },
    {
      id: "bakery",
      label: t("onboarding.businessName.catBakery", {
        defaultValue: "Bakery & Café",
      }),
      icon: "bakery_dining",
    },
    {
      id: "pharmacy",
      label: t("onboarding.businessName.catPharmacy", {
        defaultValue: "Pharmacy",
      }),
      icon: "local_pharmacy",
    },
    {
      id: "retail",
      label: t("onboarding.businessName.catRetail", {
        defaultValue: "General Goods",
      }),
      icon: "shopping_bag",
    },
  ];

  const handleContinue = () => {
    if (!businessName.trim()) {
      setError(
        t("errors.requiredField", {
          defaultValue: "Business name is required",
        })
      );
      return;
    }
    setError(null);
    onContinue({
      businessName: businessName.trim(),
      ownerName: ownerName.trim() || businessName.trim(),
      category: selectedCategory,
    });
  };

  const previewName =
    businessName.trim() ||
    t("onboarding.businessName.defaultShopName", {
      defaultValue: "Supérette El-Amel",
    });

  const previewOwner = ownerName.trim()
    ? t("onboarding.businessName.managedBy", {
        owner: ownerName.trim(),
        defaultValue: `Managed by ${ownerName.trim()}`,
      })
    : t("onboarding.businessName.ownerNotSet", {
        defaultValue: "Owner name not set",
      });

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header Bar matching Stitch */}
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
            {t("onboarding.businessName.headerTitle", {
              defaultValue: "Business Name",
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
              {t("onboarding.businessName.stepBadge", {
                step: stepNumber,
                total: totalSteps,
                defaultValue: `Step ${stepNumber} of ${totalSteps}`,
              })}
            </ThemedText>
          </View>

          <View style={styles.progressBars}>
            <View style={[styles.bar, styles.barActive]} />
            <View style={styles.bar} />
            <View style={styles.bar} />
          </View>
        </View>

        {/* Page Titles */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>
            {t("onboarding.businessName.title", {
              defaultValue: "Tell us about your business",
            })}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("onboarding.businessName.subtitle", {
              defaultValue:
                "Enter your shop details to personalize your workspace",
            })}
          </ThemedText>
        </View>

        {/* Engaging Visual Accent Tile matching Stitch */}
        <View style={styles.accentTile}>
          <View style={styles.accentIconBox}>
            <SymbolView
              name={{
                ios: "storefront.fill" as any,
                android: "storefront" as any,
                web: "storefront" as any,
              }}
              size={32}
              tintColor={Colors.light.primary}
            />
          </View>

          <View style={styles.accentContent}>
            <View style={styles.previewNameRow}>
              <ThemedText style={styles.accentTitle} numberOfLines={1}>
                {previewName}
              </ThemedText>
            </View>

            <ThemedText style={styles.accentSubtitle} numberOfLines={1}>
              {previewOwner}
            </ThemedText>

            <View style={styles.accentBadge}>
              <View style={styles.accentBadgeDot} />
              <ThemedText style={styles.accentBadgeText}>
                {t("onboarding.businessName.previewBadge", {
                  defaultValue: "Personalized POS setup",
                })}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Main Form Card Container */}
        <View style={styles.mainCard}>
          {/* Field 1: Business Name */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>
                {t("onboarding.businessName.businessNameLabel", {
                  defaultValue: "Business name",
                })}
              </ThemedText>
              <ThemedText style={styles.requiredBadge}>
                {t("onboarding.businessName.required", {
                  defaultValue: "Required",
                })}
              </ThemedText>
            </View>

            <View
              style={[
                styles.inputWrapper,
                error ? styles.inputWrapperError : null,
              ]}
            >
              <View style={styles.inputIcon}>
                <SymbolView
                  name={{
                    ios: "storefront" as any,
                    android: "storefront" as any,
                    web: "storefront" as any,
                  }}
                  size={20}
                  tintColor={Colors.light.textMuted}
                />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder={t("onboarding.businessName.businessNamePlaceholder", {
                  defaultValue: "e.g., Supérette El-Amel, Pâtisserie Yasmine",
                })}
                placeholderTextColor={Colors.light.textMuted}
                value={businessName}
                onChangeText={(val) => {
                  setBusinessName(val);
                  if (error) setError(null);
                }}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
          </View>

          {/* Field 2: Owner Name */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>
                {t("onboarding.businessName.ownerNameLabel", {
                  defaultValue: "Your name",
                })}
              </ThemedText>
              <ThemedText style={styles.optionalBadge}>
                {t("onboarding.businessName.optional", {
                  defaultValue: "Optional",
                })}
              </ThemedText>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <SymbolView
                  name={{
                    ios: "person" as any,
                    android: "person" as any,
                    web: "person" as any,
                  }}
                  size={20}
                  tintColor={Colors.light.textMuted}
                />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder={t("onboarding.businessName.ownerNamePlaceholder", {
                  defaultValue: "e.g., Karim Benali",
                })}
                placeholderTextColor={Colors.light.textMuted}
                value={ownerName}
                onChangeText={setOwnerName}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Category Quick Selector Pill Bar matching Stitch */}
          <View style={styles.categorySection}>
            <ThemedText style={styles.categoryHeaderLabel}>
              {t("onboarding.businessName.categoryLabel", {
                defaultValue: "Select store category",
              })}
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={[
                      styles.categoryChip,
                      isSelected
                        ? styles.categoryChipSelected
                        : styles.categoryChipUnselected,
                    ]}
                  >
                    <SymbolView
                      name={{
                        ios: "tag" as any,
                        android: cat.icon as any,
                        web: cat.icon as any,
                      }}
                      size={16}
                      tintColor={
                        isSelected ? Colors.light.primary : Colors.light.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected
                          ? styles.categoryChipTextSelected
                          : styles.categoryChipTextUnselected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Reassurance Offline Banner matching Stitch */}
        <View style={styles.trustBanner}>
          <View style={styles.trustIconWrapper}>
            <SymbolView
              name={{
                ios: "checkmark.shield.fill" as any,
                android: "verified_user" as any,
                web: "verified_user" as any,
              }}
              size={18}
              tintColor={Colors.light.primary}
            />
          </View>
          <ThemedText style={styles.trustText}>
            {t("onboarding.businessName.trustText", {
              defaultValue:
                "Your ledger and customer contacts are kept fully encrypted, offline-capable, and private to your device.",
            })}
          </ThemedText>
        </View>
      </ScrollView>

      {/* CTA Footer matching Stitch */}
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.continueButton,
            !businessName.trim() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!businessName.trim()}
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.businessName.continue", {
            defaultValue: "Continue",
          })}
        >
          <Text style={styles.continueButtonText}>
            {t("onboarding.businessName.continue", {
              defaultValue: "Continue",
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
              {t("onboarding.businessName.back", { defaultValue: "Back" })}{" "}
              <Text style={styles.backSubText}>
                {t("onboarding.businessName.backSub", { defaultValue: "/ Retour" })}
              </Text>
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
    width: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.border,
  },
  barActive: {
    width: 28,
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
  accentTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  accentIconBox: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  accentContent: {
    flex: 1,
    justifyContent: "center",
  },
  previewNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  accentTitle: {
    ...Typography.body,
    fontWeight: "700",
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  accentSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  accentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primaryLight,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 6,
  },
  accentBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  accentBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  mainCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
    padding: ComponentDimensions.cardPadding,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.light.textPrimary,
  },
  requiredBadge: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  optionalBadge: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    height: 48,
    paddingHorizontal: Spacing.sm,
  },
  inputWrapperError: {
    borderColor: Colors.light.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.textPrimary,
    paddingVertical: 0,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.light.error,
    marginTop: 4,
  },
  categorySection: {
    marginTop: Spacing.xs,
  },
  categoryHeaderLabel: {
    ...Typography.label,
    fontSize: 13,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  categoryScroll: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  categoryChipUnselected: {
    backgroundColor: Colors.light.backgroundElement,
  },
  categoryChipSelected: {
    backgroundColor: Colors.light.primaryLight,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    ...Typography.caption,
    fontSize: 13,
  },
  categoryChipTextUnselected: {
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  categoryChipTextSelected: {
    color: Colors.light.primaryDark,
    fontWeight: "700",
  },
  trustBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  trustIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  trustText: {
    flex: 1,
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
  continueButton: {
    backgroundColor: Colors.light.primary,
    height: 48,
    borderRadius: BorderRadius.button,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.light.disabledBackground,
  },
  continueButtonText: {
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
  backSubText: {
    color: Colors.light.textMuted,
    fontSize: 12,
  },
});
