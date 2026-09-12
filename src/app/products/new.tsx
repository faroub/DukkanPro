import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProductFormScreen } from '@/features/products/ProductFormScreen';

export default function ProductCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sku?: string }>();

  return (
    <ProductFormScreen
      onClose={() => router.back()}
      mode="create"
      route={{ params }}
    />
  );
}

