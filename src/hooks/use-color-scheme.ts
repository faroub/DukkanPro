import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { ThemeContext } from '@/providers/ThemeProvider';

export function useColorScheme() {
  const context = useContext(ThemeContext);
  const rnScheme = useRNColorScheme();
  
  if (context && context.colorScheme) {
    return context.colorScheme;
  }
  
  return rnScheme ?? 'light';
}

