import { useState, useCallback } from "react";
import { getAll, search } from "@/database/repositories/productRepository";
import type { Product } from "@/types/entities";
import { mockDatabase } from "@/utils/testing";

/**
 * Filters for product listing
 */
export type ProductsFilters = {
  is_active?: boolean;
  search?: string;
};

/**
 * UseProducts hook - manages product list state with filtering
 *
 * Features:
 * - Fetch all active products
 * - Real-time search by name or SKU
 * - Filter by stock status (all, low stock, out of stock, archived)
 * - Loading and error state management
 */
export function useProducts(filters: ProductsFilters = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { is_active, search: searchQuery } = filters;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let allProducts: Product[];

      if (searchQuery) {
        allProducts = await search(searchQuery, { is_active });
      } else {
        allProducts = await getAll({ is_active });
      }

      // Transform products for display: add badge info
      const transformed = allProducts.map((product) => ({
        ...product,
        lowStock: product.stock_quantity <= product.minimum_stock_quantity,
        outOfStock: product.stock_quantity === 0,
      }));

      setProducts(transformed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load products",
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, is_active]);

  const reload = useCallback(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    reload,
    refetch: reload,
  };
}

