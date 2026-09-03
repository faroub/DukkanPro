import { View, Text, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export default function CustomersScreen() {
  return (
    <ThemedView type="background" style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {/* i18n: customers.title */}
          Clients & Crédit
        </ThemedText>

        <ThemedText type="subtitle" style={styles.subtitle}>
          {/* i18n: customers.subtitle */}
          Suivez la créance client et l'historique
        </ThemedText>

        <ThemedText type="small" style={styles.description}>
          {/* i18n: customers.description */}
          Visualisez les soldes impayés et l'historique des transactions.
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