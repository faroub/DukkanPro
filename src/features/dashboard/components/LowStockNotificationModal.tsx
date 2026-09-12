import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  triggerLowStockPushNotification,
} from "@/services/notifications/lowStockNotifier";

interface LowStockNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  lowStockProducts: any[];
  locale?: "ar" | "fr" | "en";
  onRestockProduct: (product: any) => void;
}

export function LowStockNotificationModal({
  visible,
  onClose,
  lowStockProducts = [],
  locale = "fr",
  onRestockProduct,
}: LowStockNotificationModalProps) {
  const theme = useTheme();
  const [permissionStatus, setPermissionStatus] = useState<string>(
    getNotificationPermissionStatus()
  );
  const [testSent, setTestSent] = useState(false);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(res);
    if (res === "granted" && lowStockProducts.length > 0) {
      triggerLowStockPushNotification(lowStockProducts);
    }
  };

  const handleTestNotification = () => {
    if (permissionStatus !== "granted") {
      handleRequestPermission();
      return;
    }
    const success = triggerLowStockPushNotification(lowStockProducts);
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          id="low-stock-notification-modal-card"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View
                style={[
                  styles.headerIconContainer,
                  { backgroundColor: theme.warningLight },
                ]}
              >
                <MaterialIcons
                  name="notifications-active"
                  size={22}
                  color={theme.warning}
                />
              </View>
              <View>
                <ThemedText style={[styles.title, { color: theme.textPrimary }]}>
                  {locale === "ar"
                    ? "مركز تنبيهات المخزون"
                    : locale === "fr"
                    ? "Centre d'Alerte Stock"
                    : "Low Stock Alert Center"}
                </ThemedText>
                <ThemedText
                  style={[styles.subtitle, { color: theme.textSecondary }]}
                >
                  {lowStockProducts.length}{" "}
                  {locale === "ar"
                    ? "منتجات تتطلب التزويد"
                    : locale === "fr"
                    ? "articles nécessitent un réapprovisionnement"
                    : "products require restock"}
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.surfaceAlt }]}
              onPress={onClose}
              activeOpacity={0.7}
              id="btn-close-notification-modal"
            >
              <MaterialIcons name="close" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Push Notification Controls Strip */}
          <View
            style={[
              styles.pushControlCard,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.borderLight },
            ]}
          >
            <View style={styles.pushControlLeft}>
              <MaterialIcons
                name={permissionStatus === "granted" ? "phonelink-ring" : "notifications-none"}
                size={22}
                color={theme.primary}
              />
              <View style={styles.pushTextWrap}>
                <ThemedText style={[styles.pushTitle, { color: theme.textPrimary }]}>
                  {locale === "ar"
                    ? "إشعارات المتصفح الفورية"
                    : locale === "fr"
                    ? "Notifications Push Navigateur"
                    : "Browser Push Notifications"}
                </ThemedText>
                <ThemedText style={[styles.pushStatus, { color: theme.textSecondary }]}>
                  {permissionStatus === "granted"
                    ? locale === "ar"
                      ? "مفعّلة - تستقبل تنبيهات نقص المخزون"
                      : locale === "fr"
                      ? "Activées - Vous recevez les alertes en direct"
                      : "Active - Receiving instant stock alerts"
                    : locale === "ar"
                    ? "غير مفعّلة - انقر للتفعيل"
                    : locale === "fr"
                    ? "Non activées - Cliquez pour autoriser"
                    : "Disabled - Tap to authorize"}
                </ThemedText>
              </View>
            </View>

            {permissionStatus !== "granted" ? (
              <TouchableOpacity
                style={[styles.enableBtn, { backgroundColor: theme.primary }]}
                onPress={handleRequestPermission}
                activeOpacity={0.8}
                id="btn-modal-enable-push"
              >
                <ThemedText style={styles.enableBtnText}>
                  {locale === "ar" ? "تفعيل" : locale === "fr" ? "Activer" : "Enable"}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.testBtn, { backgroundColor: theme.surface }]}
                onPress={handleTestNotification}
                activeOpacity={0.7}
                id="btn-test-push-notification"
              >
                <MaterialIcons name="send" size={14} color={theme.primary} />
                <ThemedText style={[styles.testBtnText, { color: theme.primary }]}>
                  {testSent
                    ? locale === "ar"
                      ? "تم الإرسال!"
                      : locale === "fr"
                      ? "Envoyé !"
                      : "Sent!"
                    : locale === "ar"
                    ? "تجربة"
                    : locale === "fr"
                    ? "Tester"
                    : "Test"}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* List of Low Stock Products with Progress Bar */}
          <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
            {lowStockProducts.map((product) => {
              const minThreshold = product.minimum_stock_quantity ?? 5;
              const currentStock = product.stock_quantity ?? 0;
              const ratio = Math.min(1, Math.max(0, currentStock / (minThreshold || 1)));
              const isZero = currentStock === 0;

              return (
                <View
                  key={product.id}
                  style={[
                    styles.productRow,
                    { backgroundColor: theme.surface, borderColor: theme.borderLight },
                  ]}
                >
                  <View style={styles.productMainInfo}>
                    <View style={styles.productNameRow}>
                      <ThemedText style={[styles.productName, { color: theme.textPrimary }]}>
                        {product.name}
                      </ThemedText>
                      {isZero ? (
                        <View style={[styles.badge, { backgroundColor: theme.errorLight || "#FEE2E2" }]}>
                          <ThemedText style={[styles.badgeText, { color: theme.error }]}>
                            {locale === "ar" ? "نفد" : locale === "fr" ? "Rupture" : "Out of stock"}
                          </ThemedText>
                        </View>
                      ) : (
                        <View style={[styles.badge, { backgroundColor: theme.warningLight || "#FEF3C7" }]}>
                          <ThemedText style={[styles.badgeText, { color: theme.warning }]}>
                            {locale === "ar" ? "منخفض" : locale === "fr" ? "Faible" : "Low"}
                          </ThemedText>
                        </View>
                      )}
                    </View>

                    {/* Stock Progress Bar */}
                    <View style={styles.progressSection}>
                      <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
                        <View
                          style={[
                            styles.fillBar,
                            {
                              width: `${Math.round(ratio * 100)}%`,
                              backgroundColor: isZero ? theme.error : theme.warning,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText style={[styles.stockMetaText, { color: theme.textSecondary }]}>
                        {currentStock} / {minThreshold} {product.unit || "pcs"}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Restock Button */}
                  <TouchableOpacity
                    style={[styles.restockActionBtn, { backgroundColor: theme.primaryLight }]}
                    onPress={() => {
                      onClose();
                      onRestockProduct(product);
                    }}
                    activeOpacity={0.8}
                    id={`btn-modal-restock-${product.id}`}
                  >
                    <MaterialIcons name="add" size={18} color={theme.primary} />
                    <ThemedText style={[styles.restockActionText, { color: theme.primary }]}>
                      {locale === "ar" ? "تزويد" : locale === "fr" ? "+ Stock" : "+ Restock"}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.modalFooter, { borderTopColor: theme.borderLight }]}>
            <TouchableOpacity
              style={[styles.footerCloseBtn, { backgroundColor: theme.primary }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.footerCloseText}>
                {locale === "ar" ? "إغلاق" : locale === "fr" ? "Fermer" : "Close"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.md,
    maxHeight: "85%",
    borderWidth: 1,
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...Typography.heading3,
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pushControlCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  pushControlLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  pushTextWrap: {
    flex: 1,
  },
  pushTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  pushStatus: {
    fontSize: 11,
    marginTop: 1,
  },
  enableBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.button,
  },
  enableBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  productList: {
    maxHeight: 320,
    marginVertical: 4,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  productMainInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  productNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fillBar: {
    height: "100%",
    borderRadius: 3,
  },
  stockMetaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  restockActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.button,
  },
  restockActionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalFooter: {
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
  },
  footerCloseBtn: {
    height: 44,
    borderRadius: BorderRadius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  footerCloseText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
