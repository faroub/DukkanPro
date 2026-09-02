import { StyleSheet, View, ViewPressEvent, type ViewProps } from 'react-native';
import { LeftChevron, RightChevron } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface AppHeaderProps {
  title: string;
  backButton?: boolean;
  rightAction?: {
    label: string;
    onPress: () => void;
    accessibleLabel?: string;
  };
  locale?: 'ar' | 'fr' | 'en';
}

export function AppHeader({ title, backButton = true, rightAction, locale = 'fr' }: AppHeaderProps) {
  const theme = useTheme();
  const isRtl = locale === 'ar';

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.headerContent}>
        <ThemedText type="title" style={styles.title}>{title}</ThemedText>

        {backButton && (
          <Pressable
            style={styles.backButton}
            onPress={() => {}}
            accessible accessibilityLabel={locale === 'ar' ? 'Retour' : 'Back'}
          >
            <LeftChevron
              size={20}
              weight="bold"
              tintColor={theme.text}
              style={{ transform: [{ scaleX: isRtl ? -1 : 1 }] }} // LTR arrow direction fixed
            />
          </Pressable>
        )}
      </ThemedView>

      {rightAction && (
        <ThemedText
          style={[
            styles.rightAction,
            { color: theme[theme.text === '#1A1A1A' ? 'textPrimary' : 'text'] },
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
  },
  backButton: {
    padding: Spacing.sm,
  },
  // Fixed LTR back arrow - scaleX does not mirror the layout
  // The arrow itself faces fixed direction regardless of language
  rightAction: {
    fontSize: 14,
    fontWeight: 500,
  },
});