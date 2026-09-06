import { SaleDetailScreen } from '@/features/sales/SaleDetailScreen';
import type { ReactNode } from 'react';

export default function SaleDetailRoute({ route }: { route: { params: { id: string } } }) {
  return <SaleDetailScreen params={route.params} />;
}