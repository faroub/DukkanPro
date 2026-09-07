import { matchProduct } from "@/services/voice/productMatcher";

describe("voice product matching", () => {
  const products = [
    { id: 1, name: "Milk Tea" },
    { id: 2, name: "Milk Chocolate" },
    { id: 3, name: "Bread" },
  ];

  it("matches an exact product", () => {
    const result = matchProduct("Milk Tea", products);
    expect(result.type).toBe("exact");
    expect(result.matchedName).toBe("Milk Tea");
  });

  it("returns a single partial match", () => {
    const result = matchProduct("Bread loaf", products);
    expect(result.type).toBe("partial");
    expect(result.matchedName).toBe("Bread");
  });

  it("returns all candidates for an ambiguous match", () => {
    const result = matchProduct("Milk", products);
    expect(result.type).toBe("ambiguous");
    expect(result.choices.map((choice) => choice.name)).toEqual([
      "Milk Tea",
      "Milk Chocolate",
    ]);
  });

  it("returns none when no product matches", () => {
    expect(matchProduct("Coffee", products).type).toBe("none");
  });
});
