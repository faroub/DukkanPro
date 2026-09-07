import { StyleSheet, type ViewProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Spacing } from "@/constants/theme";

export type Status =
  | "paid"
  | "partial"
  | "cancelled"
  | "returned"
  | "positive"
  | "warning"
  | "destructive"
  | "neutral";

export interface StatusBadgeProps extends ViewProps {
  status: Status;
  label: string;
  color?: string;
  backgroundColor?: string;
  locale?: "ar" | "fr" | "en";
}

export function StatusBadge({
  status,
  label,
  color,
  backgroundColor,
  locale = "fr",
  style,
  ...rest
}: StatusBadgeProps) {
  let textColor = "#1B6B3A";
  let bg = "#E8F5EE";

  if (status === "paid" || status === "positive") {
    textColor = "#1B6B3A";
    bg = "#E8F5EE";
  } else if (status === "partial" || status === "warning") {
    textColor = "#D97706";
    bg = "#FFFBEB";
  } else if (status === "cancelled" || status === "returned" || status === "destructive") {
    textColor = "#B91C1C";
    bg = "#FEF2F2";
  } else if (status === "neutral") {
    textColor = "#6B7280";
    bg = "#F3F4F6";
  }

  if (color) textColor = color;
  if (backgroundColor) bg = backgroundColor;

  return (
    <ThemedView style={[styles.badge, { backgroundColor: bg }, style]} {...rest}>
      <ThemedText style={[styles.label, { color: textColor }]}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
});
