import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, ComponentDimensions, Typography } from "@/constants/theme";
import { useTranslation } from "react-i18next";

interface TabItemDef {
  routeName: string;
  labelKey: string;
  symbol: {
    ios: string;
    android: string;
    web: string;
  };
}

const TABS: TabItemDef[] = [
  {
    routeName: "index",
    labelKey: "tabs.home",
    symbol: { ios: "house.fill", android: "home", web: "home" },
  },
  {
    routeName: "sell",
    labelKey: "tabs.sell",
    symbol: { ios: "cart.fill", android: "shopping_cart", web: "shopping_cart" },
  },
  {
    routeName: "products",
    labelKey: "tabs.products",
    symbol: { ios: "shippingbox.fill", android: "inventory_2", web: "inventory_2" },
  },
  {
    routeName: "customers",
    labelKey: "tabs.customers",
    symbol: { ios: "person.2.fill", android: "group", web: "group" },
  },
  {
    routeName: "more",
    labelKey: "tabs.more",
    symbol: { ios: "ellipsis.circle.fill", android: "more_horiz", web: "more_horiz" },
  },
];

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 4),
          height: ComponentDimensions.tabBarHeight + Math.max(insets.bottom, 0),
        },
      ]}
    >
      {TABS.map((tab) => {
        const routeIndex = state.routes.findIndex((r) => r.name === tab.routeName);
        const isFocused = state.index === routeIndex;
        const color = isFocused ? Colors.light.primary : Colors.light.textSecondary;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: state.routes[routeIndex]?.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.routeName);
          }
        };

        return (
          <Pressable
            key={tab.routeName}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : { selected: false }}
            accessibilityLabel={t(tab.labelKey)}
          >
            <View style={styles.iconContainer}>
              <SymbolView
                name={tab.symbol}
                size={22}
                tintColor={color}
              />
            </View>
            <Text
              style={[
                styles.label,
                {
                  color,
                  fontWeight: isFocused ? "600" : "500",
                },
              ]}
              numberOfLines={1}
            >
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    height: ComponentDimensions.tabBarHeight,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});