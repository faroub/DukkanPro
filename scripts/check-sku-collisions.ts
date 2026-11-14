import { normalizeSkuForLookup } from "../src/database/repositories/productRepository";

export interface SkuProductRecord {
  id: number;
  name: string;
  sku: string;
}

/**
 * Detect case-insensitive and leading-zero SKU collisions across a list of product records.
 */
export function findSkuCollisions(products: SkuProductRecord[]) {
  const skuMap = new Map<string, SkuProductRecord[]>();

  for (const r of products) {
    if (!r.sku) continue;
    const normalized = normalizeSkuForLookup(r.sku);
    if (!normalized) continue;
    const existing = skuMap.get(normalized) || [];
    existing.push(r);
    skuMap.set(normalized, existing);
  }

  return Array.from(skuMap.entries()).filter(([, list]) => list.length > 1);
}
