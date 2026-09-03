import { StyleSheet, Text, type TextProps } from "react-native";

import { Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getTextAlignment } from "@/utils/text";

export type AppTextProps = TextProps & {
  align?: "left" | "right" | "center" | "auto";
  locale?: "ar" | "fr" | "en";
};

export function AppText({
  align = "left",
  locale = "fr",
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const alignment =
    align === "auto" ? getTextAlignment(locale as "ar" | "fr" | "en") : align;

  return (
    <Text
      style={[
        styles.base,
        // Apply alignment at text level only, never reverse parent layout
        { textAlign: alignment },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Typography.body.fontFamily,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    letterSpacing: Typography.body.letterSpacing,
  },
});
