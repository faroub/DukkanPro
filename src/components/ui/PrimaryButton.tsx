import { Pressable, StyleSheet, View, type PressableProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  ComponentDimensions,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  style,
  ...rest
}: PrimaryButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: theme.primary },
        disabled && [styles.buttonDisabled, { backgroundColor: theme.disabledBackground }],
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

        <ThemedText
          style={[
            styles.buttonText,
            disabled && [styles.buttonTextDisabled, { color: theme.textMuted }],
            loading && [styles.buttonTextLoading, { color: theme.textMuted }],
          ]}
        >
          {loading ? (
            <ThemedText type="small" style={[styles.buttonTextLoading, { color: theme.textMuted }]}>
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
          <View style={styles.iconContainer}>{endIcon}</View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: ComponentDimensions.primaryButtonHeight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
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
    ...Typography.body,
    fontWeight: 600,
  },
  buttonTextDisabled: {},
  buttonTextLoading: {},
});
