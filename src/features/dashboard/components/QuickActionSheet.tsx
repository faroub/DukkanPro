import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";

interface QuickActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onNewSale: () => void;
  onAddProduct: () => void;
  onAddCustomer: () => void;
  onRecordPayment: () => void;
  locale?: "ar" | "fr" | "en";
}

export function QuickActionSheet({
  visible,
  onClose,
  onNewSale,
  onAddProduct,
  onAddCustomer,
  onRecordPayment,
  locale = "fr",
}: QuickActionSheetProps) {
  const actions = [
    {
      id: "sale",
      title: locale === "ar" ? "بيع جديد" : locale === "fr" ? "Nouvelle vente" : "New Sale",
      subtitle:
        locale === "ar"
          ? "تسجيل بيع سريع وإيصال"
          : locale === "fr"
          ? "Caisse rapide & reçu"
          : "Quick checkout & receipt",
      icon: "point-of-sale" as const,
      onPress: () => {
        onClose();
        onNewSale();
      },
    },
    {
      id: "product",
      title: locale === "ar" ? "إضافة منتج" : locale === "fr" ? "Ajouter produit" : "Add Product",
      subtitle:
        locale === "ar"
          ? "مسح الباركود أو الإدخال اليدوي"
          : locale === "fr"
          ? "Scanner code-barres ou saisie"
          : "Scan barcode or enter manually",
      icon: "qr-code-scanner" as const,
      onPress: () => {
        onClose();
        onAddProduct();
      },
    },
    {
      id: "customer",
      title: locale === "ar" ? "إضافة زبون" : locale === "fr" ? "Ajouter client" : "Add Customer",
      subtitle:
        locale === "ar"
          ? "إنشاء حساب أو دفتر ديون"
          : locale === "fr"
          ? "Créer compte ou carnet crédit"
          : "Create account or credit ledger",
      icon: "person-add" as const,
      onPress: () => {
        onClose();
        onAddCustomer();
      },
    },
    {
      id: "payment",
      title: locale === "ar" ? "تسجيل دفعة" : locale === "fr" ? "Encaisser dette" : "Record Payment",
      subtitle:
        locale === "ar"
          ? "تسديد دين أو دفعة جزئية"
          : locale === "fr"
          ? "Régler crédit ou acompte"
          : "Settle credit or partial payment",
      icon: "payments" as const,
      onPress: () => {
        onClose();
        onRecordPayment();
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Grab Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <ThemedText style={styles.headerTitle}>
                {locale === "ar" ? "إجراءات سريعة" : locale === "fr" ? "Raccourcis rapides" : "Quick Actions"}
              </ThemedText>
              <View style={styles.shortcutsBadge}>
                <ThemedText style={styles.shortcutsBadgeText}>
                  {locale === "ar" ? "اختصارات" : "Shortcuts"}
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close quick actions"
            >
              <MaterialIcons name="close" size={18} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 4 Large Action Buttons */}
          <View style={styles.buttonsList}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionButton}
                onPress={action.onPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${action.title}: ${action.subtitle}`}
              >
                <View style={styles.buttonLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons
                      name={action.icon}
                      size={22}
                      color={Colors.light.primary}
                    />
                  </View>

                  <View style={styles.buttonTextWrap}>
                    <ThemedText style={styles.actionTitle}>
                      {action.title}
                    </ThemedText>
                    <ThemedText style={styles.actionSubtitle}>
                      {action.subtitle}
                    </ThemedText>
                  </View>
                </View>

                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={Colors.light.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <ThemedText style={styles.dismissButtonText}>
              {locale === "ar" ? "إلغاء" : locale === "fr" ? "Annuler" : "Cancel"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: 16,
    ...Shadows.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
    alignSelf: "center",
    marginTop: -4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    ...Typography.heading2,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  shortcutsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.light.primaryLight,
  },
  shortcutsBadgeText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonsList: {
    gap: 10,
  },
  actionButton: {
    minHeight: 60,
    padding: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.sm,
  },
  buttonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTextWrap: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.label,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  actionSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  dismissButton: {
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  dismissButtonText: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
});
