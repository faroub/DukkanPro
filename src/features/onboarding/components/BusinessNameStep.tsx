import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing, ComponentDimensions, Colors, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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

  const handleContinue = () => {
    if (!name.trim()) {
      return;
    }
    onContinue?.({ businessName: name });
  };

  // Shop name preview state
  const shopPreview = name.trim() || 'Your Business Name';

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.contentPadding}>
        {/* Progress indicator */}
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
        <View className="relative w-full rounded-xl bg-surface p-3.5 shadow-sm mb-4 overflow-hidden flex items-center gap-3.5">
          <View className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-alt">
            <MaterialSymbolsOutlined name="storefront" size={18} style={{ fontVariationSettings: `'FILL' 1 }} primary}} />
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex items-center gap-1.5">
              <MaterialSymbolsOutlined name="storefront" size={18} style={{ fontVariationSettings: `'FILL' 1 }} primary}} />
              <span className="font-label font-label text-primary truncate" id="shopNamePreview">{shopPreview}</span>
            </View>
          </View>
        </View>

        {/* Main Card Container */}
        <View className="bg-surface rounded-xl p-card-padding shadow-sm mb-6">
          <form className="flex flex-col gap-4" id="onboardingForm">
            {/* Field 1: Business Name */}
            <View className="flex flex-col">
              <Label className="font-label font-label text-primary mb-1.5 flex items-center justify-between" htmlFor="businessName">
                <span>{t('businessNameStep.label')}</span>
                <span className="font-caption font-caption text-secondary">Required</span>
              </Label>
              <View className="relative flex items-center">
                <MaterialSymbolsOutlined name="store" size={20} className="absolute left-3 text-secondary" />
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
            <View className="flex flex-col">
              <Label className="font-label font-label text-primary mb-1.5 flex items-center justify-between" htmlFor="ownerName">
                <span>{t('common.ownerName')}</span>
                <span className="font-caption font-caption text-secondary">Required</span>
              </Label>
              <View className="relative flex items-center">
                <MaterialSymbolsOutlined name="badge" size={20} className="absolute left-3 text-secondary" />
                <TextInput
                  style={styles.input}
                  placeholder={name || t('ownerNameStep.placeholder')}
                  value={name}
                  onChangeText={setName}
                  returnKeyType="done"
                  autoCapitalize="words"
                />
              </View>
            </View>
          </form>
        </View>

        {/* Reassurance / Trust Card */}
        <View className="flex items-center gap-3 p-3 rounded-lg bg-surface-alt text-secondary mb-6 shadow-sm">
          <MaterialSymbolsOutlined name="verified_user" size={18} className="text-primary" />
          <Text className="font-caption font-caption leading-snug">
            Your ledger and customer contacts are kept fully encrypted, offline-capable, and private to your device.
          </Text>
        </View>

        {/* CTA Buttons Container */}
        <View className="flex flex-col gap-3">
          <PrimaryButton
            className="w-full h-12 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label font-label text-base rounded-[10px] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]" id="continueBtn" type="button">
            <span>Continue</span>
            <MaterialSymbolsOutlined name="arrow_forward" size={20} className="text-primary" />
          </PrimaryButton>
          <PrimaryButton
            className="w-full h-10 flex items-center justify-center text-secondary font-label text-caption hover:text-primary transition-colors" onPress={() => history.back()} type="button">
            <MaterialSymbolsOutlined name="west" size={18} className="text-secondary" />
            <span>Back</span>
            <span className="text-secondary text-[12px] font-normal ml-0.5">/ Retour</span>
          </PrimaryButton>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

// Helper components
const Label = ({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor: string;
  className?: string;
}) => <Label htmlFor={htmlFor} className={className}>
  {children}
</Label>

const MaterialSymbolsOutlined = ({
  name,
  size,
  className,
  style,
}: {
  name: string;
  size: number;
  className: string;
  style: React.CSSProperties;
}) => (
  <MaterialSymbolsOutlined name={name} size={size} className={className} style={style} />
);

// Progress indicator styles
const progressStyles = {
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
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
  inputContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
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