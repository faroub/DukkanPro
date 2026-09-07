import React, { useState } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Simple SVG icons for Material Symbols
const SvgIcon = ({
  name,
  size,
}: {
  name: 'storefront' | 'check' | 'info' | 'arrow_forward';
  size: number;
}) => {
  const svgData: Record<string, string> = {
    storefront: '<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24"><path fill="currentColor" d="M10 20V2h4v18l-4-3h-2l-4 3h-2zM3 9v6h18"/><path fill="none" d="M0 0h24v24H0z"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24"><path fill="currentColor" d="M9 18l6-6-6-6M2 12l10 10-10 10z"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.354 8.647-2.646 2.646-5.293-1.414L15 15.069l-2.647-5.303-1.414 2.646L9.75 9.75l-5.293 1.414 1.414 5.293L5 15.069l 5.293-1.414 2.647 5.303z"/></svg>',
    arrow_forward: '<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24"><path fill="currentColor" d="M10 18l6-6-6-6M2 12l10 10-10 10z"/></svg>',
  };

  const path = svgData[name] || '';
  return <svg dangerouslySetInnerHTML={{ __html: path.replace(/\{size\}/g, size.toString()) }} />;
};

export function BusinessTypeStep({
  onContinue,
  selectedType,
}: any) {
  const { t } = useTranslation();
  const [selectedTypeLocal, setSelectedTypeLocal] = useState(selectedType || 'grocery');

  // Business type options matching Stitch design
  const businessTypes = [
    {
      value: 'grocery',
      name: 'Grocery shop',
      caption: 'Alimentation générale / البقالة',
    },
    {
      value: 'bakery',
      name: 'Home bakery',
      caption: 'Gâteaux & Pâtisserie maison / حلويات منزلية',
    },
    {
      value: 'instagram_seller',
      name: 'Instagram seller',
      caption: 'Vente en ligne & Réseaux / متجر إنستغرام',
    },
    {
      value: 'market_vendor',
      name: 'Market vendor',
      caption: 'Marché & Vendeur ambulant / بائع في السوق',
    },
    {
      value: 'service_seller',
      name: 'Service seller',
      caption: 'Prestation de services / خدمات',
    },
    {
      value: 'other',
      name: 'Other',
      caption: 'Autre actividad / actividad diferente',
    },
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
        {/* Step indicator & Progress */}
        <View style={styles.progress}>
          <View style={styles.progressDotActive as any} />
          <View style={styles.progressDotInactive} />
          <View style={styles.progressDotInactive} />
        </View>

        <View style={styles.stepIndicator}>
          <View style={styles.stepDotActive} />
          <Text style={styles.stepLabel}>Step 2 of 3</Text>
        </View>

        {/* Header Text */}
        <View style={styles.header}>
          <ThemedText type="heading" style={styles.title}>
            {t('businessTypeStep.title')}
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Choose the category that best matches your daily activity
          </ThemedText>
        </View>

        {/* Business Type Options */}
        <View style={styles.optionsContainer} aria-label="Business Category Selection" role="radiogroup">
          {businessTypes.map((type, index) => (
            <TouchableWithoutFeedback
              key={type.value}
              style={styles.optionCard}
              role="radio"
              onPress={() => setSelectedTypeLocal(type.value)}
            >
              <View style={styles.iconBubble}>
                <SvgIcon name="storefront" size={24} />
              </View>
              <View style={styles.optionText}>
                <span style={styles.optionName}>{type.name}</span>
                <span style={styles.optionCaption} dir="auto">
                  {type.caption}
                </span>
              </View>
              <View style={styles.checkPill}>
                <SvgIcon name="check" size={18} />
              </View>
            </TouchableWithoutFeedback>
          ))}
        </View>

        {/* Micro-delight helper message */}
        <View style={styles.microDelight}>
          <SvgIcon name="info" size={18} />
          <Text style={styles.microDelightText}>
            You can change your category or add custom products anytime in Settings.
          </Text>
        </View>

        {/* Bottom Fixed-style Actions Slot */}
        <View style={styles.ctaContainer}>
          <PrimaryButton
            style={styles.continueBtn}
            onPress={handleContinue}
            title="Continue">
            <span>Continue</span>
            <SvgIcon name="arrow_forward" size={20} />
          </PrimaryButton>
          <PrimaryButton
            style={styles.backBtn}
            onPress={() => {}}
            title="Back">
            Back
          </PrimaryButton>
        </View>
      </ThemedView>
    </ThemedView>
  );
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
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  progressDotActive: {
    width: 32,
    height: 4,
    backgroundColor: '#1B6B3A',
    borderRadius: 2,
    marginHorizontal: 4,
  },
  progressDotInactive: {
    width: 32,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginHorizontal: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  stepDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1B6B3A',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  header: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  optionCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionText: {
    flexDirection: 'column',
    gap: 2,
  },
  optionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  optionCaption: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  microDelight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#F8F7F4',
    borderRadius: 12,
  },
  microDelightText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ctaContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  continueBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1B6B3A',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: 'transparent',
    color: '#6B7280',
    fontSize: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});