import React, { useState } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing, Colors, BorderRadius } from '@/constants/theme';
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
      caption: 'Autre activité / actividad diferente',
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
          <View style={styles.progressDotActive} />
          <View style={styles.progressDotInactive} />
          <View style={styles.progressDotInactive} />
        </View>

        <View style={styles.stepIndicator}>
          <View style={styles.stepDotActive} />
          <Text style={styles.stepLabel}>Step 2 of 3</Text>
        </View>

        {/* Header Text */}
        <View style={styles.header}>
          <ThemedText type="headline-1" style={styles.title}>
            {t('businessTypeStep.title')}
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Choose the category that best matches your daily activity
          </ThemedText>
        </View>

        {/* Business Type Options */}
        <View style={styles.optionsContainer} ariaLabel="Business Category Selection" role="radiogroup">
          {businessTypes.map((type, index) => (
            <View
              key={type.value}
              style={styles.optionCard}
              role="radio"
              onPress={() => setSelectedTypeLocal(type.value)}
            >
              <View style={styles.iconBubble}>
                <MaterialSymbolsOutlined
                  name="storefront"
                  size={24}
                />
              </View>
              <View style={styles.optionText}>
                <span style={styles.optionName}>{type.name}</span>
                <span style={styles.optionCaption} dir="auto">
                  {type.caption}
                </span>
              </View>
              <View style={styles.checkPill}>
                <MaterialSymbolsOutlined
                  name="check"
                  size={18}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Micro-delight helper message */}
        <View style={styles.microDelight}>
          <MaterialSymbolsOutlined
            name="info"
            size={18}
          />
          <Text style={styles.microDelightText}>
            You can change your category or add custom products anytime in Settings.
          </Text>
        </View>

        {/* Bottom Fixed-style Actions Slot */}
        <View style={styles.ctaContainer}>
          <PrimaryButton
            style={styles.continueBtn}
            onPress={handleContinue}
            type="button">
            <span>Continue</span>
            <MaterialSymbolsOutlined name="arrow_forward" size={20} className="primary-icon" />
          </PrimaryButton>
          <PrimaryButton
            style={styles.backBtn}
            onPress={() => {}}
            type="button">
            Back
          </PrimaryButton>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

// Simple style objects without function type annotations
const progressDotActiveStyle = {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: '#1B6B3A',
};

const progressDotInactiveStyle = {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: '#CCCCCC',
};

const stepDotActiveStyle = {
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: '#1B6B3A',
};

const stepLabelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B7280',
  textTransform: 'uppercase',
};

const titleStyle = {
  fontSize: 22,
  fontWeight: 600,
  color: '#1A1A1A',
  marginBottom: 4,
  textAlign: 'center',
};

const subtitleStyle = {
  fontSize: 14,
  color: '#6B7280',
  textAlign: 'center',
};

const optionCardStyle = {
  width: '100%',
  borderRadius: 16,
  padding: 20,
  backgroundColor: '#FFFFFF',
  marginBottom: 12,
};

const iconBubbleStyle = {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#F8F7F4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 12,
};

const checkPillStyle = {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: '#F0EFEA',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const microDelightStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 24,
  padding: 12,
  backgroundColor: '#F8F7F4',
  borderRadius: 12,
};

const microDelightTextStyle = {
  fontSize: 12,
  color: '#6B7280',
};

const ctaContainerStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  paddingHorizontal: 32,
  paddingBottom: 48,
};

const continueBtnStyle = {
  height: 48,
  borderRadius: 12,
  backgroundColor: '#1B6B3A',
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const backBtnStyle = {
  height: 40,
  borderRadius: 10,
  backgroundColor: 'transparent',
  color: '#6B7280',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
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
  progressDotActive: progressDotActiveStyle,
  progressDotInactive: progressDotInactiveStyle,
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  stepDotActive: stepDotActiveStyle,
  stepLabel: stepLabelStyle,
  header: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  title: titleStyle,
  subtitle: subtitleStyle,
  optionsContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  optionCard: optionCardStyle,
  iconBubble: iconBubbleStyle,
  optionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  optionName: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1A1A1A',
  },
  optionCaption: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkPill: checkPillStyle,
  microDelight: microDelightStyle,
  microDelightText: microDelightTextStyle,
  ctaContainer: ctaContainerStyle,
  continueBtn: continueBtnStyle,
  backBtn: backBtnStyle,
});