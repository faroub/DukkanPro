import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
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
  const theme = useTheme();
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
        defaultValue: "Bakery & Sweets",
      }),
      icon: "shopping_bag",
    },
    {
      id: "clothing",
      label: t("onboarding.businessName.catClothing", {
        defaultValue: "Clothing & Fashion",
      }),
      icon: "checkroom",
    },
    {
      id: "general",
      label: t("onboarding.businessName.catGeneral", {
        defaultValue: "General Store",
      }),
      icon: "category",
    },
  ];

  const handleContinue = () => {
    if (!businessName.trim()) {
      setError(
        t("onboarding.businessName.errorRequired", {
          defaultValue: "Business name is required to start your store",
        })
      );
      return;
    }

    setError(null);
    onContinue({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      category: selectedCategory,
    });
  };

  const previewTitle =
    businessName.trim() ||
    t("onboarding.businessName.defaultShopName", {
      defaultValue: "Supérette El-Amel",
    });

  const previewOwner =
    ownerName.trim() ||
    t("onboarding.businessName.defaultOwner", {
      defaultValue: "Karim Benali",
    });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              {t("onboarding.businessName.headerTitle", {
                defaultValue: "Business Name",
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
                {t("onboarding.businessName.stepBadge", {
                  step: stepNumber,
                  total: totalSteps,
                  defaultValue: `Step ${stepNumber} of ${totalSteps}`,
                })}
              </ThemedText>
            </View>

            <View style={styles.progressBars}>
              <View style={[styles.bar, styles.barActive, { backgroundColor: theme.primary }]} />
              <View style={[styles.bar, { backgroundColor: theme.border }]} />
              <View style={[styles.bar, { backgroundColor: theme.border }]} />
            </View>
          </View>

          {/* Page Titles */}
          <View style={styles.titleSection}>
            <ThemedText style={[styles.title, { color: theme.textPrimary }]}>
              {t("onboarding.businessName.title", {
                defaultValue: "Tell us about your business",
              })}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t("onboarding.businessName.subtitle", {
                defaultValue:
                  "Enter your shop details to personalize your workspace",
              })}
            </ThemedText>
          </View>

          {/* Engaging Visual Accent Tile matching Stitch */}
          <View style={[styles.accentTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.accentIconBox, { backgroundColor: theme.primaryLight }]}>
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

            <View style={styles.accentContent}>
              <View style={styles.previewNameRow}>
                <Text style={[styles.accentTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {previewTitle}
                </Text>
              </View>
              <Text style={[styles.accentSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {t("onboarding.businessName.previewSub", {
                  owner: previewOwner,
                  defaultValue: `Managed by ${previewOwner}`,
                })}
              </Text>
              <View style={[styles.accentBadge, { backgroundColor: theme.primaryLight }]}>
                <View style={[styles.accentBadgeDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.accentBadgeText, { color: theme.primary }]}>
                  {t("onboarding.businessName.livePreview", {
                    defaultValue: "Receipt Header Preview",
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Form Fields Card matching Stitch */}
          <View style={[styles.mainCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Field 1: Business Name */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  {t("onboarding.businessName.nameLabel", {
                    defaultValue: "Shop / Business Name",
                  })}
                </ThemedText>
                <Text style={[styles.requiredBadge, { color: theme.textMuted }]}>
                  {t("onboarding.businessName.required", {
                    defaultValue: "Required",
                  })}
                </Text>
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  error ? { borderColor: theme.error } : null,
                ]}
              >
                <SymbolView
                  name={{
                    ios: "storefront" as any,
                    android: "storefront" as any,
                    web: "storefront" as any,
                  }}
                  size={20}
                  tintColor={theme.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  value={businessName}
                  onChangeText={(val) => {
                    setBusinessName(val);
                    if (error) setError(null);
                  }}
                  placeholder={t("onboarding.businessName.namePlaceholder", {
                    defaultValue: "e.g., Supérette El-Amel",
                  })}
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              {error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}
            </View>

            {/* Field 2: Owner / Manager Name */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  {t("onboarding.businessName.ownerLabel", {
                    defaultValue: "Owner / Manager Name",
                  })}
                </ThemedText>
                <Text style={[styles.optionalBadge, { color: theme.textMuted }]}>
                  {t("onboarding.businessName.optional", {
                    defaultValue: "Optional",
                  })}
                </Text>
              </View>

              <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <SymbolView
                  name={{
                    ios: "person" as any,
                    android: "person" as any,
                    web: "person" as any,
                  }}
                  size={20}
                  tintColor={theme.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder={t("onboarding.businessName.ownerPlaceholder", {
                    defaultValue: "e.g., Karim Benali",
                  })}
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Quick Category Selector Chips matching Stitch */}
            <View style={styles.categorySection}>
              <Text style={[styles.categoryHeaderLabel, { color: theme.textPrimary }]}>
                {t("onboarding.businessName.quickCategory", {
                  defaultValue: "Shop Type / Activity",
                })}
              </Text>
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
                      style={[
                        styles.categoryChip,
                        isSelected
                          ? [styles.categoryChipSelected, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]
                          : [styles.categoryChipUnselected, { backgroundColor: theme.backgroundElement }],
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                      accessibilityRole="button"
                    >
                      <SymbolView
                        name={{
                          ios: "cart" as any,
                          android: cat.icon as any,
                          web: cat.icon as any,
                        }}
                        size={16}
                        tintColor={
                          isSelected ? theme.primary : theme.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected
                            ? [styles.categoryChipTextSelected, { color: theme.primary }]
                            : [styles.categoryChipTextUnselected, { color: theme.textSecondary }],
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

          {/* Micro Trust Banner matching Stitch */}
          <View style={[styles.trustBanner, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.trustIconWrapper, { backgroundColor: theme.primaryLight }]}>
              <SymbolView
                name={{
                  ios: "lock.shield.fill" as any,
                  android: "security" as any,
                  web: "security" as any,
                }}
                size={16}
                tintColor={theme.primary}
              />
            </View>
            <Text style={[styles.trustText, { color: theme.textSecondary }]}>
              {t("onboarding.businessName.trustText", {
                defaultValue:
                  "Your shop profile is stored 100% locally on this device. Privacy guaranteed.",
              })}
            </Text>
          </View>
        </ScrollView>

        {/* Action Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.continueButton,
              { backgroundColor: theme.primary },
              !businessName.trim() && [styles.continueButtonDisabled, { backgroundColor: theme.border }],
            ]}
            onPress={handleContinue}
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
              <Text style={[styles.backSubText, { color: theme.textMuted }]}>• Step {stepNumber}</Text>
            </Pressable>
          )}
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
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
    width: 12,
    height: 6,
    borderRadius: 3,
  },
  barActive: {
    width: 28,
  },
  titleSection: {
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.heading1,
  },
  subtitle: {
    ...Typography.body,
    marginTop: 2,
  },
  accentTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  accentIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
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
    fontSize: 14,
  },
  accentSubtitle: {
    ...Typography.caption,
    marginTop: 1,
  },
  accentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  accentBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  accentBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  mainCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    padding: Spacing.md,
  },
  fieldGroup: {
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    ...Typography.label,
  },
  requiredBadge: {
    ...Typography.caption,
    fontSize: 12,
  },
  optionalBadge: {
    ...Typography.caption,
    fontSize: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    height: 48,
    paddingHorizontal: Spacing.sm,
  },
  inputWrapperError: {},
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: 0,
  },
  errorText: {
    ...Typography.caption,
    marginTop: 4,
  },
  categorySection: {
    marginTop: Spacing.xs,
  },
  categoryHeaderLabel: {
    ...Typography.label,
    fontSize: 13,
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
  categoryChipUnselected: {},
  categoryChipSelected: {
    borderWidth: 1,
  },
  categoryChipText: {
    ...Typography.caption,
    fontSize: 13,
  },
  categoryChipTextUnselected: {
    fontWeight: "500",
  },
  categoryChipTextSelected: {
    fontWeight: "700",
  },
  trustBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  trustIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  trustText: {
    flex: 1,
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
  continueButton: {
    height: 48,
    borderRadius: BorderRadius.button,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  continueButtonDisabled: {},
  continueButtonText: {
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
  backSubText: {
    fontSize: 12,
  },
});
