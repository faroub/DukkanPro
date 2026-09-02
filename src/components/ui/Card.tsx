import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing, Shadows } from '@/constants/theme';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  elevation?: keyof typeof Shadows;
  borderColor?: string;
  shadow?: keyof typeof Shadows;
}

export function Card({
  children,
  elevation = 'md',
  borderColor = '#E5E5E5',
  shadow = 'md',
  ...rest
}: CardProps) {
  const shadowStyle = Shadows[elevation] || Shadows.md;

  return (
    <ThemedView style={styles.container} {...rest}>
      <View style={styles.content}>{children}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: borderColor,
    borderRadius: Spacing.md,
    ...Shadows.lg,
    overflow: 'hidden',
    shadowColor: Shadows.lg.shadowColor,
    shadowOffset: Shadows.lg.shadowOffset,
    shadowOpacity: Shadows.lg.shadowOpacity,
    shadowRadius: Shadows.lg.shadowRadius,
    elevation: Shadows.lg.elevation,
  },
  content: {
    padding: Spacing.lg,
  },
});