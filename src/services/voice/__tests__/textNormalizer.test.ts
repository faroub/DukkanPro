import {
    normalizeNumberWord,
    normalizeProductName,
    normalizeSalesText,
} from "@/services/voice/textNormalizer";

describe("voice number normalization", () => {
  const arabicNumbers = [
    ["صفر", 0],
    ["واحد", 1],
    ["اثنان", 2],
    ["ثلاثة", 3],
    ["أربعة", 4],
    ["خمسة", 5],
    ["ستة", 6],
    ["سبعة", 7],
    ["ثمانية", 8],
    ["تسعة", 9],
    ["عشرة", 10],
    ["أحد عشر", 11],
    ["اثنا عشر", 12],
    ["ثلاثة عشر", 13],
    ["أربعة عشر", 14],
    ["خمسة عشر", 15],
    ["ستة عشر", 16],
    ["سبعة عشر", 17],
    ["ثمانية عشر", 18],
    ["تسعة عشر", 19],
    ["عشرون", 20],
  ] as const;
  const frenchNumbers = [
    ["zéro", 0],
    ["un", 1],
    ["deux", 2],
    ["trois", 3],
    ["quatre", 4],
    ["cinq", 5],
    ["six", 6],
    ["sept", 7],
    ["huit", 8],
    ["neuf", 9],
    ["dix", 10],
    ["onze", 11],
    ["douze", 12],
    ["treize", 13],
    ["quatorze", 14],
    ["quinze", 15],
    ["seize", 16],
    ["dix-sept", 17],
    ["dix-huit", 18],
    ["dix-neuf", 19],
    ["vingt", 20],
  ] as const;
  const englishNumbers = [
    ["zero", 0],
    ["one", 1],
    ["two", 2],
    ["three", 3],
    ["four", 4],
    ["five", 5],
    ["six", 6],
    ["seven", 7],
    ["eight", 8],
    ["nine", 9],
    ["ten", 10],
    ["eleven", 11],
    ["twelve", 12],
    ["thirteen", 13],
    ["fourteen", 14],
    ["fifteen", 15],
    ["sixteen", 16],
    ["seventeen", 17],
    ["eighteen", 18],
    ["nineteen", 19],
    ["twenty", 20],
  ] as const;

  it.each(arabicNumbers)("parses Arabic %s as %s", (word, value) => {
    expect(normalizeNumberWord(word)).toBe(value);
  });
  it.each(frenchNumbers)("parses French %s as %s", (word, value) => {
    expect(normalizeNumberWord(word)).toBe(value);
  });
  it.each(englishNumbers)("parses English %s as %s", (word, value) => {
    expect(normalizeNumberWord(word)).toBe(value);
  });

  it("replaces a detected quantity without changing the product name", () => {
    expect(normalizeSalesText("Vendu dix-sept pains")).toEqual({
      normalized: "vendu <QUANTITY> pains",
      detectedQuantity: 17,
      language: "fr",
    });
    expect(normalizeProductName("<QUANTITY> pains")).toBe("pains");
  });
});
