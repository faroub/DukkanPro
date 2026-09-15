import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export interface AppScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function AppScreen({ children, header }: AppScreenProps) {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: safeAreaInsets.top + Spacing.lg,
          paddingBottom: safeAreaInsets.bottom + Spacing.xl,
          paddingLeft: safeAreaInsets.left + Spacing.lg,
          paddingRight: safeAreaInsets.right + Spacing.lg,
        },
      ]}
      style={styles.background}
      showsVerticalScrollIndicator={false}
    >
      {header && (
        <ThemedView type="background" style={styles.headerContainer}>
          {header}
        </ThemedView>
      )}

      <ThemedView type="background" style={styles.contentArea}>
        {children}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "rgba(248, 247, 244, 1)", // light background from theme
  },
  contentContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  contentArea: {
    width: "100%",
  },
});
