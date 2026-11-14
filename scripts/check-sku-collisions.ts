/**
 * Read-only script to list existing products where two SKUs collide case-insensitively
 * or with leading zero normalization.
 */
import { getDatabase } from "../src/database/database";
import { normalizeSkuForLookup } from "../src/database/repositories/productRepository";

async function main() {
  const db = await getDatabase();
  const rows: any[] = await db.getAllAsync(
    `SELECT id, name, sku FROM products WHERE sku IS NOT NULL AND sku != ''`
  );

  const skuMap = new Map<string, Array<{ id: number; name: string; sku: string }>>();
  for (const r of rows) {
    const normalized = normalizeSkuForLookup(r.sku);
    if (!normalized) continue;
    const existing = skuMap.get(normalized) || [];
    existing.push(r);
    skuMap.set(normalized, existing);
  }

  const collisions = Array.from(skuMap.entries()).filter(([, list]) => list.length > 1);

  if (collisions.length === 0) {
    console.log("✅ No SKU collisions found across existing products.");
  } else {
    console.warn(`⚠️ Found ${collisions.length} SKU collision group(s):`);
    for (const [norm, list] of collisions) {
      console.warn(` - Normalized key "${norm}":`, list);
    }
  }
}

main().catch(console.error);
