import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();

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
        <ThemedText style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {locale === "ar" ? "إجراءات سريعة" : locale === "fr" ? "Raccourcis rapides" : "Quick Actions"}
        </ThemedText>
        <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
          <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
            {locale === "ar" ? "اختصارات" : "Shortcuts"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={action.onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${action.title}: ${action.subtitle}`}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
                <MaterialIcons
                  name={action.icon}
                  size={22}
                  color={theme.primary}
                />
              </View>

              <View style={styles.textWrap}>
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
              size={20}
              color={theme.textMuted}
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
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  badgeText: {
    ...Typography.badge,
    fontSize: 11,
    fontWeight: "600",
  },
  grid: {
    gap: 10,
  },
  actionCard: {
    minHeight: 58,
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
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
  },
  actionSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
});
