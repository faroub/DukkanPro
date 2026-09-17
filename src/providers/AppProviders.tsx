import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DatabaseProvider } from "./DatabaseProvider";
import { LocaleProvider } from "./LocaleProvider";
import { Colors } from "@/constants/theme";

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[{ flex: 1, backgroundColor: theme.background }, insets]}>
      <DatabaseProvider>
        <LocaleProvider>{children}</LocaleProvider>
      </DatabaseProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
