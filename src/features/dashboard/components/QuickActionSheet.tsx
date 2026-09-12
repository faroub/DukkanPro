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
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();

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

        <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
          {/* Grab Handle */}
          <View style={[styles.handleBar, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <ThemedText style={[styles.headerTitle, { color: theme.textPrimary }]}>
                {locale === "ar" ? "إجراءات سريعة" : locale === "fr" ? "Raccourcis rapides" : "Quick Actions"}
              </ThemedText>
              <View style={[styles.shortcutsBadge, { backgroundColor: theme.primaryLight }]}>
                <ThemedText style={[styles.shortcutsBadgeText, { color: theme.primary }]}>
                  {locale === "ar" ? "اختصارات" : "Shortcuts"}
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.surfaceAlt }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close quick actions"
            >
              <MaterialIcons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 4 Large Action Buttons */}
          <View style={styles.buttonsList}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={action.onPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${action.title}: ${action.subtitle}`}
              >
                <View style={styles.buttonLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
                    <MaterialIcons
                      name={action.icon}
                      size={22}
                      color={theme.primary}
                    />
                  </View>

                  <View style={styles.buttonTextWrap}>
                    <ThemedText style={[styles.actionTitle, { color: theme.textPrimary }]}>
                      {action.title}
                    </ThemedText>
                    <ThemedText style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                      {action.subtitle}
                    </ThemedText>
                  </View>
                </View>

                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={[styles.dismissButton, { backgroundColor: theme.surfaceAlt }]}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <ThemedText style={[styles.dismissButtonText, { color: theme.textSecondary }]}>
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
  },
  shortcutsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  shortcutsBadgeText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    borderWidth: 1,
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
  },
  actionSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  dismissButton: {
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  dismissButtonText: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: "600",
  },
});
