import { useState } from 'react';
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

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <ThemedText style={styles.title}>{t('products:adjustmentTitle')}</ThemedText>
            </View>
            
            <ThemedView style={styles.card}>
                <ThemedText style={styles.subtitle}>{params.productName}</ThemedText>
                <ThemedText style={styles.caption}>{t('products:currentStock', { stock: params.currentStock })}</ThemedText>
            </ThemedView>

            <ThemedView style={styles.card}>
                <ThemedText style={styles.sectionTitle}>{t('products:adjustmentQuantity')}</ThemedText>
                <View style={styles.quantityControls}>
                    <TouchableOpacity onPress={() => setAdjustment(prev => prev - 1)} style={styles.button}><Ionicons name="remove" size={24} /></TouchableOpacity>
                    <ThemedText style={styles.quantity}>{adjustment}</ThemedText>
                    <TouchableOpacity onPress={() => setAdjustment(prev => prev + 1)} style={styles.button}><Ionicons name="add" size={24} /></TouchableOpacity>
                </View>
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
    quantityControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    quantity: { ...Typography.heading2 },
    button: { padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.light.backgroundElement },
});