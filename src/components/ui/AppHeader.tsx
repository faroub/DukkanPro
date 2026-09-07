import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, ComponentDimensions, Spacing, Typography } from "@/constants/theme";

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

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.leftSection}>
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
              tintColor={Colors.light.textPrimary}
            />
          </Pressable>
        )}
        <ThemedText style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
      </ThemedView>

      {rightAction && (
        <Pressable
          onPress={rightAction.onPress}
          accessibilityRole="button"
          accessibilityLabel={rightAction.accessibleLabel || rightAction.label}
          style={styles.rightActionButton}
        >
          <ThemedText style={styles.rightAction}>
            {rightAction.label}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ComponentDimensions.headerHeight,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
    color: Colors.light.textPrimary,
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
    color: Colors.light.primary,
  },
});
