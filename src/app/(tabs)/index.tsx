import { ThemedView } from "@/components/themed-view";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { Colors, Spacing } from '@/constants/theme';

import DashboardScreen from "@/features/dashboard/DashboardScreen";

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <ThemedView type="background" style={styles.container}>
      <ThemedView style={styles.content}>
        <DashboardScreen
          t={(key: string, ...args: any[]) => String(t(key, args[0]))}
          locale="fr"
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.xl,
  },
});
