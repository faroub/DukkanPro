import { ActivityIndicator, StyleSheet, type ViewProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export interface LoadingStateProps extends ViewProps {
  message?: string;
  locale?: "ar" | "fr" | "en";
  size?: number;
}

export function LoadingState({
  message,
  locale = "fr",
  size = 24,
  ...rest
}: LoadingStateProps) {
  return (
    <ThemedView type="background" style={styles.container} {...rest}>
      <ThemedView style={styles.content}>
        <ActivityIndicator size={size} animating color="#1B6B3A" />
        {message && (
          <ThemedText style={[styles.message, { marginTop: Spacing.xs }]}>
            {message}
          </ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  content: {
    alignItems: "center",
    gap: Spacing.md,
  },
  message: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: 500,
  },
});
