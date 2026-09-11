import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
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
      style={styles.card}
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
            customer.hasDebt ? styles.avatarDebt : styles.avatarSettled,
          ]}
        >
          <ThemedText
            style={[
              styles.avatarText,
              customer.hasDebt ? styles.avatarTextDebt : styles.avatarTextSettled,
            ]}
          >
            {initials}
          </ThemedText>
        </View>

        <View style={styles.infoSection}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {customer.name}
          </ThemedText>
          {subtitle.length > 0 ? (
            <ThemedText style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <View style={styles.rightSection}>
        {customer.hasDebt ? (
          <>
            <ThemedText style={styles.debtAmount}>
              {formatCentimes(customer.outstandingBalance, i18n.language as any)}
            </ThemedText>
            <View style={styles.debtBadge}>
              <ThemedText style={styles.debtBadgeText}>
                {t("customers:hasDebt")}
              </ThemedText>
            </View>
          </>
        ) : (
          <>
            <ThemedText style={styles.settledAmount}>
              0 DZD
            </ThemedText>
            <View style={styles.settledBadge}>
              <ThemedText style={styles.settledBadgeText}>
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
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
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
  avatarDebt: {
    backgroundColor: Colors.light.errorLight,
  },
  avatarSettled: {
    backgroundColor: Colors.light.primaryLight,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  avatarTextDebt: {
    color: Colors.light.destructive,
  },
  avatarTextSettled: {
    color: Colors.light.primary,
  },
  infoSection: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.destructive, // Red color for debt amounts per Stitch design
  },
  settledAmount: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  debtBadge: {
    backgroundColor: Colors.light.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  debtBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.destructive,
  },
  settledBadge: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  settledBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.primary,
  },
});
