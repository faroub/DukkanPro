import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatCentimes } from "@/utils/money";

export interface CustomerRowData {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
  isActive: boolean;
  hasDebt: boolean;
  outstandingBalance: number; // in centimes
}

interface CustomerRowProps {
  customer: CustomerRowData;
  onPress?: () => void;
}

export function CustomerRow({ customer, onPress }: CustomerRowProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/customers/${customer.id}` as any);
    }
  };

  // Get initials for avatar
  const initials = customer.name
    ? customer.name
        .trim()
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("")
        : "??";

  // Subtitle line (phone or note)
  const subtitle = customer.phone
    ? customer.note
      ? `${customer.phone} • ${customer.note}`
      : customer.phone
    : customer.note || "";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderLight,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${customer.name}, ${
        customer.hasDebt
          ? `${t("customers:debt")}: ${formatCentimes(customer.outstandingBalance, i18n.language as any)}`
          : t("customers:settled")
      }`}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: customer.hasDebt
                ? theme.errorLight
                : theme.primaryLight,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.avatarText,
              {
                color: customer.hasDebt
                  ? theme.error || (theme as any).destructive
                  : theme.primary,
              },
            ]}
          >
            {initials}
          </ThemedText>
        </View>

        <View style={styles.infoSection}>
          <ThemedText
            style={[styles.name, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {customer.name}
          </ThemedText>
          {subtitle.length > 0 ? (
            <ThemedText
              style={[styles.subtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <View style={styles.rightSection}>
        {customer.hasDebt ? (
          <>
            <ThemedText
              style={[
                styles.debtAmount,
                { color: theme.error || (theme as any).destructive },
              ]}
            >
              {formatCentimes(customer.outstandingBalance, i18n.language as any)}
            </ThemedText>
            <View
              style={[
                styles.debtBadge,
                { backgroundColor: theme.errorLight },
              ]}
            >
              <ThemedText
                style={[
                  styles.debtBadgeText,
                  { color: theme.error || (theme as any).destructive },
                ]}
              >
                {t("customers:hasDebt")}
              </ThemedText>
            </View>
          </>
        ) : (
          <>
            <ThemedText
              style={[styles.settledAmount, { color: theme.textSecondary }]}
            >
              0 DZD
            </ThemedText>
            <View
              style={[
                styles.settledBadge,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <ThemedText
                style={[styles.settledBadgeText, { color: theme.primary }]}
              >
                {t("customers:settled")}
              </ThemedText>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  infoSection: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  settledAmount: {
    fontSize: 15,
    fontWeight: "500",
  },
  debtBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  debtBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  settledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  settledBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
