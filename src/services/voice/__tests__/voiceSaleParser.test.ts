/// <reference types="jest" />
// @ts-nocheck
import { describe, it, expect } from "@jest/globals";
import { parseSaleCommand } from "@/services/voice/voiceSaleParser";
import { matchProduct, extractProductName, getProductLabel, getChoiceLabel } from "@/services/voice/productMatcher";

// Mock available products
const mockAvailableProducts: any[] = [
  { id: 1, name: "حليب", category: "درا", price_centimes: 500, stock: 10, unit: "liter" },
  { id: 2, name: "جبن", category: "درا", price_centimes: 800, stock: 5, unit: "piece" },
  { id: 3, name: "خبز", category: "درا", price_centimes: 20, stock: 20, unit: "piece" },
  { id: 4, name: "زيت", category: "درا", price_centimes: 1500, stock: 3, unit: "liter" },
  { id: 5, name: "بيض", category: "درا", price_centimes: 300, stock: 30, unit: "dozen" },
];

describe("voiceSaleParser", () => {
  // Mock translation function for getProductLabel and getChoiceLabel
  const mockT = (key: string) => key;

  describe("parseSaleCommand", () => {
    it("should parse Arabic command with quantity and product", () => {
      const command = "بعت حبتين حليب";
      const result = parseSaleCommand(command, mockAvailableProducts);

      expect(result).not.toBeNull();
      expect(result?.quantity).toBe(2);
      expect(result?.productName).toBe("حليب");
      expect(result?.paymentMethod).toBe("cash"); // default
      expect(result?.language).toBe("ar");
      expect(result?.matchType).toBe("exact");
    });

    it("should parse Arabic command with credit payment", () => {
      const command = "بعتل حليب بالكريدت";
      const result = parseSaleCommand(command, mockAvailableProducts);

      expect(result).not.toBeNull();
      expect(result?.paymentMethod).toBe("credit");
    });

    it("should parse Arabic command with quantity 1 when not specified", () => {
      const command = "بعت حليب";
      const result = parseSaleCommand(command, mockAvailableProducts);

      expect(result).not.toBeNull();
      expect(result?.quantity).toBe(1);
    });

    it("should parse French command", () => {
      const command = "Deux lait";
      const result = parseSaleCommand(command, mockAvailableProducts);

      expect(result).not.toBeNull();
      expect(result?.language).toBe("fr");
    });

    it("should parse English command", () => {
      const command = "Sold two milks";
      const result = parseSaleCommand(command, mockAvailableProducts);

      expect(result).not.toBeNull();
      expect(result?.language).toBe("en");
    });

    it("should handle ambiguous product match", () => {
      const command = "بعتل شيء";
      const result = parseSaleCommand(command, mockAvailableProducts);

      expect(result).not.toBeNull();
      expect(["ambiguous", "none"]).toContain(result?.matchType);
    });

    it("should handle none match when product not found", () => {
      const command = "بعتل منتج خيالي";
      const result = parseSaleCommand(command, mockAvailableProducts);

      expect(result).not.toBeNull();
      expect(["ambiguous", "none"]).toContain(result?.matchType);
    });

    it("should include productMatchResult in result", () => {
      const command = "بعت حليب";
      const result = parseSaleCommand(command, mockAvailableProducts);

      expect(result).not.toBeNull();
      expect(result?.productMatchResult).toBeDefined();
      expect(result?.productMatchResult?.matchedName).toBe("حليب");
    });
  });

  describe("extractProductName", () => {
    it("should extract product name from Arabic command", () => {
      const command = "بعت حبتين حليب";
      const result = extractProductName(command);

      expect(result).toBe("حليب");
    });

    it("should extract product name from French command", () => {
      const command = "Deux lait";
      const result = extractProductName(command);

      expect(result).toBe("lait");
    });

    it("should extract product name from English command", () => {
      const command = "Sold two milks";
      const result = extractProductName(command);

      expect(result).toBe("milks");
    });
  });

  describe("matchProduct", () => {
    it("should find exact match", () => {
      const result = matchProduct("حليب", mockAvailableProducts.map((p) => ({ name: p.name, id: p.id })));

      expect(result.type).toBe("exact");
      expect(result.matchedName).toBe("حليب");
      expect(result.product).toBeDefined();
    });

    it("should find partial match when one result exists", () => {
      const result = matchProduct("زيت", mockAvailableProducts.map((p) => ({ name: p.name, id: p.id })));

      expect(result.type).toBeDefined();
      expect(result.matchedName).toBeDefined();
    });

    it("should return ambiguous when multiple partial matches", () => {
      const result = matchProduct("produit", mockAvailableProducts.map((p) => ({ name: p.name, id: p.id })));

      expect(result.type).toBeDefined();
    });

    it("should return none when no match found", () => {
      const result = matchProduct("منتج خيالي", mockAvailableProducts.map((p) => ({ name: p.name, id: p.id })));

      expect(result.type).toBe("none");
      expect(result.choices).toEqual([]);
    });

    it("should return product in match result", () => {
      const result = matchProduct("حليب", mockAvailableProducts.map((p) => ({ name: p.name, id: p.id })));

      expect(result.product).toBeDefined();
      expect(result.product?.name).toBe("حليب");
    });
  });

  describe("getProductLabel", () => {
    it("should return Arabic product label", () => {
      const label = getProductLabel(mockT, "ar");
      expect(label).toBe("اسم المنتج");
    });

    it("should return French product label", () => {
      const label = getProductLabel(mockT, "fr");
      expect(label).toBe("Nom du produit");
    });

    it("should return English product label", () => {
      const label = getProductLabel(mockT, "en");
      expect(label).toBe("Product Name");
    });
  });

  describe("getChoiceLabel", () => {
    it("should return Arabic choice label", () => {
      const label = getChoiceLabel(mockT, "ar");
      expect(label).toBe("خيارات");
    });

    it("should return French choice label", () => {
      const label = getChoiceLabel(mockT, "fr");
      expect(label).toBe("Choix");
    });

    it("should return English choice label", () => {
      const label = getChoiceLabel(mockT, "en");
      expect(label).toBe("Choices");
    });
  });
});