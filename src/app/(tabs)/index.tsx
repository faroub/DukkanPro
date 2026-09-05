import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

import DashboardScreen from "@/features/dashboard/DashboardScreen";

export default function HomeScreen() {
  return (
    <ThemedView type="background" style={styles.container}>
      <ThemedView style={styles.content}>
        <DashboardScreen
          t={(key: string) => key} // placeholder - actual t comes from i18next context
          locale="fr" // default locale, will be overridden by i18next provider
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  content: {
    padding: 24,
  },
});