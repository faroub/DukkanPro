import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SaleDetailScreen } from '@/features/sales/SaleDetailScreen';

export default function SaleDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <SaleDetailScreen params={params} />;
}