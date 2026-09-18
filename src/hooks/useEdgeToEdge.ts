import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';

/**
 * useEdgeToEdge - Hook for true edge-to-edge display with safe area padding
 *
 * Returns the safe area insets and a basic style object.
 * The returned style sets `flex: 1` for full height and can be merged
 * with component-specific styles. Background color should be set by the
 * consumer to avoid overriding existing styles.
 *
 * Usage:
 *   const { insets, style } = useEdgeToEdge();
 *   return <View style={[styles.container, style]}>{...insets}>...</View>
 *
 * @returns Object with insets and a flex style to merge with component styles
 */
export function useEdgeToEdge() {
  const insets = useSafeAreaInsets();

  const style = StyleSheet.create({
    edgeToEdge: {
      flex: 1,
    },
  });

  return {
    insets,
    style: style.edgeToEdge,
  };
}