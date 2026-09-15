import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  getNotificationPermissionStatus,
  isNotificationSnoozed,
  requestNotificationPermission,
  snoozeNotifications,
  triggerLowStockPushNotification,
} from "@/services/notifications/lowStockNotifier";

interface LowStockAlertBannerProps {
  lowStockProducts: any[];
  locale?: "ar" | "fr" | "en";
  onRestockProduct?: (product: any) => void;
  onOpenNotificationModal?: () => void;
  onViewAll?: () => void;
}

export function LowStockAlertBanner({
  lowStockProducts = [],
  locale = "fr",
  onRestockProduct,
  onOpenNotificationModal,
  onViewAll,
}: LowStockAlertBannerProps) {
  const theme = useTheme();
  const [dismissed, setDismissed] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>("default");

  useEffect(() => {
    setPermissionStatus(getNotificationPermissionStatus());
    if (isNotificationSnoozed()) {
      setDismissed(true);
    }
  }, []);

  // Trigger push notification automatically if permitted and low stock exists
  useEffect(() => {
    if (lowStockProducts.length > 0 && !dismissed) {
      triggerLowStockPushNotification(lowStockProducts);
    }
  }, [lowStockProducts, dismissed]);

  if (lowStockProducts.length === 0 || dismissed) {
    return null;
  }

  const handleEnablePush = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(res);
    if (res === "granted") {
      triggerLowStockPushNotification(lowStockProducts);
    }
  };

  const handleSnooze = () => {
    snoozeNotifications(60); // Snooze for 1 hour
    setDismissed(true);
  };

  const count = lowStockProducts.length;

  const headerTitle =
    locale === "ar"
      ? `تنبيه: ${count} منتجات تحت حد التنبيه للمخزون`
      : locale === "fr"
      ? `Alerte: ${count} produit${count > 1 ? "s" : ""} sous le seuil critique`
      : `Alert: ${count} product${count > 1 ? "s" : ""} below minimum stock`;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.warningLight || "#FFFBEB",
          borderColor: theme.warning || "#F59E0B",
        },
      ]}
      id="low-stock-home-alert-banner"
    >
      {/* Top Banner Row */}
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: theme.warning || "#F59E0B" },
            ]}
          >
            <MaterialIcons name="warning" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.textStack}>
            <ThemedText style={[styles.title, { color: theme.textPrimary }]}>
              {headerTitle}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              {locale === "ar"
                ? "يرجى إعادة تموين هذه المنتجات لتجنب نفاد المخزون"
                : locale === "fr"
                ? "Réapprovisionnez rapidement ces articles pour éviter la rupture"
                : "Restock these items promptly to avoid stockouts"}
            </ThemedText>
          </View>
        </View>

        {/* Close / Snooze Button */}
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: theme.surface }]}
          onPress={handleSnooze}
          activeOpacity={0.7}
          accessibilityLabel="Dismiss low stock alert banner"
          id="btn-dismiss-low-stock-banner"
        >
          <MaterialIcons name="close" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Product Items Horizontal Scroll Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.itemStrip}
      >
        {lowStockProducts.slice(0, 6).map((item) => {
          const isCritical = item.stock_quantity === 0;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemChip,
                {
                  backgroundColor: theme.surface,
                  borderColor: isCritical ? theme.error : theme.border,
                },
              ]}
              onPress={() => onRestockProduct && onRestockProduct(item)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[styles.itemName, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                {item.name}
              </ThemedText>
              <View style={styles.stockCountRow}>
                <ThemedText
                  style={[
                    styles.stockNum,
                    { color: isCritical ? theme.error : theme.warning },
                  ]}
                >
                  {item.stock_quantity} {item.unit || "pcs"}
                </ThemedText>
                <ThemedText style={[styles.stockMin, { color: theme.textMuted }]}>
                  (Min: {item.minimum_stock_quantity ?? 5})
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Actions Row */}
      <View style={styles.actionRow}>
        {permissionStatus !== "granted" ? (
          <TouchableOpacity
            style={[styles.enablePushBtn, { backgroundColor: theme.surface }]}
            onPress={handleEnablePush}
            activeOpacity={0.7}
            id="btn-enable-push-alerts"
          >
            <MaterialIcons name="notifications-active" size={15} color={theme.primary} />
            <ThemedText style={[styles.enablePushText, { color: theme.primary }]}>
              {locale === "ar"
                ? "تفعيل إشعارات المتصفح"
                : locale === "fr"
                ? "Activer notifications push"
                : "Enable push alerts"}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.pushActiveBadge}>
            <MaterialIcons name="check-circle" size={14} color={theme.primary} />
            <ThemedText style={[styles.pushActiveText, { color: theme.primary }]}>
              {locale === "ar" ? "الإشعارات مفعّلة" : locale === "fr" ? "Notifications activées" : "Push alerts active"}
            </ThemedText>
          </View>
        )}

        <TouchableOpacity
          style={[styles.reviewBtn, { backgroundColor: theme.warning || "#F59E0B" }]}
          onPress={onOpenNotificationModal || onViewAll}
          activeOpacity={0.8}
          id="btn-review-low-stock-all"
        >
          <ThemedText style={styles.reviewBtnText}>
            {locale === "ar" ? "عرض الكل وتزويد" : locale === "fr" ? "Revoir & Réappro" : "Review All"}
          </ThemedText>
          <MaterialIcons name="arrow-forward" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
    paddingRight: Spacing.xs,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textStack: {
    flex: 1,
  },
  title: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  itemStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  itemChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 110,
    ...Shadows.sm,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "600",
  },
  stockCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  stockNum: {
    fontSize: 12,
    fontWeight: "700",
  },
  stockMin: {
    fontSize: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  enablePushBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  enablePushText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pushActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pushActiveText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.button,
  },
  reviewBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
