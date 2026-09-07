import { StyleSheet, View, type ViewProps } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Shadows, Spacing } from "@/constants/theme";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  elevation?: keyof typeof Shadows;
  borderColor?: string;
  shadow?: keyof typeof Shadows;
}

export function Card({
  children,
  elevation = "md",
  borderColor = Colors.light.border,
  shadow = "md",
  ...rest
}: CardProps) {
  const shadowStyle = Shadows[elevation] || Shadows.md;

  return (
    <ThemedView style={[styles.container, { borderColor }]} {...rest}>
      <View style={styles.content}>{children}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
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
