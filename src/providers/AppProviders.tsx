import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useEdgeToEdge } from "@/hooks/useEdgeToEdge";
import { DatabaseProvider } from "./DatabaseProvider";
import { LocaleProvider } from "./LocaleProvider";
import { Colors } from "@/constants/theme";

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const theme = useTheme();
  const { insets, style } = useEdgeToEdge();

  return (
    <View style={[{ flex: 1, backgroundColor: theme.background }, style]}>
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
