import { View, StyleSheet, Text } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { formatCentimes } from "@/utils/money";
import { getTextAlignment } from "@/utils/text";

interface SummaryCardsProps {
  revenueKey: string;
  revenueValue_centimes: number;
  profitKey: string;
  profitValue_centimes: number;
  toCollectKey?: string;
  toCollectValue_centimes?: number;
  locale: "ar" | "fr" | "en";
  textAlignment: "left" | "right";
}

export function SummaryCards({
  revenueKey,
  revenueValue_centimes,
  profitKey,
  profitValue_centimes,
  toCollectKey,
  toCollectValue_centimes,
  locale,
  textAlignment,
}: SummaryCardsProps) {
  const alignment = textAlignment;

  return (
    <ThemedView type="background" style={styles.section}>
      <ThemedText type="body" style={[
        styles.label,
        { textAlign: alignment },
      ]}>
        {revenueKey}
      </ThemedText>

      <ThemedText type="title" style={[
        styles.value,
        { textAlign: alignment },
      ]}>
        {formatCentimes(revenueValue_centimes)}
      </ThemedText>

      <ThemedText type="body" style={[
        styles.label,
        { textAlign: alignment },
      ]}>
        {profitKey}
      </ThemedText>

      <ThemedText type="title" style={[
        styles.value,
        { textAlign: alignment },
      ]}>
        {formatCentimes(profitValue_centimes)}
      </ThemedText>

      {toCollectValue_centimes !== undefined && toCollectKey !== undefined && (
        <>
          <ThemedText type="body" style={[
            styles.label,
            { textAlign: alignment },
          ]}>
            {toCollectKey}
          </ThemedText>

          <ThemedText type="title" style={[
            styles.value,
            { textAlign: alignment },
          ]}>
            {formatCentimes(toCollectValue_centimes)}
          </ThemedText>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1B6B3A",
  },
});