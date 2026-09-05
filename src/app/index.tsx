import * as Device from "expo-device";
import { Platform, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useState, useEffect } from "react";

import { AnimatedIcon } from "@/components/animated-icon";
import { HintRow } from "@/components/hint-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { useTranslation } from "react-i18next";
import i18n from "@/localization/i18n";

SplashScreen.preventAutoHideAsync();

export default function Root() {
  const { t } = useTranslation();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const complete = await useOnboarding.isOnboardingComplete();
        setIsOnboardingComplete(complete);
      } catch (e) {
        console.error("Failed to check onboarding", e);
        setIsOnboardingComplete(false); // fallback to onboarding
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    check();
  }, []);

  if (isOnboardingComplete === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  // Determine the initial route based on onboarding completion:
  // - Fresh app opens on onboarding
  // - Restarting app with completed onboarding skips to tabs
  const shouldShowOnboarding = !isOnboardingComplete;

  return (
    <SafeAreaView style={styles.container}>
      {shouldShowOnboarding ? (
        <OnboardingScreen />
      ) : (
        <ThemedView style={styles.content}>
          <ThemedText type="subtitle" style={styles.subtitle}>
            {/* i18n: app.title */}
            {t('app.title')}
          </ThemedText>
        </ThemedView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F7F4",
  },
  content: {
    padding: Spacing.xl,
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: Spacing.lg,
  },
});