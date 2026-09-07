import { AppTabBar } from "@/components/navigation/AppTabBar";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="sell" options={{ title: t("tabs.sell") }} />
      <Tabs.Screen name="products" options={{ title: t("tabs.products") }} />
      <Tabs.Screen name="customers" options={{ title: t("tabs.customers") }} />
      <Tabs.Screen name="more" options={{ title: t("tabs.more") }} />
    </Tabs>
  );
}
