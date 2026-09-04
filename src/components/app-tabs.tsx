import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, descriptors }) => null}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="sell" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
