import { Pressable, StyleSheet, type PressableProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
    Colors,
    ComponentDimensions,
    Spacing,
    Typography,
} from "@/constants/theme";

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
    backgroundColor: Colors.light.primary,
    minHeight: ComponentDimensions.primaryButtonHeight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: Colors.light.disabledBackground,
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
    color: Colors.light.surface,
    ...Typography.body,
    fontWeight: 600,
  },
  buttonTextDisabled: {
    color: Colors.light.textMuted,
  },
  buttonTextLoading: {
    color: Colors.light.textMuted,
  },
});
