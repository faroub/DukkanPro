import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  locale?: 'ar' | 'fr' | 'en';
}

export function FormField({
  label,
  children,
  error,
  locale = 'fr',
  ...rest
}: FormFieldProps) {
  return (
    <ThemedView style={styles.field} {...rest}>
      <ThemedText style={styles.label}>
        {label}
      </ThemedText>

      {children}

      {error && (
        <ThemedText style={styles.errorMessage}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: 500,
    marginBottom: Spacing.xs,
  },
  errorMessage: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: Spacing.xs,
  },
});