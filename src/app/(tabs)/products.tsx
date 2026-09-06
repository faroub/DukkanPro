import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { ProductListScreen } from "@/features/products/ProductListScreen";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

export default function ProductsScreen() {
  const { t } = useTranslation();

  return (
    <ThemedView type="background" style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {/* i18n: products.title */}
          {t("products.title")}
        </ThemedText>

        <ThemedText type="subtitle" style={styles.subtitle}>
          {/* i18n: products.subtitle */}
          {t("products.subtitle")}
        </ThemedText>

        <ThemedText type="small" style={styles.description}>
          {/* i18n: products.description */}
          {t("products.description")}
        </ThemedText>

        <ProductListScreen />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F4",
    padding: Spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#1A1A1A",
    textAlign: "center",
  },
});
