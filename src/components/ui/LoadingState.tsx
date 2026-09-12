import { ActivityIndicator, StyleSheet, type ViewProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();

  return (
    <ThemedView type="background" style={styles.container} {...rest}>
      <ThemedView style={styles.content}>
        <ActivityIndicator size={size} animating color={theme.primary} />
        {message && (
          <ThemedText style={[styles.message, { color: theme.textPrimary, marginTop: Spacing.xs }]}>
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
    fontWeight: "500",
  },
});
