import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing, Typography } from "@/constants/theme";

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  locale?: "ar" | "fr" | "en";
}

export function FormField({
  label,
  children,
  error,
  locale = "fr",
  ...rest
}: FormFieldProps) {
  return (
    <ThemedView style={styles.field} {...rest}>
      <ThemedText style={styles.label}>{label}</ThemedText>

      {children}

      {error && <ThemedText style={styles.errorMessage}>{error}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  errorMessage: {
    ...Typography.caption,
    color: Colors.light.error,
    marginTop: Spacing.xs,
  },
});
