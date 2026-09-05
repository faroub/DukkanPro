import { useCallback, useState } from 'react';
import type { Sale } from '@/types/entities';
import { saleRepository } from '@/database/repositories/saleRepository';

export function useSales() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const createSale = useCallback(async (saleInput: {
    customerId?: number;
    paymentMethod: 'cash' | 'electronic' | 'mixed' | 'partial' | 'credit';
    items: Array<{
      productId: number;
      quantity: number;
      unitSalePriceCentimes: number;
      note?: string;
    }>;
    note?: string;
    discountCentimes?: number;
  }) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const sale = await saleRepository.create({
        customerId: saleInput.customerId,
        paymentMethod: saleInput.paymentMethod,
        items: saleInput.items,
        note: saleInput.note,
      });
      
      setLastSale(sale);
      return sale;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create sale';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const resetSaleState = useCallback(() => {
    setError(null);
    setLastSale(null);
  }, []);

  return {
    createSale,
    isSaving,
    error,
    lastSale,
    resetSaleState,
  };
}