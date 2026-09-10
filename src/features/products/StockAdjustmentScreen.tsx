import { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export function StockAdjustmentScreen() {
    const { params } = useRoute() as { params: { productId: number; productName: string; currentStock: number } };
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [adjustment, setAdjustment] = useState(0);
    const [mode, setMode] = useState<'set' | 'delta'>('delta');
    const [reason, setReason] = useState<'delivery' | 'count_correction' | 'damaged' | 'return' | 'other'>('delivery');

    const modes = [
      { key: 'set', label: t('products:setNewTotal'), icon: 'arrow-down' },
      { key: 'delta', label: t('products:addRemove'), icon: 'arrow-up' },
    ];

    const reasons = [
      { key: 'delivery', label: t('products:delivery'), icon: 'local_shipping', color: Colors.light.primary },
      { key: 'count_correction', label: t('products:countCorrection'), icon: 'checklist', color: Colors.light.textSecondary },
      { key: 'damaged', label: t('products:damaged'), icon: 'event_busy', color: Colors.light.warning },
      { key: 'return', label: t('products:return'), icon: 'assignment_return', color: Colors.light.error },
      { key: 'other', label: t('products:other'), icon: 'more_horiz', color: Colors.light.textMuted },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <ThemedText style={styles.title}>{t('products:adjustmentTitle')}</ThemedText>
            </View>

            {/* Mode Selector */}
            <ThemedView style={styles.modeSelector}>
              {modes.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.modeButton,
                    mode === m.key && styles.modeButtonActive,
                  ]}
                  onPress={() => setMode(m.key as 'set' | 'delta')}
                  activeOpacity={0.7}
                >
                  <Ionicons name={m.icon as any} size={18} />
                  <ThemedText style={styles.modeButtonText}>{m.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>

            <ThemedView style={styles.card}>
                <ThemedText style={styles.subtitle}>{params.productName}</ThemedText>
                <ThemedText style={styles.caption}>{t('products:currentStock', { stock: params.currentStock })}</ThemedText>
            </ThemedView>

            {/* Diff Badge */}
            <ThemedView style={styles.diffBadgeContainer}>
              <span style={styles.diffBadge}>
                <Ionicons name={(mode === 'set' || adjustment > 0 ? 'arrow-up' : 'arrow-down') as any} size={18} style={styles.diffIcon} />{'+' + Math.abs(adjustment) + ' packs will be ' + (mode === 'set' ? 'added' : 'removed') + ' from inventory'}
              </span>
            </ThemedView>

            {/* Reason Radio Buttons */}
            <ThemedView style={styles.reasonRadios}>
              {reasons.map((r) => (
                <TouchableOpacity key={r.key} style={styles.reasonRadioCard} onPress={() => setReason(r.key as 'delivery' | 'count_correction' | 'damaged' | 'return' | 'other')}><span style={{ color: r.color }}>{r.icon}</span><span style={{ flex: 1, textAlign: 'center' }}>{r.label}</span><input type="radio" name="adjustment_reason" value={r.key} style={{ display: 'none' }} onChange={() => setReason(r.key as 'delivery' | 'count_correction' | 'damaged' | 'return' | 'other')} /></TouchableOpacity>
              ))}
            </ThemedView>

            {/* Optional Note */}
            <ThemedView style={styles.optionalNote}>
              <ThemedText type="small" style={styles.sectionTitle}>{t('products:referenceNote')}</ThemedText>
              <div style={styles.optionalNoteInput}>
                <textarea style={{ width: '100%', padding: 12, borderRadius: 8, backgroundColor: 'white', border: '1px solid #E5E5E5', fontSize: 14, color: '#1A1A1A' }} placeholder={t('products:referenceNotePlaceholder')} rows={2} />
              </div>
            </ThemedView>

            <PrimaryButton title="Confirm" onPress={() => navigation.goBack()} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background, padding: Spacing.lg },
    header: { marginBottom: Spacing.md },
    title: { ...Typography.heading2 },
    card: { padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, ...Shadows.sm },
    subtitle: { ...Typography.heading3 },
    caption: { ...Typography.caption, color: Colors.light.textSecondary },
    sectionTitle: { ...Typography.heading3, marginBottom: Spacing.md },
    modeSelector: {
      marginBottom: Spacing.md,
      padding: Spacing.md,
      backgroundColor: Colors.light.surface,
      borderRadius: BorderRadius.lg,
      ...Shadows.sm,
    },
    modeButton: {
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.light.primary,
      color: '#FFFFFF',
      marginHorizontal: 4,
    },
    modeButtonActive: {
      backgroundColor: Colors.light.primary,
      color: '#FFFFFF',
    },
    modeButtonText: { ...Typography.caption, marginLeft: 4 },
    diffBadgeContainer: {
      marginVertical: Spacing.md,
      alignItems: 'center',
    },
    diffBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.light.warningLight,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      gap: 4,
    },
    diffIcon: { color: Colors.light.warning },
    reasonRadios: {
      marginVertical: Spacing.md,
    },
    reasonRadioCard: {
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: Colors.light.surface,
      marginBottom: Spacing.sm,
    },
    optionalNote: {
      marginVertical: Spacing.md,
    },
    optionalNoteInput: {
      marginTop: Spacing.sm,
      padding: 12,
      backgroundColor: 'white',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.light.border,
    },
});