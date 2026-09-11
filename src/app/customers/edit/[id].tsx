import { useLocalSearchParams } from 'expo-router';
import { CustomerFormScreen } from "@/features/customers/CustomerFormScreen";

export default function CustomersEditRoute() {
  const { id, customerId } = useLocalSearchParams<{ id?: string; customerId?: string }>();
  const resolvedId = customerId ? Number(customerId) : id ? Number(id) : undefined;
  return <CustomerFormScreen customerId={resolvedId} />;
}