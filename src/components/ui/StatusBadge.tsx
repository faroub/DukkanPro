import { StyleSheet, View, type ViewProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();

  const statusMap: Record<Status, { textColor: string; bg: string }> = {
    paid: { textColor: theme.positive, bg: theme.primaryLight },
    partial: { textColor: theme.warning, bg: theme.warningLight },
    cancelled: { textColor: theme.destructive, bg: theme.errorLight },
    returned: { textColor: theme.destructive, bg: theme.errorLight },
    destructive: { textColor: theme.destructive, bg: theme.errorLight },
    positive: { textColor: theme.positive, bg: theme.primaryLight },
    warning: { textColor: theme.warning, bg: theme.warningLight },
    neutral: { textColor: theme.textSecondary, bg: theme.backgroundElement },
  };

  const mapped = statusMap[status] || statusMap.neutral;
  const textColor = color ?? mapped.textColor;
  const bg = backgroundColor ?? mapped.bg;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]} {...rest}>
      <ThemedText style={[styles.label, { color: textColor }]}>
        {label}
      </ThemedText>
    </View>
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
