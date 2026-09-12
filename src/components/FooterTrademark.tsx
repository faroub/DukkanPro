import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface FooterTrademarkProps {
  style?: any;
  lightText?: boolean;
}

export function FooterTrademark({ style }: FooterTrademarkProps) {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <View style={[styles.container, style]} id="trademark-footer">
      <ThemedText style={[styles.text, { color: theme.textMuted || "#9CA3AF" }]}>
        © mzilab {currentYear}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: "auto",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
