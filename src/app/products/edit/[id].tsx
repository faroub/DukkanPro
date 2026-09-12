import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProductFormScreen } from '@/features/products/ProductFormScreen';

export default function ProductEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const productId = id ? Number(id) : undefined;

  return (
    <ProductFormScreen
      onClose={() => router.back()}
      mode="edit"
      productId={productId}
      route={{ params: { id } }}
    />
  );
}
