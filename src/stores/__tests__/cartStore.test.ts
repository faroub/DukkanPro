import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCartStore } from '../cartStore';
import type { Product } from '@/types/entities';

const mockProduct: Product = {
  id: 1,
  name: 'Test Milk',
  category: 'Dairy',
  cost_price_centimes: 10000,
  sale_price_centimes: 12000,
  stock_quantity: 50,
  min_stock_alert: 5,
  unit: 'piece',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  is_active: 1,
};

describe('cartStore with AsyncStorage persistence', () => {
  beforeEach(async () => {
    useCartStore.getState().clearCart();
    useCartStore.getState().setDiscount(0);
    useCartStore.getState().setPreserveCart(false);
    await AsyncStorage.clear();
  });

  it('adds item to cart and calculates subtotal and total', () => {
    useCartStore.getState().addItemWithProduct(mockProduct, 2);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].product.name).toBe('Test Milk');
    expect(state.items[0].quantity).toBe(2);
    expect(state.itemCount()).toBe(2);
    expect(state.subtotal()).toBe(24000);
    expect(state.total()).toBe(24000);
  });

  it('applies discount correctly', () => {
    useCartStore.getState().addItemWithProduct(mockProduct, 1);
    useCartStore.getState().setDiscount(2000);

    const state = useCartStore.getState();
    expect(state.subtotal()).toBe(12000);
    expect(state.discountAmount()).toBe(2000);
    expect(state.total()).toBe(10000);
  });

  it('updates quantity and removes item when quantity reaches zero', () => {
    useCartStore.getState().addItemWithProduct(mockProduct, 3);
    useCartStore.getState().updateQuantity(1, 1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    useCartStore.getState().updateQuantity(1, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('persists cart state to AsyncStorage', async () => {
    useCartStore.getState().addItemWithProduct(mockProduct, 2);
    useCartStore.getState().setPreserveCart(true);

    // Allow Zustand persist async write to finish
    await new Promise((r) => setTimeout(r, 100));

    const storedData = await AsyncStorage.getItem('dukkanos-cart-storage');
    expect(storedData).toBeTruthy();
    const parsed = JSON.parse(storedData!);
    expect(parsed.state.items).toHaveLength(1);
    expect(parsed.state.items[0].product.id).toBe(1);
    expect(parsed.state.preserveCart).toBe(true);
  });
});
