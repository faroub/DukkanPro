import { useRoute } from 'expo-router';
import { CustomerFormScreen } from "@/features/customers/CustomerFormScreen";

export default function CustomersEditRoute() {
  const route = useRoute();
  // Access customerId from params - cast to any for expo-router dynamic route
  const customerId = (route.params && (route.params as any).customerId !== undefined)
    ? Number(String((route.params as any).customerId))
    : undefined;
  return <CustomerFormScreen customerId={customerId} />;
}