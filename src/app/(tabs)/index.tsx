import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

import DashboardScreen from "@/features/dashboard/DashboardScreen";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const currentLang = i18n.language?.startsWith("ar")
    ? "ar"
    : i18n.language?.startsWith("en")
      ? "en"
      : "fr";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <DashboardScreen
        t={(key: string, ...args: any[]) => String(t(key, args[0]))}
        locale={currentLang}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
