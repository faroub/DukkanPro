import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/hooks/useOnboarding';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatCurrency } from '@/localization/i18n';
import * as Router from 'expo-router';

/**
 * Onboarding Screen - multi-step onboarding flow for Dukkan OS
 *
 * Steps:
 * 1. Business Name
 * 2. Owner Name
 * 3. Business Type
 * 4. Language Selection
 *
 * Behavior:
 * - French is the default language
 * - Arabic selection does NOT enable RTL
 * - All steps save data locally (SQLite for profile, AsyncStorage for locale/completion)
 * - Completing onboarding navigates to tabs
 * - Screen structure remains LTR in all languages
 */
export function OnboardingScreen({
  navigation,
}: any) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    businessName: '',
    ownerName: '',
    businessType: '',
    locale: 'fr',
    currency: 'DZD',
  } as any);

  // Check if onboarding was already completed on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const isComplete = await useOnboarding.isOnboardingComplete();
      if (isComplete) {
        // Navigate to tabs and unmount this screen
        Router.replace('/(tabs)/');
      }
    };
    checkOnboardingStatus();
  }, [navigation]);

  const steps = [
    'businessName',
    'ownerName',
    'businessType',
    'language',
  ];

  const handleStepChange = (stepData: any) => {
    setProfile((prev) => ({
      ...prev,
      ...stepData,
    }));
    setStep((prev) => prev + 1);
  };

  const handleCompleteOnboarding = async () => {
    // Finalize the profile with the selected locale
    const finalProfile = {
      businessName: profile.businessName,
      ownerName: profile.ownerName,
      businessType: profile.businessType,
      locale: profile.locale,
      currency: 'DZD',
    };

    // Save profile to SQLite and mark onboarding as complete
    await useOnboarding.completeOnboarding(finalProfile);

    // Navigate to tabs
    Router.replace('/(tabs)/');
  };

  // Determine the current step content
  const currentStepContent = steps[step - 1];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          {/* i18n: onboarding.screen */}
          {t('onboarding.screen')}
        </ThemedText>

        <ThemedText type="small" style={styles.headerSubtitle}>
          {/* i18n: onboarding.subtitle */}
          {t('onboarding.subtitle')}
        </ThemedText>
      </ThemedView>

      {/* Progress indicator */}
      <View style={styles.progress}>
        {steps.map((stepKey, index) => (
          <View
            key={stepKey}
            style={[
              styles.progressDot,
              index < step ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          >
            {index + 1}
          </View>
        ))}
      </View>

      {/* Step content */}
      <ThemedView style={styles.stepContainer}>
        {currentStepContent === 'businessName' && (
          <BusinessNameStep
            onContinue={handleStepChange}
            businessName={profile.businessName}
          />
        )}

        {currentStepContent === 'ownerName' && (
          <OwnerNameStep
            onContinue={handleStepChange}
            ownerName={profile.ownerName}
          />
        )}

        {currentStepContent === 'businessType' && (
          <BusinessTypeStep
            onContinue={handleStepChange}
            selectedType={profile.businessType}
          />
        )}

        {currentStepContent === 'language' && (
          <LanguageStep
            onContinue={handleStepChange}
            selectedLocale={profile.locale}
          />
        )}
      </ThemedView>

      {/* Action buttons at the bottom */}
      {step > 1 ? (
        <ThemedView style={styles.actionBar}>
          <PrimaryButton
            title={t('onboarding.skip')}
            size="sm"
            onPress={() => setStep(4)}
          />
        </ThemedView>
      ) : (
        <ThemedView style={styles.actionBar}>
          <PrimaryButton
            title={step < 4 ? t('common.primaryButton') : t('onboarding.getStarted')}
            onPress={step === 4 ? handleCompleteOnboarding : () => handleStepChange({})}
          />
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  content: {
    padding: Spacing.xl,
    width: '100%',
  },
  header: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  progress: {
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
  stepContainer: {
    width: '100%',
    maxWidth: 400,
  },
  actionBar: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.lg,
    gap: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});