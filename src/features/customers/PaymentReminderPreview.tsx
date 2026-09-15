import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatCentimes } from "@/utils/money";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [lang, setLang] = useState<"fr" | "ar" | "en">(
    i18n.language.startsWith("ar")
      ? "ar"
      : i18n.language.startsWith("en")
        ? "en"
        : "fr",
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

    let formattedPhone = (customerPhone || "")
      .replace(/\s+/g, "")
      .replace(/[^0-9]/g, "");
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
          t("customers:whatsappNotInstalled") || "WhatsApp is not installed.",
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
          t("customers:smsNotSupported") ||
            "SMS is not supported on this device.",
        );
      }
    }
  }, [channel, messageBody, customerPhone, t]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t("common:back")}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <ThemedText style={styles.headerTitle}>
            {t("customers:shareReminder")}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
            {customerName}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile / Balance Summary Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {customerName ? customerName.slice(0, 2).toUpperCase() : "CU"}
              </ThemedText>
            </View>
            <View>
              <ThemedText style={styles.customerName}>
                {customerName}
              </ThemedText>
              <ThemedText style={styles.clientTag}>
                {customerPhone || t("customers:customer")}
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

        {/* Message Language Selection */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>
            {t("customers:messageLanguage")}
          </ThemedText>

          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[
                styles.languageChip,
                lang === "fr" && styles.languageChipActive,
              ]}
              onPress={() => setLang("fr")}
            >
              <ThemedText
                style={[
                  styles.languageChipText,
                  lang === "fr" && styles.languageChipTextActive,
                ]}
              >
                Français
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageChip,
                lang === "ar" && styles.languageChipActive,
              ]}
              onPress={() => setLang("ar")}
            >
              <ThemedText
                style={[
                  styles.languageChipText,
                  lang === "ar" && styles.languageChipTextActive,
                ]}
              >
                العربية
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageChip,
                lang === "en" && styles.languageChipActive,
              ]}
              onPress={() => setLang("en")}
            >
              <ThemedText
                style={[
                  styles.languageChipText,
                  lang === "en" && styles.languageChipTextActive,
                ]}
              >
                English
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Preview */}
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
            {t("customers:sendChannel")}
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
                size={22}
                color={channel === "whatsapp" ? "#25D366" : theme.textSecondary}
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
                  channel === "whatsapp" ? theme.primary : theme.textSecondary
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
                name="textsms"
                size={22}
                color={channel === "sms" ? theme.primary : theme.textSecondary}
              />
              <View style={styles.channelInfo}>
                <ThemedText
                  style={[
                    styles.channelName,
                    channel === "sms" && styles.channelNameActive,
                  ]}
                >
                  SMS
                </ThemedText>
                <ThemedText style={styles.channelDescription}>
                  {t("customers:standardSms")}
                </ThemedText>
              </View>
              <MaterialIcons
                name={
                  channel === "sms"
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={20}
                color={channel === "sms" ? theme.primary : theme.textSecondary}
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

          <TouchableOpacity
            style={[
              styles.sendBtn,
              channel === "whatsapp"
                ? styles.sendBtnWhatsapp
                : styles.sendBtnSms,
            ]}
            onPress={handleSend}
          >
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

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    iconButton: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
    },
    headerInfo: {
      flex: 1,
      marginHorizontal: Spacing.sm,
    },
    headerTitle: {
      ...Typography.heading3,
      color: theme.textPrimary,
    },
    headerSubtitle: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginTop: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: 48,
      maxWidth: 600,
      alignSelf: "center",
      width: "100%",
    },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.surface,
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    profileLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.primary,
    },
    customerName: {
      ...Typography.label,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    clientTag: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginTop: 2,
    },
    debtInfo: {
      alignItems: "flex-end",
    },
    debtLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    debtAmount: {
      ...Typography.heading3,
      color: theme.error,
      marginTop: 2,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    sectionTitle: {
      ...Typography.caption,
      fontWeight: "700",
      color: theme.textPrimary,
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
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: "transparent",
    },
    languageChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    languageChipText: {
      ...Typography.caption,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    languageChipTextActive: {
      color: "#FFFFFF",
    },
    messageBubble: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    messageText: {
      ...Typography.body,
      lineHeight: 22,
      color: theme.textPrimary,
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
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    channelCardActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    channelInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    channelName: {
      ...Typography.label,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    channelNameActive: {
      color: theme.primary,
    },
    channelDescription: {
      ...Typography.caption,
      color: theme.textSecondary,
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
      borderRadius: BorderRadius.xl,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelBtnText: {
      ...Typography.label,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    sendBtn: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: BorderRadius.xl,
      ...Shadows.sm,
    },
    sendBtnWhatsapp: {
      backgroundColor: "#25D366",
    },
    sendBtnSms: {
      backgroundColor: theme.primary,
    },
    sendBtnText: {
      ...Typography.label,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
