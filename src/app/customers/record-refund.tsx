import { useLocalSearchParams } from 'expo-router';
import { RecordRefundScreen } from "@/features/customers/RecordRefundScreen";

export default function RecordRefundRoute() {
  const params = useLocalSearchParams<{
    customerId?: string;
    customerName?: string;
    currentCredit?: string;
  }>();

  const customerId = params.customerId ? Number(params.customerId) : 0;
  const customerName = params.customerName || "";
  const currentCredit = params.currentCredit ? Number(params.currentCredit) : 0;

  return (
    <RecordRefundScreen
      customerId={customerId}
      customerName={customerName}
      currentCredit={currentCredit}
    />
  );
}
