import * as Device from "expo-device";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

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
  const isOnboardingComplete = useOnboarding.isOnboardingComplete();

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