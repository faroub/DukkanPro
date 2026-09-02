import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Spacing } from '@/constants/theme';

import { AppTabBar } from '@/components/navigation/AppTabBar';
import { EmptyState } from '@/components/ui/EmptyState';

const Tab = createBottomTabNavigator();

export function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBar: (props) => <AppTabBar {...props} />,
        headerShown: false,
        animationEnabled: true,
        tabBarOptions: {
          showLabel: true,
          showIcon: true,
          activeTintColor: '#1B6B3A',
          inactiveTintColor: '#6B7280',
          labelStyle: {
            fontSize: 10,
            fontWeight: 500,
          },
          indicatorStyle: {
            backgroundColor: '#1B6B3A',
          },
          // Ensure tab order is always LTR - never mirror for Arabic
          // Tab order: Home, Sell, Products, Customers, More
          // This order stays the same regardless of language
        },
      }}
    >
      {/* Home tab - Dashboard */}
      <Tab.Screen
        name="home"
        component={() => {
          return (
            <EmptyState
              title={t('tabs.home')}
              subtitle={t('onboarding.subtitle')}
            />
          );
        }}
        options={{ title: t('home') }}
      />

      {/* Sell tab */}
      <Tab.Screen
        name="sell"
        component={() => {
          return <EmptyState title={t('tabs.sell')} subtitle="" />;
        }}
        options={{ title: t('sell') }}
      />

      {/* Products tab */}
      <Tab.Screen
        name="products"
        component={() => {
          return <EmptyState title={t('tabs.products')} subtitle="" />;
        }}
        options={{ title: t('products') }}
      />

      {/* Customers tab */}
      <Tab.Screen
        name="customers"
        component={() => {
          return <EmptyState title={t('tabs.customers')} subtitle="" />;
        }}
        options={{ title: t('customers') }}
      />

      {/* More / Settings tab */}
      <Tab.Screen
        name="more"
        component={() => {
          return <EmptyState title={t('tabs.more')} subtitle="" />;
        }}
        options={{ title: t('more') }}
      />
    </Tab.Navigator>
  );
}