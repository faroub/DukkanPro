import React, { useState } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing, ComponentDimensions, Colors, BorderRadius } from '@/constants/theme';
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
          {['ar', 'fr', 'en'].map((lang) => (
            <TouchableWithoutFeedback
              key={lang}
              style={[
                styles.localeOption,
                locale === lang ? styles.localeOptionSelected : undefined,
              ]}
              onPress={() => setLocale(lang)}
            >
              <ThemedText style={styles.localeText}>
                {t(`languageStep.${lang}`)}
              </ThemedText>
            </TouchableWithoutFeedback>
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
    // Arabic text alignment within LTR layout
    ...(locale === 'ar' ? { textAlign: 'right' } : {}),
  },
  localeOption: {
    width: '32%',
    padding: Spacing.md,
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    // Arabic text right-aligned within option
    ...(locale === 'ar' ? { textAlign: 'right' } : {}),
  },
  localeOptionSelected: {
    width: '32%',
    padding: Spacing.md,
    borderColor: '#1B6B3A',
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceAlt,
  },
  localeText: {
    fontSize: 16,
    // Arabic text alignment
    ...(locale === 'ar' ? { textAlign: 'right' } : {}),
  },
});