import { Pressable, StyleSheet, type ViewProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export interface ErrorStateProps extends ViewProps {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
  locale?: "ar" | "fr" | "en";
}

export function ErrorState({
  message,
  onRetry,
  retryLabel,
  locale = "fr",
  ...rest
}: ErrorStateProps) {
  const defaultRetryLabel =
    locale === "ar"
      ? "إعادة المحاولة"
      : locale === "fr"
        ? "Réessayer"
        : "Retry";

  return (
    <ThemedView type="background" style={styles.container} {...rest}>
      <ThemedView style={styles.content}>
        <ThemedText style={styles.errorIcon}>{/* Error icon */}</ThemedText>

        <ThemedText style={styles.errorMessage}>{message}</ThemedText>

        <Pressable
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel || defaultRetryLabel}
        >
          <ThemedText style={styles.retryText}>
            {retryLabel || defaultRetryLabel}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
  },
  content: {
    alignItems: "center",
    gap: Spacing.md,
  },
  errorIcon: {
    width: 40,
    height: 40,
    marginBottom: Spacing.md,
  },
  errorMessage: {
    fontSize: 16,
    color: "#B91C1C",
    fontWeight: 500,
    textAlign: "center",
    maxWidth: "80%",
  },
  retryButton: {
    backgroundColor: "#D97706",
    minHeight: 48,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 600,
  },
});
