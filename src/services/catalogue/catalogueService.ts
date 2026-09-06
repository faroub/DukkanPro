import { formatCentimes } from "@/utils/money";

export interface CatalogueExportOptions {
  showPrices: boolean;
  hideOutOfStock: boolean;
  contact: string;
  address: string;
}

export interface CatalogueProduct {
  id: number;
  name: string;
  category: string;
  price_centimes: number;
  stock: number;
}

type CatalogueExportResult = { type: "text"; text: string };

export async function exportCataloguePDF(
  options: CatalogueExportOptions,
  t: (key: string) => string,
): Promise<CatalogueExportResult> {
  const { showPrices, hideOutOfStock, contact, address } = options;

  // Availability translations keys (will be resolved by caller)
  // Sample products - in full implementation, these come from database
  const sampleProducts: CatalogueProduct[] = [
    {
      id: 1,
      name: "Wheat Bread",
      category: "Bakery",
      price_centimes: 500,
      stock: 10,
    },
    { id: 2, name: "Milk", category: "Dairy", price_centimes: 300, stock: 0 },
    {
      id: 3,
      name: "Olive Oil",
      category: "Oils",
      price_centimes: 800,
      stock: 5,
    },
    { id: 4, name: "Cheese", category: "Dairy", price_centimes: 700, stock: 0 },
  ];

  const lines: string[] = [];

  // Header
  lines.push("Dukkan OS Catalogue");
  lines.push("");

  // Contact and address
  lines.push("Contact: " + contact);
  lines.push("Address: " + address);
  lines.push("");

  // Products
  lines.push("Products:");
  lines.push("");

  let hasProducts = false;

  for (const product of sampleProducts) {
    // Skip out-of-stock if hideOutOfStock is true
    if (hideOutOfStock && product.stock <= 0) continue;
    hasProducts = true;

    const availabilityKey = product.stock > 0 ? "available" : "out_of_stock";

    const priceLine = showPrices
      ? "Price: " + formatCentimes(product.price_centimes) + " DZD"
      : "";

    lines.push("• " + product.name + " (" + (product.category || "") + ")");
    lines.push(
      "  " +
        t("catalogue." + availabilityKey) +
        ": " +
        t("catalogue." + availabilityKey),
    );
    lines.push("  " + priceLine);
    lines.push("");
  }

  if (!hasProducts) {
    lines.push("No products available");
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push("Generated: " + new Date().toLocaleDateString());

  // Return text format (PDF generation not available without expo-print native module)
  const text = lines.join("\n");
  return { type: "text", text };
}
