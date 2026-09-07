import { useRouter, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTranslation } from "react-i18next";

SplashScreen.preventAutoHideAsync();

export default function Root() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<
    boolean | null
  >(null);

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

  useEffect(() => {
    if (isOnboardingComplete) {
      router.replace("/(tabs)" as Href);
    }
  }, [isOnboardingComplete, router]);

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

  if (!shouldShowOnboarding) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.xl,
    width: "100%",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
  },
});
