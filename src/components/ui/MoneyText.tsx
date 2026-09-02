import { StyleSheet, Text, type TextProps } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { formatCentimes } from "@/utils/money";

export type MoneyTextProps = TextProps & {
  centimes: number;
  locale?: "ar" | "fr" | "en";
  style?: TextProps["style"];
};

export function MoneyText({ centimes, locale = "fr", style }: MoneyTextProps) {
  const formatted = formatCentimes(
    centimes,
    `${locale}-DZ` as "ar-DZ" | "fr-DZ" | "en-DZ",
  );
  const theme = useTheme();
  const color = centimes >= 0 ? theme.positive : theme.destructive;

  return <Text style={[styles.text, style, { color }]}>{formatted}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: 500,
  },
});
