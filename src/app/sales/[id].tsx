import { SaleDetailScreen } from '@/features/sales/SaleDetailScreen';
import { useRoute } from 'expo-router';

export default function SaleDetailRoute() {
  const route = useRoute();
  // @ts-ignore - expo-router route typing
  return <SaleDetailScreen params={route.params} />;
}