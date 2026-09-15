import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import i18n, { updateLayoutDirection } from "@/localization/i18n";
import {
    AppThemeProvider,
    useThemePreference,
} from "@/providers/ThemeProvider";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colorScheme } = useThemePreference();
  const { t, i18n: currentI18n } = useTranslation();

  useEffect(() => {
    updateLayoutDirection(currentI18n.language || "fr");
  }, [currentI18n.language]);

  return (
    <ErrorBoundary errorMessage={t("error")} retryLabel={t("retry")}>
      <SafeAreaProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen
              name="products/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="products/new"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="products/stock-adjustment"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="products/edit/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="products/low-stock"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="customers/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="customers/new"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="customers/edit/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="customers/record-payment"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="customers/reminder"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="sales/[id]" options={{ headerShown: false }} />
            <Stack.Screen
              name="sales/history"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="settings/business"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="settings/language"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="settings/theme"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="settings/inventory"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="settings/catalogue"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="settings/export"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="settings/data-reset"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="+not-found" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default function TabLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </I18nextProvider>
  );
}
