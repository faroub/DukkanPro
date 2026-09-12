import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { formatCentimes } from "@/utils/money";

interface PaymentReminderPreviewProps {
  customerId: number;
  customerName: string;
  currentDebt: number; // in centimes
  customerPhone?: string;
}

export function PaymentReminderPreview({
  customerId,
  customerName,
  currentDebt,
  customerPhone,
}: PaymentReminderPreviewProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [lang, setLang] = useState<"fr" | "ar" | "en">(
    i18n.language.startsWith("ar")
      ? "ar"
      : i18n.language.startsWith("en")
        ? "en"
        : "fr"
  );
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");

  // Format amount for message
  const amountDinars = Math.round(currentDebt / 100);

  // Generate localized message body
  const messageBody = useMemo(() => {
    switch (lang) {
      case "ar":
        return `مرحباً ${customerName}،\nرصيدكم المتبقي في المتجر هو ${amountDinars} دج.\nشكراً لزيارتكم ووفائكم المستمر!`;
      case "en":
        return `Hello ${customerName},\nYour outstanding balance at the store is ${amountDinars} DZD.\nThank you for your business and see you soon!`;
      case "fr":
      default:
        return `Bonjour ${customerName},\nVotre solde restant en boutique est de ${amountDinars} DZD.\nMerci pour votre confiance et à très bientôt !`;
    }
  }, [customerName, amountDinars, lang]);

  const handleSend = useCallback(async () => {
    const encodedText = encodeURIComponent(messageBody);

    let formattedPhone = (customerPhone || "").replace(/\s+/g, "").replace(/[^0-9]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "213" + formattedPhone.slice(1);
    }

    if (channel === "whatsapp") {
      const whatsappUrl = formattedPhone
        ? `https://wa.me/${formattedPhone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          t("common:error"),
          t("customers:whatsappNotInstalled") || "WhatsApp is not installed."
        );
      }
    } else {
      const smsUrl = formattedPhone
        ? `sms:${formattedPhone}?body=${encodedText}`
        : `sms:?body=${encodedText}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert(
          t("common:error"),
          t("customers:smsNotSupported") || "SMS is not supported on this device."
        );
      }
    }
  }, [channel, messageBody, customerPhone, t]);

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t("common:back")}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={Colors.light.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <ThemedText style={styles.headerTitle}>
            {t("customers:paymentReminderPreview")}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
            {customerName}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Profile & Debt Summary */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {customerName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View>
              <ThemedText style={styles.customerName}>{customerName}</ThemedText>
              <ThemedText style={styles.clientTag}>
                {t("customers:client")} #{customerId}
              </ThemedText>
            </View>
          </View>

          <View style={styles.debtInfo}>
            <ThemedText style={styles.debtLabel}>
              {t("customers:currentDebt")}
            </ThemedText>
            <ThemedText style={styles.debtAmount}>
              {formatCentimes(currentDebt, i18n.language as any)}
            </ThemedText>
          </View>
        </View>

        {/* Language Selector */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:selectLanguage")}
          </ThemedText>
          <View style={styles.languageRow}>
            {(
              [
                { key: "fr", label: "Français" },
                { key: "ar", label: "العربية" },
                { key: "en", label: "English" },
              ] as const
            ).map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.languageChip,
                  lang === item.key && styles.languageChipActive,
                ]}
                onPress={() => setLang(item.key)}
              >
                <ThemedText
                  style={[
                    styles.languageChipText,
                    lang === item.key && styles.languageChipTextActive,
                  ]}
                >
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message Preview Box */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:messagePreview")}
          </ThemedText>
          <View style={styles.messageBubble}>
            <ThemedText
              style={[
                styles.messageText,
                lang === "ar" && styles.messageTextArabic,
              ]}
            >
              {messageBody}
            </ThemedText>
          </View>
        </View>

        {/* Channel Selection */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:sendingChannel")}
          </ThemedText>
          <View style={styles.channelsRow}>
            <TouchableOpacity
              style={[
                styles.channelCard,
                channel === "whatsapp" && styles.channelCardActive,
              ]}
              onPress={() => setChannel("whatsapp")}
              activeOpacity={0.8}
            >
              <FontAwesome
                name="whatsapp"
                size={24}
                color={channel === "whatsapp" ? "#25D366" : Colors.light.textSecondary}
              />
              <View style={styles.channelInfo}>
                <ThemedText
                  style={[
                    styles.channelName,
                    channel === "whatsapp" && styles.channelNameActive,
                  ]}
                >
                  WhatsApp
                </ThemedText>
                <ThemedText style={styles.channelDescription}>
                  {t("customers:whatsappRecommended")}
                </ThemedText>
              </View>
              <MaterialIcons
                name={
                  channel === "whatsapp"
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={20}
                color={
                  channel === "whatsapp"
                    ? Colors.light.primary
                    : Colors.light.textSecondary
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.channelCard,
                channel === "sms" && styles.channelCardActive,
              ]}
              onPress={() => setChannel("sms")}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="sms"
                size={24}
                color={
                  channel === "sms"
                    ? Colors.light.primary
                    : Colors.light.textSecondary
                }
              />
              <View style={styles.channelInfo}>
                <ThemedText
                  style={[
                    styles.channelName,
                    channel === "sms" && styles.channelNameActive,
                  ]}
                >
                  SMS Direct
                </ThemedText>
                <ThemedText style={styles.channelDescription}>
                  {t("customers:smsDescription")}
                </ThemedText>
              </View>
              <MaterialIcons
                name={
                  channel === "sms"
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={20}
                color={
                  channel === "sms"
                    ? Colors.light.primary
                    : Colors.light.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.cancelBtnText}>
              {t("common:cancel")}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            {channel === "whatsapp" ? (
              <FontAwesome name="whatsapp" size={20} color="#FFFFFF" />
            ) : (
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            )}
            <ThemedText style={styles.sendBtnText}>
              {channel === "whatsapp"
                ? t("customers:sendViaWhatsApp")
                : t("customers:sendViaSms")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  iconButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxxxx,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: Spacing.md,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  clientTag: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  debtInfo: {
    alignItems: "flex-end",
  },
  debtLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.destructive, // Debt in red
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    marginBottom: Spacing.sm,
  },
  languageRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  languageChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surfaceAlt,
    borderWidth: 1,
    borderColor: "transparent",
  },
  languageChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  languageChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  languageChipTextActive: {
    color: "#FFFFFF",
  },
  messageBubble: {
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.textPrimary,
  },
  messageTextArabic: {
    textAlign: "right",
  },
  channelsRow: {
    gap: Spacing.sm,
  },
  channelCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    backgroundColor: Colors.light.surface,
  },
  channelCardActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  channelInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  channelName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  channelNameActive: {
    color: Colors.light.primary,
  },
  channelDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  sendBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    backgroundColor: "#25D366", // WhatsApp brand green
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
