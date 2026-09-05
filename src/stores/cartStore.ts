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
  
  // Actions
  addItem: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setPreserveCart: (value: boolean) => void;
  
  // Getters
  subtotal: () => number;
  discount: number;
  setDiscount: (value: number) => void;
  total: () => number;
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
            // Add new item - we need to fetch the product
            // For now, we'll handle this in the UI layer by passing the full product
            return state; // This will be updated in the UI
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
      
      subtotal: () => {
        const state = get();
        return state.items.reduce((sum, item) => {
          return sum + (item.product.sale_price_centimes * item.quantity);
        }, 0);
      },
      
      total: () => {
        const state = get();
        const subtotal = state.subtotal();
        return Math.max(0, subtotal - state.discount);
      },
    }),
    {
      name: 'cart-storage',
      // Only persist if preserveCart is true - we'll customize this
      // For now, we'll not persist and rely on preserveCart flag
      getStorage: () => ({
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
      }),
    }
  )
);

// Helper hook to encapsulate the cart store logic
export function useCartStoreHook() {
  const store = useCartStore();
  
  return {
    items: store.items,
    addItem: (productId: number, quantity: number) => {
      // This is a simplified version - in practice we'd need to get the product
      // For now, we'll expect the UI to pass the product object
    },
    addItemWithProduct: store.addItemWithProduct,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    preserveCart: store.preserveCart,
    setPreserveCart: store.setPreserveCart,
    subtotal: store.subtotal(),
    discount: store.discount,
    setDiscount: store.setDiscount,
    total: store.total(),
  };
}