import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();

  return (
    <View style={styles.field} {...rest}>
      <ThemedText style={[styles.label, { color: theme.textPrimary }]}>{label}</ThemedText>

      {children}

      {error && <ThemedText style={[styles.errorMessage, { color: theme.error }]}>{error}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  errorMessage: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
