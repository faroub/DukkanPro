import { StyleSheet, View, type ViewProps } from "react-native";

import { BorderRadius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  elevation?: keyof typeof Shadows;
  borderColor?: string;
  shadow?: keyof typeof Shadows;
}

export function Card({
  children,
  elevation = "md",
  borderColor,
  shadow = "md",
  style,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const border = borderColor ?? theme.border;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: border,
        },
        style,
      ]}
      {...rest}
    >
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: "hidden",
    shadowColor: Shadows.sm.shadowColor,
    shadowOffset: Shadows.sm.shadowOffset,
    shadowOpacity: Shadows.sm.shadowOpacity,
    shadowRadius: Shadows.sm.shadowRadius,
    elevation: Shadows.sm.elevation,
  },
  content: {
    padding: Spacing.lg,
  },
});
