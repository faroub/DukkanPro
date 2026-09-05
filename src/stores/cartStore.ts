import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
          // Check if product already in cart
          const existingItem = state.items.find(item => item.product.id === productId);

          if (existingItem) {
            // Update quantity
            return {
              items: state.items.map(item =>
                item.product.id === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          } else {
            // Add new item - product details will be fetched in UI layer
            // For now return state - UI will handle product lookup
            return state;
          }
        });
      },

      // This version expects a full product object
      addItemWithProduct: (product: Product, quantity: number) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === product.id);

          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          } else {
            return {
              items: [...state.items, { product, quantity }],
            };
          }
        });
      },

      removeItem: (productId: number) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId: number, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(item => item.product.id !== productId),
            };
          }

          return {
            items: state.items.map(item =>
              item.product.id === productId
                ? { ...item, quantity }
                : item
            ),
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
        return Math.max(0, subtotal - Number(state.discountAmount));
      },

      itemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
      } as const,
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