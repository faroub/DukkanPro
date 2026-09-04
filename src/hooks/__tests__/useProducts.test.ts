import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useProducts } from "../useProducts";
import * as productRepository from "@/database/repositories/productRepository";

jest.mock("@/database/repositories/productRepository");

describe("useProducts hook", () => {
  it("should be defined", () => {
    expect(useProducts).toBeDefined();
  });
});
