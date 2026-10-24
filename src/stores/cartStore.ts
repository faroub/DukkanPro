import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '@/types/entities';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  preserveCart: boolean;
  discount: number;

  // Actions
  addItem: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  subtractItem: (productId: number, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setPreserveCart: (value: boolean) => void;
  setDiscount: (value: number) => void;
  addItemWithProduct: (product: Product, quantity: number) => void;

  // Getters
  subtotal: () => number;
  discountAmount: () => number;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      preserveCart: false,
      discount: 0,

      addItem: (productId: number, quantity: number) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === productId);

          if (existingItem) {
            const maxAvailable = Math.max(0, existingItem.product.stock_quantity ?? 0);
            const clampedQty = Math.min(existingItem.quantity + quantity, maxAvailable);
            return {
              items: state.items.map(item =>
                item.product.id === productId
                  ? { ...item, quantity: clampedQty }
                  : item
              ),
            };
          } else {
            return state;
          }
        });
      },

      // Expects a full product object and enforces live stock constraints
      addItemWithProduct: (product: Product, quantity: number) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === product.id);
          const maxAvailable = Math.max(0, product.stock_quantity ?? 0);

          if (existingItem) {
            const desiredQty = existingItem.quantity + quantity;
            const clampedQty = Math.min(desiredQty, maxAvailable);
            if (clampedQty <= 0) return state;

            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: clampedQty }
                  : item
              ),
            };
          } else {
            const initialQty = Math.min(quantity, maxAvailable);
            if (initialQty <= 0) return state;

            return {
              items: [...state.items, { product, quantity: initialQty }],
            };
          }
        });
      },

      removeItem: (productId: number) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId),
        }));
      },

      subtractItem: (productId: number, quantity: number = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === productId);
          if (!existingItem) return state;

          const newQuantity = existingItem.quantity - quantity;
          if (newQuantity <= 0) {
            return {
              items: state.items.filter(item => item.product.id !== productId),
            };
          }

          return {
            items: state.items.map(item =>
              item.product.id === productId
                ? { ...item, quantity: newQuantity }
                : item
            ),
          };
        });
      },

      updateQuantity: (productId: number, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(item => item.product.id !== productId),
            };
          }

          return {
            items: state.items.map(item => {
              if (item.product.id !== productId) return item;
              const maxAvailable = Math.max(0, item.product.stock_quantity ?? 0);
              return { ...item, quantity: Math.min(quantity, maxAvailable) };
            }),
          };
        });
      },

      clearCart: () => {
        set({ items: [], discount: 0 });
      },

      setPreserveCart: (value: boolean) => {
        set({ preserveCart: value });
      },

      setDiscount: (value: number) => {
        set({ discount: value });
      },

      // Getters
      subtotal: () => {
        const state = get();
        return state.items.reduce((sum, item) => {
          return sum + (item.product.sale_price_centimes * item.quantity);
        }, 0);
      },

      discountAmount: () => {
        const state = get();
        return state.discount;
      },

      total: () => {
        const state = get();
        const subtotal = state.subtotal();
        return Math.max(0, subtotal - Number(state.discount || 0));
      },

      itemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'dukkanos-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        preserveCart: state.preserveCart,
        discount: state.discount,
      }),
    }
  )
);

// Helper hook to encapsulate the cart store logic
export function useCartStoreHook() {
  const store = useCartStore();

  return {
    items: store.items,
    addItem: store.addItem,
    addItemWithProduct: store.addItemWithProduct,
    subtractItem: store.subtractItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    preserveCart: store.preserveCart,
    setPreserveCart: store.setPreserveCart,
    discount: store.discountAmount(),
    setDiscount: store.setDiscount,
    subtotal: store.subtotal(),
    total: store.total(),
    itemCount: store.itemCount(),
  };
}
