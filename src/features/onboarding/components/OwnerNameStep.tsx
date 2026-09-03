import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * Owner name step of the onboarding flow.
 * Merchants enter their name which is required.
 */
export function OwnerNameStep({
  onContinue,
  ownerName,
}: any) {
  const { t } = useTranslation();
  const [name, setName] = useState(ownerName || '');

  const handleContinue = () => {
    if (!name.trim()) {
      return;
    }
    onContinue?.({ ownerName: name });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.contentPadding}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {/* i18n: ownerNameStep.title */}
          {t('ownerNameStep.title')}
        </ThemedText>

        <ThemedText type="small" style={styles.sectionSubtitle}>
          {/* i18n: ownerNameStep.subtitle */}
          {t('ownerNameStep.subtitle')}
        </ThemedText>

        <View style={styles.inputContainer}>
          <ThemedText type="caption" style={styles.inputLabel}>
            {/* i18n: ownerNameStep.label */}
            {t('ownerNameStep.label')}
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder={name || t('ownerNameStep.placeholder')}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            autoCapitalize="words"
          />
        </View>

        <PrimaryButton
          title={t('common.primaryButton')}
          disabled={!name.trim()}
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
  inputContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
    display: 'block',
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
});