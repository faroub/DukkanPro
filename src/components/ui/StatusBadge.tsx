import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type Status = 'paid' | 'partial' | 'cancelled';

export interface StatusBadgeProps extends ViewProps {
  status: Status;
  label: string;
  color?: string;
  locale?: 'ar' | 'fr' | 'en';
}

export function StatusBadge({
  status,
  label,
  color,
  locale = 'fr',
  ...rest
}: StatusBadgeProps) {
  const bgColor = color || (
    status === 'paid'
      ? '#1B6B3A'
      : status === 'partial'
      ? '#D97706'
      : '#B91C1C'
  );

  return (
    <ThemedView type="background" style={styles.badge} {...rest}>
      <ThemedText style={styles.label} color={bgColor}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 28,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
  },
});