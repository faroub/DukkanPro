import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";

interface QuickActionsProps {
  quickActionNewSale?: string;
  quickActionAddProduct?: string;
  quickActionAddCustomer?: string;
  quickActionRecordPayment?: string;
  locale?: "ar" | "fr" | "en";
  textAlignment?: "left" | "right";
  onNewSale: () => void;
  onAddProduct: () => void;
  onAddCustomer: () => void;
  onRecordPayment: () => void;
}

export function QuickActions({
  quickActionNewSale = "New Sale",
  quickActionAddProduct = "Add Product",
  quickActionAddCustomer = "Add Customer",
  quickActionRecordPayment = "Record Payment",
  locale = "fr",
  onNewSale,
  onAddProduct,
  onAddCustomer,
  onRecordPayment,
}: QuickActionsProps) {
  const actions = [
    {
      id: "sale",
      title: quickActionNewSale,
      subtitle:
        locale === "ar"
          ? "تسجيل بيع سريع وإيصال"
          : locale === "fr"
          ? "Caisse rapide & reçu"
          : "Quick checkout & receipt",
      icon: "point-of-sale" as const,
      onPress: onNewSale,
    },
    {
      id: "product",
      title: quickActionAddProduct,
      subtitle:
        locale === "ar"
          ? "مسح الباركود أو الإدخال اليدوي"
          : locale === "fr"
          ? "Scanner code-barres ou saisie"
          : "Scan barcode or enter manually",
      icon: "qr-code-scanner" as const,
      onPress: onAddProduct,
    },
    {
      id: "customer",
      title: quickActionAddCustomer,
      subtitle:
        locale === "ar"
          ? "إنشاء حساب أو دفتر ديون"
          : locale === "fr"
          ? "Créer compte ou carnet crédit"
          : "Create account or credit ledger",
      icon: "person-add" as const,
      onPress: onAddCustomer,
    },
    {
      id: "payment",
      title: quickActionRecordPayment,
      subtitle:
        locale === "ar"
          ? "تسديد دين أو دفعة جزئية"
          : locale === "fr"
          ? "Régler crédit ou acompte"
          : "Settle credit or partial payment",
      icon: "payments" as const,
      onPress: onRecordPayment,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.sectionTitle}>
          {locale === "ar" ? "إجراءات سريعة" : locale === "fr" ? "Raccourcis rapides" : "Quick Actions"}
        </ThemedText>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>
            {locale === "ar" ? "اختصارات" : "Shortcuts"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={action.onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${action.title}: ${action.subtitle}`}
          >
            <View style={styles.cardLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons
                  name={action.icon}
                  size={22}
                  color={Colors.light.primary}
                />
              </View>

              <View style={styles.textWrap}>
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
              size={20}
              color={Colors.light.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.heading3,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.light.primaryLight,
  },
  badgeText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  grid: {
    gap: 10,
  },
  actionCard: {
    minHeight: 58,
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
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  textWrap: {
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
});
