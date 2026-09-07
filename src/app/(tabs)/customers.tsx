import { CustomerListScreen } from "@/features/customers/CustomerListScreen";
import { View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export default function CustomersScreen() {
  return (
    <ThemedView type="background" style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {/* i18n: customers.title */}
          Customers
        </ThemedText>

        <ThemedText type="subtitle" style={styles.subtitle}>
          {/* i18n: customers.subtitle */}
          Manage your customers and track debts
        </ThemedText>

        <ThemedText type="small" style={styles.description}>
          {/* i18n: customers.description */}
          Add new customers, view details, and track payment history
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: Spacing.xl,
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
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    textAlign: 'center',
  },
});