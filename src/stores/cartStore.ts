import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '@/types/entities';

/**
 * Minimal product shape for cart item persistence.
 * Contains only what the cart needs for display and calculation.
 * cost_price_centimes and other internal fields are excluded.
 */
export interface CartProduct {
  id: number;
  name: string;
  sku?: string | null;
  category?: string | null;
  sale_price_centimes: number;
  stock_quantity: number;
  unit?: string;
  is_active?: boolean;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  preserveCart: boolean;
  discount: number;

  // Actions
  removeItem: (productId: number) => void;
  subtractItem: (productId: number, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setPreserveCart: (value: boolean) => void;
  setDiscount: (value: number) => void;
  addItemWithProduct: (product: Product, quantity: number) => void;
  refreshItemProducts: (products: Product[]) => void;

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

      // Expects a full product object; converts to CartProduct before storing
      addItemWithProduct: (product: Product, quantity: number) => {
        if (!product || typeof product.id !== "number" || !Number.isSafeInteger(product.id)) {
          return;
        }
        const validQuantity =
          typeof quantity === "number" && Number.isSafeInteger(quantity) && quantity > 0
            ? quantity
            : 1;

        // Convert to CartProduct (exclude sensitive fields)
        const cartProduct: CartProduct = {
          id: product.id,
          name: product.name,
          sku: product.sku ?? null,
          category: product.category ?? null,
          sale_price_centimes:
            typeof product.sale_price_centimes === "number" &&
            Number.isSafeInteger(product.sale_price_centimes) &&
            product.sale_price_centimes >= 0
              ? product.sale_price_centimes
              : 0,
          stock_quantity:
            typeof product.stock_quantity === "number" &&
            Number.isSafeInteger(product.stock_quantity) &&
            product.stock_quantity >= 0
              ? product.stock_quantity
              : 0,
          unit: product.unit || "pcs",
          is_active: product.is_active !== false,
        };

        set((state) => {
          const existingItem = state.items.find(item => item.product.id === cartProduct.id);
          const maxAvailable = Math.max(0, cartProduct.stock_quantity ?? 0);

          if (existingItem) {
            const desiredQty = existingItem.quantity + validQuantity;
            const clampedQty = Math.min(desiredQty, maxAvailable);
            if (clampedQty <= 0) return state;

            return {
              items: state.items.map(item =>
                item.product.id === cartProduct.id
                  ? { ...item, quantity: clampedQty }
                  : item
              ),
            };
          } else {
            const initialQty = Math.min(validQuantity, maxAvailable);
            if (initialQty <= 0) return state;

            return {
              items: [...state.items, { product: cartProduct, quantity: initialQty }],
            };
          }
        });
      },

      // Replaces each cart item's product snapshot with the given fresh record,
      // strictly ensuring only CartProduct fields are retained (stripping cost_price_centimes)
      refreshItemProducts: (products: Product[]) => {
        set((state) => ({
          items: state.items.map((item) => {
            const fresh = products.find((p) => p.id === item.product.id);
            if (!fresh) return item;
            const cartProduct: CartProduct = {
              id: fresh.id,
              name: fresh.name,
              sku: fresh.sku ?? null,
              category: fresh.category ?? null,
              sale_price_centimes:
                typeof fresh.sale_price_centimes === "number" &&
                Number.isSafeInteger(fresh.sale_price_centimes) &&
                fresh.sale_price_centimes >= 0
                  ? fresh.sale_price_centimes
                  : 0,
              stock_quantity:
                typeof fresh.stock_quantity === "number" &&
                Number.isSafeInteger(fresh.stock_quantity) &&
                fresh.stock_quantity >= 0
                  ? fresh.stock_quantity
                  : 0,
              unit: fresh.unit || "pcs",
              is_active: fresh.is_active !== false,
            };
            return { ...item, product: cartProduct };
          }),
        }));
      },

      removeItem: (productId: number) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId),
        }));
      },

      subtractItem: (productId: number, quantity: number = 1) => {
        const validQuantity =
          typeof quantity === "number" && Number.isSafeInteger(quantity) && quantity > 0
            ? quantity
            : 1;

        set((state) => {
          const existingItem = state.items.find(item => item.product.id === productId);
          if (!existingItem) return state;

          const newQuantity = existingItem.quantity - validQuantity;
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
        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
          set((state) => ({
            items: state.items.filter(item => item.product.id !== productId),
          }));
          return;
        }

        set((state) => {
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
        const cleanDiscount =
          typeof value === "number" && Number.isSafeInteger(value) && value >= 0
            ? Math.floor(value)
            : 0;
        set({ discount: cleanDiscount });
      },

      // Getters
      subtotal: () => {
        const state = get();
        return state.items.reduce((sum, item) => {
          const price = item.product.sale_price_centimes || 0;
          const qty = item.quantity || 0;
          return sum + (price * qty);
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
        return state.items.reduce((count, item) => count + (item.quantity || 0), 0);
      },
    }),
    {
      name: 'dukkanos-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const rawItems = state.items || [];
        const sanitizedItems: CartItem[] = [];

        for (const item of rawItems) {
          if (
            item &&
            item.product &&
            typeof item.product.id === "number" &&
            Number.isSafeInteger(item.product.id) &&
            item.product.id > 0 &&
            typeof item.product.sale_price_centimes === "number" &&
            Number.isSafeInteger(item.product.sale_price_centimes) &&
            item.product.sale_price_centimes >= 0 &&
            typeof item.quantity === "number" &&
            Number.isSafeInteger(item.quantity) &&
            item.quantity > 0
          ) {
            const cleanProduct: CartProduct = {
              id: item.product.id,
              name: String(item.product.name || ""),
              sku: item.product.sku ? String(item.product.sku) : null,
              category: item.product.category ? String(item.product.category) : null,
              sale_price_centimes: item.product.sale_price_centimes,
              stock_quantity:
                typeof item.product.stock_quantity === "number" &&
                Number.isSafeInteger(item.product.stock_quantity) &&
                item.product.stock_quantity >= 0
                  ? item.product.stock_quantity
                  : 0,
              unit: item.product.unit ? String(item.product.unit) : "pcs",
              is_active: item.product.is_active !== false,
            };
            sanitizedItems.push({
              product: cleanProduct,
              quantity: item.quantity,
            });
          }
        }

        const sanitizedDiscount =
          typeof state.discount === "number" &&
          Number.isSafeInteger(state.discount) &&
          state.discount >= 0
            ? state.discount
            : 0;

        useCartStore.setState({
          items: sanitizedItems,
          discount: sanitizedDiscount,
        });
      },
      partialize: (state) => ({
        items: state.items.map((item) => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            category: item.product.category,
            sale_price_centimes: item.product.sale_price_centimes,
            stock_quantity: item.product.stock_quantity,
            unit: item.product.unit,
            is_active: item.product.is_active,
          },
          quantity: item.quantity,
        })),
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
    addItemWithProduct: store.addItemWithProduct,
    subtractItem: store.subtractItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    preserveCart: store.preserveCart,
    setPreserveCart: store.setPreserveCart,
    refreshItemProducts: store.refreshItemProducts,
    discount: store.discountAmount(),
    setDiscount: store.setDiscount,
    subtotal: store.subtotal(),
    total: store.total(),
    itemCount: store.itemCount(),
  };
}
