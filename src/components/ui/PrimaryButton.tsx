import { Pressable, StyleSheet, type PressableProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export interface PrimaryButtonProps extends PressableProps {
  title: string;
  disabled?: boolean;
  loading?: boolean;
  locale?: "ar" | "fr" | "en";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export function PrimaryButton({
  title,
  disabled = false,
  loading = false,
  startIcon,
  endIcon,
  onPress,
  locale = "fr",
  ...rest
}: PrimaryButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        loading && styles.buttonLoading,
      ]}
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      {...rest}
    >
      <ThemedView style={styles.buttonInner}>
        {startIcon && (
          <ThemedView style={styles.iconContainer}>{startIcon}</ThemedView>
        )}

        <ThemedText
          style={[
            styles.buttonText,
            disabled && styles.buttonTextDisabled,
            loading && styles.buttonTextLoading,
          ]}
        >
          {loading ? (
            <ThemedText type="small" style={styles.buttonTextLoading}>
              {locale === "ar"
                ? "جاري التحميل"
                : locale === "fr"
                  ? "Chargement"
                  : "Loading"}
            </ThemedText>
          ) : (
            title
          )}
        </ThemedText>

        {endIcon && (
          <ThemedView style={styles.iconContainer}>{endIcon}</ThemedView>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1B6B3A", // deep green from theme Colors.positive
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#A0AEC0",
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: Spacing.xs,
    height: Spacing.xs,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: 600,
  },
  buttonTextDisabled: {
    color: "#FFF",
  },
  buttonTextLoading: {
    color: "rgba(255, 255, 255, 0.7)",
  },
});
