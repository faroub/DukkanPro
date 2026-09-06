import React from "react";
import { ThemedView, ThemedText, StyleSheet } from "@/components";
import { Spacing } from "@/constants/theme";

/**
 * SettingsSection - A reusable settings section with a title and optional description.
 * The entire application remains visually LTR regardless of selected language.
 */
interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * SettingsSection - A reusable section component for settings screens.
 * - LTR layout maintained always
 * - Arabic text may use right alignment inside text components only
 * - No global RTL mirroring
 */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <ThemedView style={styles.container}>
      {description && (
        <ThemedText style={styles.description}>
          {description}
        </ThemedText>
      )}
      <ThemedText style={styles.title}>
        {title}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: Spacing.md,
  },
});

export type { SettingsSectionProps };