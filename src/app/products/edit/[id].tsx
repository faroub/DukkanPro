import { useRoute, useNavigation } from 'expo-router';
import { ProductFormScreen } from '@/features/products/ProductFormScreen';

export default function ProductEditScreen() {
  const { params } = useRoute() as { params: { id: string } };
  const navigation = useNavigation();

  // Handle form save - navigate back on success
  const handleSave = () => {
    navigation?.goBack();
  };

  // Handle stock adjustment
  const handleStockAdjustment = () => {
    (navigation?.navigate as any)('stock-adjustment', { productId: params?.id });
  };

  return <ProductFormScreen onClose={() => navigation?.goBack()} mode="edit" />;
}