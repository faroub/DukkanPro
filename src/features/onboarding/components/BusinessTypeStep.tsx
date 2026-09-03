import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * Business type selection step of the onboarding flow.
 * Merchant selects their business type from predefined options.
 */
export function BusinessTypeStep({
  onContinue,
  selectedType,
}: any) {
  const { t } = useTranslation();
  const [selectedTypeLocal, setSelectedTypeLocal] = useState(selectedType);

  // Business type options
  const businessTypes = [
    { value: 'grocery', label: 'grocery' },
    { value: 'bakery', label: 'bakery' },
    { value: 'instagram_seller', label: 'instagram seller' },
    { value: 'market_vendor', label: 'market vendor' },
    { value: 'service_seller', label: 'service seller' },
    { value: 'other', label: 'other' },
  ];

  const handleContinue = () => {
    if (!selectedTypeLocal) {
      return;
    }
    onContinue?.({ businessType: selectedTypeLocal });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.contentPadding}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {/* i18n: businessTypeStep.title */}
          {t('businessTypeStep.title')}
        </ThemedText>

        <ThemedText type="small" style={styles.sectionSubtitle}>
          {/* i18n: businessTypeStep.subtitle */}
          {t('businessTypeStep.subtitle')}
        </ThemedText>

        <View style={styles.typeContainer}>
          {businessTypes.map((type) => (
            <TouchableWithoutFeedback
              key={type.value}
              style={styles.typeOption}
              onPress={() => setSelectedTypeLocal(type.value)}
            >
              <ThemedText
                style={[
                  styles.typeText,
                  selectedTypeLocal === type.value ? styles.typeTextSelected : undefined,
                ]}
              >
                {t(`businessTypeStep.${type.label}`)}
              </ThemedText>
            </TouchableWithoutFeedback>
          ))}
        </View>

        <PrimaryButton
          title={t('common.primaryButton')}
          disabled={!selectedTypeLocal}
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
  typeContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  typeOption: {
    padding: Spacing.md,
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 16,
    textAlign: 'center',
  },
  typeTextSelected: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1B6B3A',
  },
});