import { StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslation } from 'react-i18next';

type TabKey = 'home' | 'sell' | 'products' | 'customers' | 'more';

const tabKeys: TabKey[] = ['home', 'sell', 'products', 'customers', 'more'];

const TabConfig = {
  home: { label: 'tabs.home' },
  sell: { label: 'tabs.sell' },
  products: { label: 'tabs.products' },
  customers: { label: 'tabs.customers' },
  more: { label: 'tabs.more' },
} as const;

export interface AppTabBarProps {
  navigation: any;
  state: any;
  descriptors: any;
}

export function AppTabBar({ navigation, state, descriptors }: AppTabBarProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
    >
      {tabKeys.map((key) => {
        const isFocused = state.index === tabKeys.indexOf(key);

        return (
          <TouchableOpacity
            key={key}
            style={styles.tab}
            accessibilityState={isFocused ? { selected: true } : { selected: false }}
            accessibilityLabel={t(TabConfig[key as keyof typeof TabConfig].label)}
            onPress={() => navigation?.navigate(key)}
          >
            <ThemedView style={styles.iconContainer}>
              <ThemedText type="small" style={styles.icon}>
                {/* Icon will be rendered based on tab key */}
              </ThemedText>
            </ThemedView>

            <ThemedText style={styles.label}>
              {t(TabConfig[key as keyof typeof TabConfig].label)}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  } as ViewStyle,
  iconContainer: {
    width: 24,
    height: 24,
    marginBottom: 4,
  } as ViewStyle,
  icon: {
    fontSize: 20,
    color: '#1B6B3A',
  } as TextStyle,
  label: {
    fontSize: 10,
    fontWeight: 500,
    textAlign: 'center',
  } as TextStyle,
});