import React, { useState } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing, ComponentDimensions, Colors, BorderRadius } from '@/constants/theme';
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

  // Business type options matching Stitch design
  const businessTypes = [
    {
      value: 'grocery',
      label: 'grocery',
      name: 'Grocery shop',
      caption: 'Alimentation générale / البقالة',
      bg: Colors.light.primaryLight,
      bgSelected: Colors.light.primary,
      icon: 'storefront',
    },
    {
      value: 'bakery',
      label: 'bakery',
      name: 'Home bakery',
      caption: 'Gâteaux & Pâtisserie maison / حلويات منزلية',
      bg: Colors.light.surface,
      bgSelected: Colors.light.surfaceAlt,
      icon: 'bakery_dining',
    },
    {
      value: 'instagram_seller',
      label: 'instagram seller',
      name: 'Instagram seller',
      caption: 'Vente en ligne & Réseaux / متجر إنستغرام',
      bg: Colors.light.surface,
      bgSelected: Colors.light.surfaceAlt,
      icon: 'photo_camera',
    },
    {
      value: 'market_vendor',
      label: 'market vendor',
      name: 'Market vendor',
      caption: 'Marché & Vendeur ambulant / بائع في السوق',
      bg: Colors.light.surface,
      bgSelected: Colors.light.surfaceAlt,
      icon: 'store',
    },
    {
      value: 'service_seller',
      label: 'service seller',
      name: 'Service seller',
      caption: 'Prestation de services / خدمات',
      bg: Colors.light.surface,
      bgSelected: Colors.light.surfaceAlt,
      icon: 'construction',
    },
    {
      value: 'other',
      label: 'other',
      name: 'Other',
      caption: 'Autre activité / نشاط آخر',
      bg: Colors.light.surface,
      bgSelected: Colors.light.surfaceAlt,
      icon: 'auto_awesome',
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
        <div className="flex items-center justify-between mb-4 mt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-alt">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="font-badge-label font-badge-label text-secondary tracking-wide uppercase">Step 2 of 3</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-1.5 rounded-full bg-primary-container"></div>
            <div className="w-6 h-1.5 rounded-full bg-primary-container"></div>
            <div className="w-6 h-1.5 rounded-full bg-surface-alt"></div>
          </div>
        </div>

        {/* Header Text */}
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="font-headline-1 font-headline-1 text-primary tracking-tight">
            {t('businessTypeStep.title')}
          </h1>
          <p className="font-body font-body text-secondary">Choose the category that best matches your daily activity</p>
        </div>

        {/* Business Type Options */}
        <div ariaLabel="Business Category Selection" className="flex flex-col gap-card-gap" id="category-selector" role="radiogroup">
          {businessTypes.map((type) => (
            <button
              ariaChecked={selectedTypeLocal === type.value}
              className={`business-card group relative w-full text-left p-card-padding rounded-xl transition-all duration-200 shadow-sm flex items-center justify-between bg-${type.bg} shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:bg-surface-bright`}
              role="radio"
              type="button"
              onPress={() => setSelectedTypeLocal(type.value)}
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div className="icon-bubble w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors bg-${type.bgSelected === Colors.light.primary ? 'primary-light' : 'secondary-fixed/50'} text-${type.bgSelected === Colors.light.primary ? 'primary-container' : 'secondary'}">
                  <span className="material-symbols-outlined text-[24px]">{type.icon}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label font-label text-primary truncate">{type.name}</span>
                  <span className="font-caption font-caption text-secondary truncate mt-0.5" dir="auto">{type.caption}</span>
                </div>
              </div>
              <div className="check-pill shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all bg-${selectedTypeLocal === type.value ? 'primary-container' : 'surface-alt'} text-${selectedTypeLocal === type.value ? 'surface' : 'transparent'}">
                <span className="material-symbols-outlined text-[18px] font-bold">check</span>
              </div>
            </button>
          ))}
        </div>

        {/* Micro-delight helper message */}
        <div className="mt-4 px-3 py-2.5 rounded-lg bg-surface-container-low flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-primary-container shrink-0">info</span>
          <p className="font-caption font-caption text-secondary">
            You can change your category or add custom products anytime in Settings.
          </p>
        </div>

        {/* Bottom Fixed-style Actions Slot */}
        <div className="flex flex-col gap-3 mt-6 pt-2">
          <button className="w-full h-12 rounded-[10px] bg-primary-container text-on-primary font-label font-label flex items-center justify-center gap-2 shadow-md hover:bg-primary-dark active:scale-[0.99] transition-all cursor-pointer" id="btn-continue" type="button">
            <span>Continue</span>
            <span className="material-symbols-outlined text-[20px] arrow_forward">/span>
          </button>
          <button className="w-full h-10 flex items-center justify-center text-secondary font-label text-label hover:text-primary transition-colors cursor-pointer" onclick="history.back()" type="button">
            Back
          </button>
        </div>
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