import { CustomerListScreen } from "@/features/customers/CustomerListScreen";
import { View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

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
    backgroundColor: '#F8F7F4',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
  },
});