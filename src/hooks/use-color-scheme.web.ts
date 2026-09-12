import { useContext, useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { ThemeContext } from '@/providers/ThemeProvider';

function emptySubscribe() {
  return () => {};
}

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const context = useContext(ThemeContext);
  const colorScheme = useRNColorScheme();

  if (context && context.colorScheme) {
    return context.colorScheme;
  }

  if (isHydrated) {
    return colorScheme ?? 'light';
  }

  return 'light';
}
