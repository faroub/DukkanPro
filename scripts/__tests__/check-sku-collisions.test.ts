import { findSkuCollisions } from "../check-sku-collisions";

describe("check-sku-collisions script helper", () => {
  it("detects no collisions when all SKUs are distinct", () => {
    const products = [
      { id: 1, name: "Milk", sku: "SKU-001" },
      { id: 2, name: "Tea", sku: "SKU-002" },
    ];
    expect(findSkuCollisions(products)).toHaveLength(0);
  });

  it("detects case-insensitive and leading-zero SKU collisions", () => {
    const products = [
      { id: 1, name: "Milk", sku: "SKU-001" },
      { id: 2, name: "Tea", sku: "sku-001" },
      { id: 3, name: "Juice", sku: "00SKU-001" },
    ];
    const collisions = findSkuCollisions(products);
    expect(collisions).toHaveLength(1);
    expect(collisions[0][1]).toHaveLength(3);
  });
});
