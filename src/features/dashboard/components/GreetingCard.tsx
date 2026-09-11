import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";

interface GreetingCardProps {
  greeting?: string;
  storeName?: string;
  todayDate: string;
  locale: "ar" | "fr" | "en";
  textAlignment?: "left" | "right";
  onProfilePress?: () => void;
}

export function GreetingCard({
  greeting,
  storeName = "Supérette El-Amel",
  todayDate,
  locale,
  onProfilePress,
}: GreetingCardProps) {
  const router = useRouter();

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
            <ThemedText style={styles.storeName} numberOfLines={1}>
              {displayName}
            </ThemedText>
            <View style={styles.livePulseDot} />
          </View>
          <ThemedText style={styles.dateText} numberOfLines={1}>
            {todayDate}
          </ThemedText>
        </View>

        <View style={styles.rightActions}>
          <View style={styles.statusPill}>
            <MaterialIcons
              name="wifi"
              size={13}
              color={Colors.light.primary}
            />
            <ThemedText style={styles.statusPillText}>
              {locale === "ar" ? "جاهز" : locale === "fr" ? "Prêt" : "Online"}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfile}
            accessibilityRole="button"
            accessibilityLabel="Store settings and profile"
          >
            <ThemedText style={styles.profileAvatarText}>
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
  },
  titleColumn: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  storeName: {
    ...Typography.heading2,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  dateText: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  statusPillText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
});
