import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Colors } from '@/constants/theme';

import DashboardScreen from "@/features/dashboard/DashboardScreen";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("ar")
    ? "ar"
    : i18n.language?.startsWith("en")
      ? "en"
      : "fr";

  return (
    <View style={styles.container}>
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
    backgroundColor: Colors.light.background,
  },
});
