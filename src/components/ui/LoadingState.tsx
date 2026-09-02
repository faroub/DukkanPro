import { StyleSheet, View, type ViewProps } from 'react-native';
import { Animated, Easing } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface LoadingStateProps {
  message?: string;
  locale?: 'ar' | 'fr' | 'en';
  size?: number;
}

export function LoadingState({
  message,
  locale = 'fr',
  size = 24,
  ...rest
}: LoadingStateProps) {
  return (
    <ThemedView type="background" style={styles.container} {...rest}>
      <ThemedView style={styles.content}>
        <Animated.ActivityIndicator
          size={size}
          animating
          style={styles.indicator}
        />
        {message && (
          <ThemedText style={styles.message} marginTop={Spacing.xs}>
            {message}
          </ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  indicator: {
    color: '#1B6B3A',
  },
  message: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: 500,
  },
});