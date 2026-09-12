import React, { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useNavigation, useRoute, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ProductForm, ProductFormData } from './components/ProductForm';
import { executeRead, executeWrite } from '@/database/database';
import { getById, create, update, archive } from '@/database/repositories/productRepository';
import { Product } from '@/types/entities';
import { Colors } from '@/constants/theme';

export interface ProductFormScreenProps {
  route?: any;
  navigation?: any;
  onClose?: () => void;
  mode?: 'create' | 'edit';
  productId?: number;
}

export function ProductFormScreen({
  route,
  navigation,
  onClose,
  mode: propMode,
  productId: propProductId,
}: ProductFormScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const defaultNavigation = useNavigation();
  const localParams = useLocalSearchParams<{ id?: string }>();
  const routerRoute = useRoute() as { params?: { id?: string } };
  const params = route?.params ?? routerRoute?.params ?? localParams ?? {};
  const currentNavigation = navigation ?? defaultNavigation;

  const productId = propProductId ?? (params?.id ? Number(params.id) : undefined);
  const mode = propMode ?? (productId ? 'edit' : 'create');

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(mode === 'edit');

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, [onClose, router]);

  // Load product if editing
  useEffect(() => {
    if (mode === 'edit' && productId) {
      let isMounted = true;
      (async () => {
        try {
          setIsLoading(true);
          const p = await getById(productId);
          if (isMounted) {
            setProduct(p);
          }
        } catch (err) {
          console.error('Failed to load product:', err);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      })();
      return () => {
        isMounted = false;
      };
    }
  }, [mode, productId]);

  const handleSave = useCallback(
    async (formData: ProductFormData) => {
      if (mode === 'create') {
        await create({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          sale_price_centimes: formData.sale_price_centimes,
          cost_price_centimes: formData.cost_price_centimes,
          stock_quantity: formData.stock_quantity,
          minimum_stock_quantity: formData.minimum_stock_quantity,
          unit: formData.unit,
          is_active: formData.is_active,
        });
      } else if (productId) {
        await update(productId, {
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          sale_price_centimes: formData.sale_price_centimes,
          cost_price_centimes: formData.cost_price_centimes,
          stock_quantity: formData.stock_quantity,
          minimum_stock_quantity: formData.minimum_stock_quantity,
          unit: formData.unit,
          is_active: formData.is_active,
        });
      }
    },
    [mode, productId]
  );

  const handleArchive = useCallback(async () => {
    if (!productId || !product) return;

    const actionText = product.is_active
      ? t('products:archiveProduct')
      : t('products:reactivateProduct');
    const confirmMessage = product.is_active
      ? t('products:archiveConfirm')
      : t('common:confirmDialog');

    Alert.alert(
      actionText,
      confirmMessage,
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: actionText,
          style: product.is_active ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (product.is_active) {
                await archive(productId);
              } else {
                await update(productId, { is_active: true });
              }
              handleClose();
            } catch (err: any) {
              Alert.alert(t('common:error'), err.message);
            }
          },
        },
      ]
    );
  }, [productId, product, t, handleClose]);

  const handleNavigateStockAdjustment = useCallback(() => {
    if (productId) {
      router.push({
        pathname: '/products/stock-adjustment' as any,
        params: { productId: productId.toString() },
      });
    }
  }, [productId, router]);

  if (isLoading) {
    return (
      <ThemedView type="background" style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>{t('common:loading')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ProductForm
      mode={mode}
      productId={productId}
      initialProduct={
        product
          ? {
              name: product.name,
              sku: product.sku,
              category: product.category,
              sale_price_centimes: product.sale_price_centimes,
              cost_price_centimes: product.cost_price_centimes,
              stock_quantity: product.stock_quantity,
              minimum_stock_quantity: product.minimum_stock_quantity,
              unit: product.unit,
              is_active: product.is_active,
            }
          : params?.sku
            ? { sku: params.sku }
            : undefined
      }
      initialValues={
        product
          ? {
              name: product.name,
              sku: product.sku,
              category: product.category,
              sale_price_centimes: product.sale_price_centimes,
              cost_price_centimes: product.cost_price_centimes,
              stock_quantity: product.stock_quantity,
              minimum_stock_quantity: product.minimum_stock_quantity,
              unit: product.unit,
              is_active: product.is_active,
            }
          : params?.sku
            ? { sku: params.sku }
            : undefined
      }
      onSave={handleSave}
      onClose={handleClose}
      onArchive={mode === 'edit' ? handleArchive : undefined}
      onNavigateStockAdjustment={handleNavigateStockAdjustment}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
});
