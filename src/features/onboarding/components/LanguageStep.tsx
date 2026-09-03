import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * Language selection step of the onboarding flow.
 * Merchant selects: العربية | Français | English
 * Arabic language selection does NOT enable RTL - layout remains LTR
 */
export function LanguageStep({
  onContinue,
  selectedLocale,
}: any) {
  const { t } = useTranslation();

  const [locale, setLocale] = useState(selectedLocale || 'fr');

  const handleContinue = () => {
    if (!['ar', 'fr', 'en'].includes(locale)) {
      return;
    }
    onContinue?.({ locale });
  };

  // Language options with display names
  const locales = [
    { value: 'ar', label: 'ar' },
    { value: 'fr', label: 'fr' },
    { value: 'en', label: 'en' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.contentPadding}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {/* i18n: languageStep.title */}
          {t('languageStep.title')}
        </ThemedText>

        <ThemedText type="small" style={styles.sectionSubtitle}>
          {/* i18n: languageStep.subtitle */}
          {t('languageStep.subtitle')}
        </ThemedText>

        <ThemedText type="small" style={styles.languageNote}>
          {/* i18n: languageStep.note */}
          {/* Note: Arabic text direction stays LTR - no global RTL */}
        </ThemedText>

        <View style={styles.localeContainer}>
          {locales.map((localeOpt) => (
            <TouchableWithoutFeedback
              key={localeOpt.value}
              style={[
                styles.localeOption,
                locale === localeOpt.value ? styles.localeOptionSelected : undefined,
              ]}
              onPress={() => setLocale(localeOpt.value)}
            >
              <ThemedText style={styles.localeText}>
                {localeOpt.label === 'ar' ? (
                  <ThemedText type="small">{t(`languageStep.${localeOpt.value}`)}</ThemedText>
                ) : (
                  <ThemedText>{t(`languageStep.${localeOpt.value}`)}</ThemedText>
                )}
              </ThemedText>
            </View>
          ))}
        </View>

        <PrimaryButton
          title={t('common.primaryButton')}
          disabled={!['ar', 'fr', 'en'].includes(locale)}
          onPress={handleContinue}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: 'white',
  },
  contentPadding: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  languageNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: Spacing.lg,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  localeContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'center',
  },
  localeOption: {
    width: '50%',
    padding: Spacing.md,
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localeOptionSelected: {
    width: '50%',
    padding: Spacing.md,
    borderColor: '#1B6B3A',
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  localeText: {
    fontSize: 18,
    textAlign: 'center',
  },
});