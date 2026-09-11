import { useLocalSearchParams } from 'expo-router';
import { RecordPaymentScreen } from "@/features/customers/RecordPaymentScreen";

export default function RecordPaymentRoute() {
  const params = useLocalSearchParams<{
    customerId?: string;
    customerName?: string;
    currentDebt?: string;
  }>();

  const customerId = params.customerId ? Number(params.customerId) : 0;
  const customerName = params.customerName || "";
  const currentDebt = params.currentDebt ? Number(params.currentDebt) : 0;

  return (
    <RecordPaymentScreen
      customerId={customerId}
      customerName={customerName}
      currentDebt={currentDebt}
    />
  );
}
