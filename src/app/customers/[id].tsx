import { useRoute } from 'expo-router';
import { CustomerDetailScreen } from "@/features/customers/CustomerDetailScreen";

export default function CustomersDetailRoute() {
  const route = useRoute();
  // Access customerId from params - cast to any for expo-router dynamic route
  const customerId = (route.params && (route.params as any).customerId !== undefined)
    ? Number(String((route.params as any).customerId))
    : undefined;
  return <CustomerDetailScreen customerId={customerId} />;
}