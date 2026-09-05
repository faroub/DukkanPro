import { useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ProductFormScreen } from '@/features/products/ProductFormScreen';

export default function ProductCreateScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return <ProductFormScreen onClose={() => navigation?.goBack()} mode="create" />;
}