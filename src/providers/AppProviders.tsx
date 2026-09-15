import React from "react";
import { StyleSheet, View } from "react-native";
import { DatabaseProvider } from "./DatabaseProvider";
import { LocaleProvider } from "./LocaleProvider";

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <View style={styles.container}>
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
