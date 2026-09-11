import { View, ScrollView, StyleSheet, Text, Pressable, Modal, Alert, ToastAndroid } from 'react-native';
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRoute } from "expo-router";
import { formatCentimes } from "@/utils/money";
import { Typography, Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

interface PaymentReminderPreviewProps {
  customerId: number;
  customerName: string;
  currentDebt: number;
}

export function PaymentReminderPreview({ customerId, customerName, currentDebt }: PaymentReminderPreviewProps) {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'ar' | 'en'>('fr');
  const [messagePreview, setMessagePreview] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  // Generate message preview based on selected language
  useCallback(() => {
    const amount = formatCentimes(currentDebt);
    switch (selectedLanguage) {
      case 'fr':
        setMessagePreview(
          `Bonjour ${customerName}, votre solde restant est de ${amount} DZD. Merci de régler rapidement.`
        );
        break;
      case 'ar':
        setMessagePreview(
          `مرحباً ${customerName}, رصيدكم المتبقي هو ${amount} دج. من فضلكم سددوا بسرعة.`
        );
        break;
      case 'en':
        setMessagePreview(
          `Hello ${customerName}, your outstanding balance is ${amount} DZD. Please pay promptly.`
        );
        break;
    }
  }, [customerName, currentDebt, selectedLanguage, t]);

  const sendReminder = useCallback(() => {
    setIsSending(true);
    // In a full implementation, this would send via WhatsApp or SMS
    setTimeout(() => {
      ToastAndroid.show(
        t("customers:reminderSent"),
        ToastAndroid.SHORT
      );
      setIsSending(false);
    }, 1000);
  }, [t]);

  // Initial preview generation
  useCallback(() => {
    setMessagePreview("");
  }, []);

  // Generate initial preview
  useEffect(() => {
    setMessagePreview("");
    setTimeout(() => {
      setMessagePreview(
        `Bonjour ${customerName}, votre solde restant est de ${formatCentimes(currentDebt)} DZD. Merci de régler rapidement.`
      );
    }, 100);
  }, [customerName, currentDebt]);

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {t("customers:paymentReminderPreview")}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            {t("customers:forCustomer", { customer: customerName })}
          </ThemedText>
        </View>

        {/* Customer Profile Summary */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <ThemedText type="body" style={styles.avatarInitials}>
              {customerName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.profileDetails}>
            <ThemedText type="body" style={styles.customerName}>
              {customerName}
            </ThemedText>
            <ThemedText type="caption" style={styles.clientId}>
              Client #{customerId}
            </ThemedText>
          </View>
          <View style={styles.debtInfo}>
            <ThemedText type="body" style={styles.debtLabel}>
              {t("customers:currentDebt")}
            </ThemedText>
            <Text style={styles.debtAmount}>
              {formatCentimes(currentDebt)} DZD
            </Text>
          </View>
        </View>

        {/* Language Selector */}
        <View style={styles.languageSelector}>
          <ThemedText type="body" style={styles.languageLabel}>
            {t("customers:selectLanguage")}
          </ThemedText>
          <View style={styles.chipGroup}>
            <Pressable style={[{ ...styles.chip, backgroundColor: selectedLanguage === 'fr' ? Colors.light.primary : Colors.light.surface }]} onPress={() => setSelectedLanguage('fr')}>
              <ThemedText type="body" style={styles.chipText}>
                Français
              </ThemedText>
            </Pressable>
            <Pressable style={[{ ...styles.chip, backgroundColor: selectedLanguage === 'ar' ? Colors.light.primary : Colors.light.surface }]} onPress={() => setSelectedLanguage('ar')}>
              <ThemedText type="body" style={styles.chipText}>
                العربية
              </ThemedText>
            </Pressable>
            <Pressable style={[{ ...styles.chip, backgroundColor: selectedLanguage === 'en' ? Colors.light.primary : Colors.light.surface }]} onPress={() => setSelectedLanguage('en')}>
              <ThemedText type="body" style={styles.chipText}>
                English
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Message Preview */}
        <View style={styles.messagePreviewCard}>
          <ThemedText type="body" style={styles.previewLabel}>
            {t("customers:messagePreview")}
          </ThemedText>
          <View style={styles.messageBox}>
            <ThemedText type="body" style={styles.messageText}>
              {messagePreview}
            </ThemedText>
          </View>
        </View>

        {/* Bilingual Micro Preview */}
        <View style={styles.bilingualPreview}>
          <ThemedText type="caption" style={styles.microLabel}>
            {t("customers:bilingualPreview")}
          </ThemedText>
          <View style={styles.microChips}>
            <ThemedText type="caption" style={styles.microChip}>
              {t("customers:fr")}
            </ThemedText>
            <ThemedText type="caption" style={styles.microChip}>
              {t("customers:ar")}
            </ThemedText>
            <ThemedText type="caption" style={styles.microChip}>
              {t("customers:en")}
            </ThemedText>
          </View>
        </View>

        {/* Channel Selection */}
        <View style={styles.channelSelector}>
          <ThemedText type="body" style={styles.channelLabel}>
            {t("customers:selectChannel")}
          </ThemedText>
          <View style={styles.channelGrid}>
            <Pressable style={[{ ...styles.channelChip, backgroundColor: 'whatsapp' === 'whatsapp' ? Colors.light.primary : Colors.light.surface }]} onPress={() => {}}>
              <ThemedText type="body" style={styles.channelChipText}>
                {t("customers:whatsapp")}
              </ThemedText>
            </Pressable>
            <Pressable style={[{ ...styles.channelChip, backgroundColor: 'sms' === 'sms' ? Colors.light.primary : Colors.light.surface }]} onPress={() => {}}>
              <ThemedText type="body" style={styles.channelChipText}>
                {t("customers:sms")}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionBar}>
          <Pressable style={styles.confirmButton} onPress={sendReminder} disabled={isSending}>
            <ThemedText type="body" style={styles.confirmButtonText}>
              {isSending
                ? t("common:processing")
                : t("customers:sendReminder", { language: selectedLanguage })}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  profileDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  clientId: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  debtInfo: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  debtLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  debtAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.destructive,
  },
  languageSelector: {
    marginBottom: Spacing.lg,
  },
  languageLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  messagePreviewCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  previewLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  messageBox: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  messageText: {
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  bilingualPreview: {
    marginBottom: Spacing.lg,
  },
  microLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  microChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  microChip: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
  },
  channelSelector: {
    marginBottom: Spacing.lg,
  },
  channelLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  channelGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  channelChip: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  actionBar: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  confirmButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    textAlign: 'center',
  },
});