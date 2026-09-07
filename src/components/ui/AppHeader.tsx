import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

// expo-symbols exports are used via SymbolView in other components
// Using native react-native icons instead

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";

export interface AppHeaderProps {
  title: string;
  backButton?: boolean;
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
  rightAction,
  locale = "fr",
}: AppHeaderProps) {
  const theme = useTheme();
  const isRtl = locale === "ar";

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.headerContent}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>

        {backButton && (
          <Pressable
            style={styles.backButton}
            onPress={rightAction?.onPress}
            accessible
            accessibilityRole="button"
            accessibilityLabel={locale === "ar" ? "Retour" : "Back"}
          >
            <SymbolView
              name={
                isRtl
                  ? {
                      ios: "chevron.right",
                      android: "chevron_right",
                      web: "chevron_right",
                    }
                  : {
                      ios: "chevron.left",
                      android: "chevron_left",
                      web: "chevron_left",
                    }
              }
              size={20}
              tintColor={theme.text}
            />
          </Pressable>
        )}
      </ThemedView>

      {rightAction && (
        <ThemedText
          style={[
            styles.rightAction,
            {
              color: theme.text === "#1A1A1A" ? theme.textPrimary : theme.text,
            },
          ]}
        >
          {rightAction.label}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
  },
  backButton: {
    padding: 8,
    minWidth: 48,
    minHeight: 48,
  },
  rightAction: {
    fontSize: 14,
    fontWeight: 500,
  },
});
