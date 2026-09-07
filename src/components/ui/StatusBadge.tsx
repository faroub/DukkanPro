import { StyleSheet, type ViewProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";

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
  const statusMap: Record<Status, { textColor: string; bg: string }> = {
    paid: { textColor: Colors.light.positive, bg: Colors.light.primaryLight },
    partial: { textColor: Colors.light.warning, bg: Colors.light.warningLight },
    cancelled: { textColor: Colors.light.destructive, bg: Colors.light.errorLight },
    returned: { textColor: Colors.light.destructive, bg: Colors.light.errorLight },
    destructive: { textColor: Colors.light.destructive, bg: Colors.light.errorLight },
    positive: { textColor: Colors.light.positive, bg: Colors.light.primaryLight },
    warning: { textColor: Colors.light.warning, bg: Colors.light.warningLight },
    neutral: { textColor: Colors.light.textSecondary, bg: Colors.light.backgroundElement },
  };

  const mapped = statusMap[status];
  const textColor = color ?? mapped.textColor;
  const bg = backgroundColor ?? mapped.bg;

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
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
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
