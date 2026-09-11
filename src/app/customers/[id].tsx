import { useLocalSearchParams } from 'expo-router';
import { CustomerDetailScreen } from "@/features/customers/CustomerDetailScreen";

export default function CustomersDetailRoute() {
  const { id, customerId } = useLocalSearchParams<{ id?: string; customerId?: string }>();
  const resolvedId = customerId ? Number(customerId) : id ? Number(id) : undefined;
  return <CustomerDetailScreen customerId={resolvedId} />;
}