import { describe, expect, it, jest } from "@jest/globals";
import { useProducts } from "../useProducts";

jest.mock("@/database/repositories/productRepository");

describe("useProducts hook", () => {
  it("should be defined", () => {
    expect(useProducts).toBeDefined();
  });
});
