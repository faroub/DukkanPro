import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DatabaseProvider } from "./DatabaseProvider";
import { LocaleProvider } from "./LocaleProvider";
import { Colors } from "@/constants/theme";

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <DatabaseProvider>
        <LocaleProvider>{children}</LocaleProvider>
      </DatabaseProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
