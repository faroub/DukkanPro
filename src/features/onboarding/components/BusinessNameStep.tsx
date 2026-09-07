import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// MaterialSymbolsOutlined is available via expo-google-fonts
// Import from the component path that's configured in the project
import MaterialSymbolsOutlined from '@/components/MaterialSymbolsOutlined';

/**
 * Business/shop name step of the onboarding flow.
 * Merchants enter their shop name which is required.
 */
export function BusinessNameStep({
  onContinue,
  businessName,
}: any) {
  const { t } = useTranslation();
  const [name, setName] = useState(businessName || '');
  const [ownerName, setOwnerName] = useState('');
  const shopPreview = name.trim() || 'Your Business Name';

  const handleContinue = () => {
    if (!name.trim()) {
      return;
    }
    onContinue?.({ businessName: name });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.contentPadding}>
        {/* Progress indicator: Step 1 of 3 */}
        <View style={styles.progress}>
          <View style={styles.progressDotActive} />
          <View style={styles.progressDotInactive} />
          <View style={styles.progressDotInactive} />
        </View>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {/* i18n: businessNameStep.title */}
          {t('businessNameStep.title')}
        </ThemedText>

        <ThemedText type="small" style={styles.sectionSubtitle}>
          {/* i18n: businessNameStep.subtitle */}
          {t('businessNameStep.subtitle')}
        </ThemedText>

        {/* Engaging Visual Accent Tile */}
        <View style={styles.accentTile}>
          <View style={styles.accentIcon}>
            <MaterialSymbolsOutlined name="storefront" size={18} className="primary-icon" />
          </View>
          <View style={styles.accentText}>
            <span className="font-label font-label text-primary truncate" id="shopNamePreview">{shopPreview}</span>
          </View>
        </View>

        {/* Main Card Container */}
        <View style={styles.mainCard}>
          <form style={styles.form} id="onboardingForm">
            {/* Field 1: Business Name */}
            <View style={styles.field}>
              <Label htmlFor="businessName">
                <span>{t('businessNameStep.label')}</span>
                <span className="font-caption font-caption text-secondary">Required</span>
              </Label>
              <View style={styles.inputContainer}>
                <MaterialSymbolsOutlined name="store" size={20} className="absolute left-3 secondary-icon" />
                <TextInput
                  style={styles.input}
                  placeholder={name || t('businessNameStep.placeholder')}
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Field 2: Owner Name */}
            <View style={styles.field}>
              <Label htmlFor="ownerName">
                <span>{t('common.ownerName')}</span>
                <span className="font-caption font-caption text-secondary">Required</span>
              </Label>
              <View style={styles.inputContainer}>
                <MaterialSymbolsOutlined name="badge" size={20} className="absolute left-3 secondary-icon" />
                <TextInput
                  style={styles.input}
                  placeholder={ownerName || t('ownerNameStep.placeholder')}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  returnKeyType="done"
                  autoCapitalize="words"
                />
              </View>
            </View>
          </form>
        </View>

        {/* Reassurance / Trust Card */}
        <View style={styles.trustCard}>
          <MaterialSymbolsOutlined name="verified_user" size={18} className="primary-icon" />
          <Text style={styles.trustText}>
            Your ledger and customer contacts are kept fully encrypted, offline-capable, and private to your device.
          </Text>
        </View>

        {/* CTA Buttons Container */}
        <View style={styles.ctaContainer}>
          <PrimaryButton
            onPress={handleContinue}
            title="Continue"
            startIcon={<MaterialSymbolsOutlined name="arrow_forward" size={20} className="primary-icon" />}
            type="button">
            <span>Continue</span>
          </PrimaryButton>
          <PrimaryButton
            onPress={() => {}}
            title="Back"
            startIcon={<MaterialSymbolsOutlined name="west" size={18} className="secondary-icon" />}
            type="button">
            <span>Back</span>
            <span className="text-secondary text-[12px] font-normal ml-0.5">/ Retour</span>
          </PrimaryButton>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

// Helper Label component - accepts htmlFor and children only
const Label = ({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) => (
  <span htmlFor={htmlFor}>
    {children}
  </span>
);

// Progress indicator styles - flat style objects
const progressStyles = {
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#1B6B3A',
  },
  progressDotInactive: {
    backgroundColor: '#CCCCCC',
  },
};

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
  accentTile: {
    position: 'relative',
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  accentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0EFEA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentText: {
    flex: 1,
  },
  mainCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  form: {
    width: '100%',
    padding: 24,
  },
  field: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 12,
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 48,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  trustCard: {
    backgroundColor: '#F0EFEA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  trustText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ctaContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: Spacing.lg,
  },
});