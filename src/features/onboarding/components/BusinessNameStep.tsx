import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Spacing } from "@/constants/theme";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

/**
 * Business/shop name step of the onboarding flow.
 * Merchants enter their shop name which is required.
 */
export function BusinessNameStep({ onContinue, businessName }: any) {
  const { t } = useTranslation();
  const [name, setName] = useState(businessName || "");
  const [ownerName, setOwnerName] = useState("");
  const shopPreview = name.trim() || "Your Business Name";

  const handleContinue = () => {
    if (!name.trim()) {
      return;
    }
    onContinue?.({ businessName: name });
  };

  // Arabic text right-aligned within LTR layout
  const isArabic = t("languageStep.ar") === t("languageStep.title");

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.contentPadding}>
        {/* Progress indicator: Step 1 of 3 */}
        <View style={styles.progress}>
          <View style={styles.progressDotActive} />
          <View style={styles.progressDotInactive} />
          <View style={styles.progressDotInactive} />
        </View>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {/* i18n: businessNameStep.title */}
          {t("businessNameStep.title")}
        </ThemedText>

        <ThemedText type="small" style={styles.sectionSubtitle}>
          {/* i18n: businessNameStep.subtitle */}
          {t("businessNameStep.subtitle")}
        </ThemedText>

        {/* Engaging Visual Accent Tile */}
        <View style={styles.accentTile}>
          <View style={styles.accentIcon}>
            <SvgIcon name="storefront" size={18} />
          </View>
          <View style={styles.accentText}>
            <span
              className="font-label font-label text-primary truncate"
              id="shopNamePreview"
              style={isArabic ? { textAlign: "right" } : undefined}
            >
              {shopPreview}
            </span>
          </View>
        </View>

        {/* Main Card Container */}
        <View style={styles.mainCard}>
          <form style={styles.form} id="onboardingForm">
            {/* Field 1: Business Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                {t("businessNameStep.label")}
                <Text style={styles.fieldLabelRequired}>Required</Text>
              </Text>
              <View style={styles.inputContainer}>
                <SvgIcon name="store" size={20} />
                <TextInput
                  style={styles.input}
                  placeholder={name || t("businessNameStep.placeholder")}
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Field 2: Owner Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                {t("common.ownerName")}
                <Text style={styles.fieldLabelRequired}>Required</Text>
              </Text>
              <View style={styles.inputContainer}>
                <SvgIcon name="badge" size={20} />
                <TextInput
                  style={styles.input}
                  placeholder={ownerName || t("ownerNameStep.placeholder")}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  returnKeyType="done"
                  autoCapitalize="words"
                />
              </View>
            </View>
          </form>
        </View>

        {/* Reassurance / Trust Card */}
        <View style={styles.trustCard}>
          <SvgIcon name="verified_user" size={18} />
          <Text style={styles.trustText}>
            Your ledger and customer contacts are kept fully encrypted,
            offline-capable, and private to your device.
          </Text>
        </View>

        {/* CTA Buttons Container */}
        <View style={styles.ctaContainer}>
          <PrimaryButton onPress={handleContinue} title="Continue">
            <span>Continue</span>
            <SvgIcon name="arrow_forward" size={20} />
          </PrimaryButton>
          <PrimaryButton onPress={() => {}} title="Back">
            <span>Back</span>
            <span className="text-secondary text-[12px] font-normal ml-0.5">
              / Retour
            </span>
          </PrimaryButton>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

// Simple SVG icons for Material Symbols
const SvgIcon = ({
  name,
  size,
}: {
  name:
    | "storefront"
    | "store"
    | "badge"
    | "verified_user"
    | "arrow_forward"
    | "west";
  size: number;
}) => {
  const svgData: Record<string, string> = {
    storefront:
      '<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24"><path fill="currentColor" d="M10 20V2h4v18l-4-3h-2l-4 3h-2zM3 9v6h18"/><path fill="none" d="M0 0h24v24H0z"/></svg>',
    store:
      '<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24"><path fill="currentColor" d="M18 8h-1v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5h-1M2 1h4v2H2V1M2 12h4v2H2v-2M2 21h4v2H2v-2M2 6h4v2H2V6M7 20h5v2h5"/><path fill="none" d="M0 0h24v24H0z"/></svg>',
    badge:
      '<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2v4h4v14h-4v-2c0-2 1-2 3-2s3 1 3 2v2H12V2zm6-6a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm-6 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>',
    verified_user:
      '<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.354 8.647-2.646 2.646-5.293-1.414L15 15.069l-2.647-5.303-1.414 2.646L9.75 9.75l-5.293 1.414 1.414 5.293L5 15.069l 5.293-1.414 2.647 5.303z"/></svg>',
    arrow_forward:
      '<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24"><path fill="currentColor" d="M10 18l6-6-6-6M2 12l10 10-10 10z"/></svg>',
    west: '<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24"><path fill="currentColor" d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="3"/></svg>',
  };

  const path = svgData[name] || "";
  return (
    <svg
      dangerouslySetInnerHTML={{
        __html: path.replace(/\{size\}/g, size.toString()),
      }}
    />
  );
};

// Progress indicator styles - flat style objects
const progressStyles = {
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E5E5",
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: "#1B6B3A",
  },
  progressDotInactive: {
    backgroundColor: "#CCCCCC",
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
    backgroundColor: "white",
  },
  contentPadding: {
    width: "100%",
    maxWidth: 400,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  accentTile: {
    position: "relative",
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  accentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0EFEA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  accentText: {
    flex: 1,
  },
  mainCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  form: {
    width: "100%",
    padding: 24,
  },
  field: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
  },
  inputContainer: {
    position: "relative",
    width: "100%",
    marginBottom: 12,
  },
  input: {
    height: 50,
    width: "100%",
    borderColor: "#E5E5E5",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 48,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
  },
  trustCard: {
    backgroundColor: "#F0EFEA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  trustText: {
    fontSize: 12,
    color: "#6B7280",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
  },
  fieldLabelRequired: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  ctaContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingHorizontal: Spacing.lg,
  },
});
