import {
    exportCataloguePDF,
    generateCatalogueHtml,
    generateCatalogueText,
} from "@/services/catalogue/catalogueService";

describe("Catalogue Service - Public Output & Privacy", () => {
  const mockOptions = {
    showPrices: true,
    hideOutOfStock: true,
    shopName: "Supérette El-Amel",
    contact: "+213 550 12 34 56",
    address: "Rue Didouche Mourad, Alger Centre",
    welcomeNote: "Commandes par WhatsApp acceptées",
  };

  const sampleProducts = [
    {
      id: 1,
      name: "Lait Candia 1L",
      category: "Dairy & Fresh",
      price_centimes: 14000,
      stock: 24,
    },
    {
      id: 2,
      name: "Café Moulu Familico 250g",
      category: "Groceries",
      price_centimes: 32000,
      stock: 15,
    },
    {
      id: 3,
      name: "Pain Baguette Blanche",
      category: "Bakery",
      price_centimes: 1500,
      stock: 0, // out of stock
    },
  ];

  const mockT = (key: string) => {
    const map: Record<string, string> = {
      "catalogue.available": "Disponible",
      "catalogue.outOfStock": "Rupture de stock",
      "catalogue.thanksMessage": "Merci de votre fidélité !",
      "catalogue.validNotice": "Valable selon stocks disponibles",
      "catalogue.selectProductsTitle": "Produits",
      "catalogue.showRetailPrices": "Prix de vente",
      "catalogue.noProductsForCatalogue": "Aucun produit pour le catalogue",
    };
    return map[key] || key;
  };

  it("generates text output that includes store info and public product data", () => {
    const text = generateCatalogueText(mockOptions, sampleProducts, mockT);

    expect(text).toContain("Supérette El-Amel");
    expect(text).toContain("+213 550 12 34 56");
    expect(text).toContain("Rue Didouche Mourad, Alger Centre");
    expect(text).toContain("Lait Candia 1L");
    expect(text).toContain("140 DZD");
    expect(text).toContain("Disponible");
    expect(text).toContain("Merci de votre fidélité !");
  });

  it("filters out of stock products when hideOutOfStock is true", () => {
    const text = generateCatalogueText(
      { ...mockOptions, hideOutOfStock: true },
      sampleProducts,
      mockT,
    );

    // Pain Baguette has stock: 0
    expect(text).not.toContain("Pain Baguette Blanche");
    expect(text).toContain("Lait Candia 1L");
  });

  it("includes out of stock products with badge when hideOutOfStock is false", () => {
    const text = generateCatalogueText(
      { ...mockOptions, hideOutOfStock: false },
      sampleProducts,
      mockT,
    );

    expect(text).toContain("Pain Baguette Blanche");
    expect(text).toContain("Rupture de stock");
  });

  it("hides prices when showPrices is false", () => {
    const text = generateCatalogueText(
      { ...mockOptions, showPrices: false },
      sampleProducts,
      mockT,
    );

    expect(text).toContain("Lait Candia 1L");
    expect(text).not.toContain("140 DZD");
  });

  it("STRICT PRIVACY: ensures NO cost price, profit, debt, customer data or internal warehouse stock count is in the output", () => {
    const text = generateCatalogueText(mockOptions, sampleProducts, mockT);
    const html = generateCatalogueHtml(mockOptions, sampleProducts, mockT);

    const sensitiveKeywords = [
      "cost_price",
      "costprice",
      "profit",
      "profit_margin",
      "debt",
      "customer_tab",
      "warehouse_count",
      "internal_stock",
    ];

    for (const keyword of sensitiveKeywords) {
      expect(text.toLowerCase()).not.toContain(keyword);
      expect(html.toLowerCase()).not.toContain(keyword);
    }
  });

  it("generates valid HTML brochure structure matching Stitch design", () => {
    const html = generateCatalogueHtml(mockOptions, sampleProducts, mockT);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Supérette El-Amel");
    expect(html).toContain("#1B6B3A"); // Primary theme green
    expect(html).toContain("Lait Candia 1L");
    expect(html).toContain("140 DZD");
  });

  it("maintains backward compatibility with legacy exportCataloguePDF", async () => {
    const result = await exportCataloguePDF(
      {
        showPrices: true,
        hideOutOfStock: true,
        contact: "+213 550 00 00 00",
        address: "Alger",
      },
      mockT,
    );

    expect(result.type).toBe("text");
    expect(result.text).toContain("Dukkan OS Catalogue");
  });
});
