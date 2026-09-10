import { useRouter } from 'expo-router';
import { ProductFormScreen } from '@/features/products/ProductFormScreen';

export default function ProductEditScreen() {
  const router = useRouter();

  return <ProductFormScreen onClose={() => router.back()} mode="edit" />;
}
