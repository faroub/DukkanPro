import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  subtitle?: string;
  locale?: "ar" | "fr" | "en";
}

export function EmptyState({
  icon: IconProp,
  title,
  subtitle,
  locale = "fr",
  ...rest
}: EmptyStateProps) {
  return (
    <ThemedView type="background" style={styles.container} {...rest}>
      <ThemedView style={styles.content}>
        {typeof IconProp === "string" ? (
          <Image source={{ uri: IconProp }} style={styles.iconImage} />
        ) : (
          IconProp
        )}
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>

        {subtitle && (
          <ThemedText type="small" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  iconImage: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
    resizeMode: "contain",
  },
  title: {
    fontSize: 18,
    fontWeight: 500,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
