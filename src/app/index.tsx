import { useRouter, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { useTheme } from "@/hooks/use-theme";
import { useOnboarding } from "@/hooks/useOnboarding";

SplashScreen.preventAutoHideAsync();

export default function Root() {
  const router = useRouter();
  const theme = useTheme();
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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const shouldShowOnboarding = !isOnboardingComplete;

  if (shouldShowOnboarding) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <OnboardingScreen onComplete={() => setIsOnboardingComplete(true)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
