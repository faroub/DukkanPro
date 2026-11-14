import ar from "@/locales/ar.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import {
  generateCatalogueText,
  generateCatalogueHtml,
  CatalogueExportOptions,
  CatalogueProduct,
} from "@/services/catalogue/catalogueService";

describe("Catalogue Privacy", () => {
  // Verify that catalogue section exists in all languages (same as translations.test.ts)
  it("should have catalogue section in all languages", () => {
    const sections = ["catalogue"];
    for (const section of sections) {
      expect(section in ar).toBe(true);
      expect(section in fr).toBe(true);
      expect(section in en).toBe(true);
    }
  });

  it("should have identical catalogue section keys across all languages", () => {
    const enKeys = Object.keys(en.catalogue || {}).sort();
    const arKeys = Object.keys(ar.catalogue || {}).sort();
    const frKeys = Object.keys(fr.catalogue || {}).sort();

    expect(enKeys).toEqual(arKeys);
    expect(enKeys).toEqual(frKeys);
  });

  it("should not expose customer data in catalogue keys", () => {
    const allKeys = [
      ...Object.keys(en.catalogue || {}),
      ...Object.keys(ar.catalogue || {}),
      ...Object.keys(fr.catalogue || {}),
    ];
    const privateKeys = allKeys.filter((k: string) =>
      ["customer", "debt", "profit", "cost"].some((prefix) => k.includes(prefix)),
    );
    expect(privateKeys).toHaveLength(0);
  });

  // Real output generation privacy assertions
  describe("real output export privacy", () => {
    const mockProducts: CatalogueProduct[] = [
      {
        id: 101,
        name: "Olive Oil 1L",
        category: "Oils",
        price_centimes: 12000, // Public price: 120 DZD
        stock: 77, // Internal stock count: 77 units (SENSITIVE)
      },
      {
        id: 102,
        name: "Fresh Milk 1L",
        category: "Dairy",
        price_centimes: 1100, // Public price: 11 DZD
        stock: 0, // Out of stock
      },
    ];

    const mockOptions: CatalogueExportOptions = {
      showPrices: true,
      hideOutOfStock: false,
      contact: "0550123456",
      address: "123 Market Street",
      shopName: "El-Amel Superette",
      welcomeNote: "Welcome to our shop",
    };

    const mockT = (key: string) => key;

    it("ensures generated plain text never exposes cost prices, debt, customer names, or internal stock counts", () => {
      const textOutput = generateCatalogueText(mockOptions, mockProducts, mockT);

      // Must contain public product names
      expect(textOutput).toContain("Olive Oil 1L");
      expect(textOutput).toContain("Fresh Milk 1L");

      // Must NEVER contain internal stock counts (77)
      expect(textOutput).not.toMatch(/\b77\b/);

      // Must NEVER contain financial/customer sensitive terms
      expect(textOutput.toLowerCase()).not.toContain("cost");
      expect(textOutput.toLowerCase()).not.toContain("profit");
      expect(textOutput.toLowerCase()).not.toContain("debt");
      expect(textOutput.toLowerCase()).not.toContain("customer");
    });

    it("ensures generated HTML never exposes cost prices, debt, customer names, or internal stock counts", () => {
      const htmlOutput = generateCatalogueHtml(mockOptions, mockProducts, mockT);

      // Must contain public product names
      expect(htmlOutput).toContain("Olive Oil 1L");
      expect(htmlOutput).toContain("Fresh Milk 1L");

      // Must NEVER contain internal stock counts (77)
      expect(htmlOutput).not.toMatch(/\b77\b/);
      expect(htmlOutput.toLowerCase()).not.toContain("stock_quantity");

      // Must NEVER contain financial/customer sensitive terms
      expect(htmlOutput.toLowerCase()).not.toContain("cost_price");
      expect(htmlOutput.toLowerCase()).not.toContain("profit");
      expect(htmlOutput.toLowerCase()).not.toContain("debt");
      expect(htmlOutput.toLowerCase()).not.toContain("customer_name");
    });
  });
});
