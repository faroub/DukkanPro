import { useLocalSearchParams } from 'expo-router';
import ProductDetailScreen from '@/features/products/ProductDetailScreen';

export default function ProductDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const productId = id ? Number(id) : undefined;
  return <ProductDetailScreen productId={productId} />;
}