import { View, Text, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export default function SellScreen() {
  return (
    <ThemedView type="background" style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {/* i18n: sell.title */}
          Enregistrer une vente
        </ThemedText>

        <ThemedText type="subtitle" style={styles.subtitle}>
          {/* i18n: sell.subtitle */}
          Nouvelle vente cash ou crédit
        </ThemedText>

        <ThemedText type="small" style={styles.description}>
          {/* i18n: sell.description */}
          Sélectionnez les produits et le mode de paiement.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
    padding: Spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
  },
});