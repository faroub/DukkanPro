import { useRouter } from 'expo-router';
import { ProductFormScreen } from '@/features/products/ProductFormScreen';

export default function ProductCreateScreen() {
  const router = useRouter();

  return <ProductFormScreen onClose={() => router.back()} mode="create" />;
}
