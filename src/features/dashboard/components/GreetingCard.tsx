import { View, Text, StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

interface GreetingCardProps {
  greeting: string;
  todayDate: string;
  locale: "ar" | "fr" | "en";
  textAlignment: "left" | "right";
}

export function GreetingCard({ greeting, todayDate, locale, textAlignment }: GreetingCardProps) {
  const alignment = textAlignment; // already resolved to "left" or "right"

  return (
    <ThemedView type="surface" style={styles.card}>
      <ThemedText type="body" style={styles.greetingText}>
        {greeting}
      </ThemedText>

      <ThemedText type="caption" style={[
        styles.dateText,
        { textAlign: locale === "ar" ? "right" : "left" },
      ]}>
        {todayDate}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1B6B3A",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});