import { Pressable, StyleSheet, type PressableProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export interface SecondaryButtonProps extends PressableProps {
  title: string;
  disabled?: boolean;
  loading?: boolean;
  locale?: "ar" | "fr" | "en";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export function SecondaryButton({
  title,
  disabled = false,
  loading = false,
  startIcon,
  endIcon,
  onPress,
  ...rest
}: SecondaryButtonProps) {
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

        <ThemedText style={styles.buttonText}>{title}</ThemedText>

        {endIcon && (
          <ThemedView style={styles.iconContainer}>{endIcon}</ThemedView>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  buttonDisabled: {
    opacity: 0.5,
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
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: 500,
  },
});
