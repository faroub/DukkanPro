import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Spacing } from "@/constants/theme";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { Colors } from '@/constants/theme';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText style={styles.message}>{t("notFound")}</ThemedText>

        <PrimaryButton
          title={t("notFoundBackToHome")}
          style={styles.button}
          onPress={() => router.replace("/")}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.light.background,
  },
  content: {
    alignItems: "center",
    gap: Spacing.md,
  },
  message: {
    fontSize: 18,
    color: Colors.light.textMuted,
    textAlign: "center",
  },
  button: {
    marginTop: Spacing.md,
  },
});
