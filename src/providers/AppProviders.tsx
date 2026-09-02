import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocaleProvider } from './LocaleProvider';
import { DatabaseProvider } from './DatabaseProvider';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTheme } from '@/hooks/use-theme';
import { Colors } from '@/constants/theme';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <DatabaseProvider>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </DatabaseProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
});