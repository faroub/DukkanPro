import { Pressable, StyleSheet, View, type PressableProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  ComponentDimensions,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  style,
  ...rest
}: SecondaryButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      style={[
        styles.button,
        {
          borderColor: theme.primary,
        },
        disabled && styles.buttonDisabled,
        loading && styles.buttonLoading,
        style as any,
      ]}
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      {...rest}
    >
      <View style={styles.buttonInner}>
        {startIcon && (
          <View style={styles.iconContainer}>{startIcon}</View>
        )}

        <ThemedText style={[styles.buttonText, { color: theme.primary }]}>{title}</ThemedText>

        {endIcon && (
          <View style={styles.iconContainer}>{endIcon}</View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    minHeight: ComponentDimensions.secondaryButtonHeight,
    paddingVertical: Spacing.sm,
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
    ...Typography.body,
    fontWeight: 500,
  },
});
