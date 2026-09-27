import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

export default function NotFound() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.content}>
        <ThemedText style={[styles.message, { color: theme.textMuted }]}>{t("notFound")}</ThemedText>

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
  },
  content: {
    alignItems: "center",
    gap: Spacing.md,
  },
  message: {
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    marginTop: Spacing.md,
  },
});
