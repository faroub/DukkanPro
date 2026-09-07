import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { BusinessNameStep } from "@/features/onboarding/components/BusinessNameStep";
import { BusinessTypeStep } from "@/features/onboarding/components/BusinessTypeStep";
import { ConfirmSettingsStep } from "@/features/onboarding/components/ConfirmSettingsStep";
import { LanguageStep } from "@/features/onboarding/components/LanguageStep";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { Locale } from "@/localization/types";

/**
 * Onboarding Screen - Multi-step Stitch onboarding flow for Dukkan OS
 *
 * Steps:
 * 0. Welcome & Language Selection (Français / العربية / English)
 * 1. Business Name & Owner Name
 * 2. Business Type Selection (Grocery, Bakery, Instagram seller, etc.)
 * 3. Settings Confirmation (Summary card & DZD currency)
 *
 * Rules:
 * - Layout is ALWAYS LTR
 * - Arabic text within elements can be right-aligned
 * - Local offline persistence to SQLite
 */
export function OnboardingScreen({ onComplete }: { onComplete?: () => void }) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [profile, setProfile] = useState<{
    businessName: string;
    ownerName: string;
    businessType: string;
    locale: Locale;
    currency: string;
  }>({
    businessName: "",
    ownerName: "",
    businessType: "grocery",
    locale: "fr",
    currency: "DZD",
  });

  const handleLanguageComplete = (data: { locale: Locale }) => {
    setProfile((prev) => ({ ...prev, locale: data.locale }));
    setCurrentStep(1);
  };

  const handleBusinessDetailsComplete = (data: {
    businessName: string;
    ownerName: string;
  }) => {
    setProfile((prev) => ({
      ...prev,
      businessName: data.businessName,
      ownerName: data.ownerName,
    }));
    setCurrentStep(2);
  };

  const handleBusinessTypeComplete = (data: { businessType: string }) => {
    setProfile((prev) => ({ ...prev, businessType: data.businessType }));
    setCurrentStep(3);
  };

  const handleFinalConfirm = async () => {
    try {
      await useOnboarding.completeOnboarding(profile);
      if (onComplete) {
        onComplete();
      } else {
        router.replace("/(tabs)" as Href);
      }
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {currentStep === 0 && (
          <LanguageStep
            selectedLocale={profile.locale}
            onContinue={handleLanguageComplete}
          />
        )}

        {currentStep === 1 && (
          <BusinessNameStep
            initialBusinessName={profile.businessName}
            initialOwnerName={profile.ownerName}
            stepNumber={1}
            totalSteps={3}
            onContinue={handleBusinessDetailsComplete}
            onBack={() => setCurrentStep(0)}
          />
        )}

        {currentStep === 2 && (
          <BusinessTypeStep
            selectedType={profile.businessType}
            stepNumber={2}
            totalSteps={3}
            onContinue={handleBusinessTypeComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <ConfirmSettingsStep
            businessName={profile.businessName}
            ownerName={profile.ownerName}
            businessType={profile.businessType}
            currency={profile.currency}
            stepNumber={3}
            totalSteps={3}
            onConfirm={handleFinalConfirm}
            onEditStep={(stepIdx) => setCurrentStep(stepIdx)}
            onBack={() => setCurrentStep(2)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
});
