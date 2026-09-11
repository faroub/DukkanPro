import { useLocalSearchParams } from 'expo-router';
import { PaymentReminderPreview } from "@/features/customers/PaymentReminderPreview";

export default function PaymentReminderRoute() {
  const params = useLocalSearchParams<{
    customerId?: string;
    customerName?: string;
    currentDebt?: string;
  }>();

  const customerId = params.customerId ? Number(params.customerId) : 0;
  const customerName = params.customerName || "";
  const currentDebt = params.currentDebt ? Number(params.currentDebt) : 0;

  return (
    <PaymentReminderPreview
      customerId={customerId}
      customerName={customerName}
      currentDebt={currentDebt}
    />
  );
}
