import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface GreetingCardProps {
  greeting?: string;
  storeName?: string;
  todayDate: string;
  locale: "ar" | "fr" | "en";
  textAlignment?: "left" | "right";
  lowStockCount?: number;
  onProfilePress?: () => void;
  onOpenNotifications?: () => void;
}

export function GreetingCard({
  greeting,
  storeName = "Supérette El-Amel",
  todayDate,
  locale,
  lowStockCount = 0,
  onProfilePress,
  onOpenNotifications,
}: GreetingCardProps) {
  const router = useRouter();
  const theme = useTheme();

  const handleProfile = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push("/(tabs)/more" as any);
    }
  };

  const displayName = storeName || greeting || "Supérette El-Amel";

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleColumn}>
          <View style={styles.storeNameRow}>
            <ThemedText style={[styles.storeName, { color: theme.textPrimary }]} numberOfLines={1}>
              {displayName}
            </ThemedText>
            <View style={[styles.livePulseDot, { backgroundColor: theme.primary }]} />
          </View>
          <ThemedText style={[styles.dateText, { color: theme.textSecondary }]} numberOfLines={1}>
            {todayDate}
          </ThemedText>
        </View>

        <View style={styles.rightActions}>
          <View style={[styles.statusPill, { backgroundColor: theme.primaryLight }]}>
            <MaterialIcons
              name="wifi"
              size={13}
              color={theme.primary}
            />
            <ThemedText style={[styles.statusPillText, { color: theme.primary }]}>
              {locale === "ar" ? "جاهز" : locale === "fr" ? "Prêt" : "Online"}
            </ThemedText>
          </View>

          {/* Notification Bell Button with Red Badge */}
          <TouchableOpacity
            style={[
              styles.notificationButton,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
            onPress={onOpenNotifications}
            accessibilityRole="button"
            accessibilityLabel="Stock Alerts & Notifications"
            id="btn-greeting-notifications"
          >
            <MaterialIcons
              name={lowStockCount > 0 ? "notifications-active" : "notifications"}
              size={20}
              color={lowStockCount > 0 ? theme.warning : theme.textSecondary}
            />
            {lowStockCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: theme.error }]}>
                <ThemedText style={styles.notificationBadgeText}>
                  {lowStockCount > 99 ? "99+" : lowStockCount}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.profileButton,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
            onPress={handleProfile}
            accessibilityRole="button"
            accessibilityLabel="Store settings and profile"
          >
            <ThemedText style={[styles.profileAvatarText, { color: theme.textPrimary }]}>
              {displayName.charAt(0).toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  titleColumn: {
    flex: 1,
    paddingRight: Spacing.xs,
    minWidth: 0,
  },
  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  storeName: {
    ...Typography.heading2,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    flexShrink: 1,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  dateText: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  statusPillText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "600",
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  profileAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
