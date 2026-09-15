import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ComponentDimensions, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface AppHeaderProps {
  title: string;
  backButton?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    label: string;
    onPress: () => void;
    accessibleLabel?: string;
  };
  locale?: "ar" | "fr" | "en";
}

export function AppHeader({
  title,
  backButton = true,
  onBackPress,
  rightAction,
  locale = "fr",
}: AppHeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          height: ComponentDimensions.headerHeight + insets.top,
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.leftSection}>
        {backButton && (
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={locale === "ar" ? "رجوع" : locale === "fr" ? "Retour" : "Back"}
          >
            <SymbolView
              name={{
                ios: "chevron.left",
                android: "chevron_left",
                web: "chevron_left",
              }}
              size={22}
              tintColor={theme.textPrimary}
            />
          </Pressable>
        )}
        <ThemedText style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {title}
        </ThemedText>
      </View>

      {rightAction && (
        <Pressable
          onPress={rightAction.onPress}
          accessibilityRole="button"
          accessibilityLabel={rightAction.accessibleLabel || rightAction.label}
          style={styles.rightActionButton}
        >
          <ThemedText style={[styles.rightAction, { color: theme.primary }]}>
            {rightAction.label}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ComponentDimensions.headerHeight,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "transparent",
  },
  title: {
    ...Typography.heading2,
    marginLeft: Spacing.sm,
    flexShrink: 1,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -Spacing.sm,
  },
  rightActionButton: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  rightAction: {
    ...Typography.label,
  },
});
