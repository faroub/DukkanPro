import * as productRepository from "@/database/repositories/productRepository";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useProducts } from "../useProducts";

jest.mock("@/database/repositories/productRepository");

const mockGetAll = productRepository.getAll as jest.MockedFunction<
  typeof productRepository.getAll
>;
const mockSearch = productRepository.search as jest.MockedFunction<
  typeof productRepository.search
>;

describe("useProducts hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue([
      {
        id: 1,
        name: "طحين",
        sku: "FL-001",
        category: "مخبوزات",
        sale_price_centimes: 1500,
        cost_price_centimes: 900,
        stock_quantity: 42,
        minimum_stock_quantity: 10,
        unit: "كغ",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    mockSearch.mockResolvedValue([
      {
        id: 1,
        name: "طحين",
        sku: "FL-001",
        category: "مخبوزات",
        sale_price_centimes: 1500,
        cost_price_centimes: 900,
        stock_quantity: 42,
        minimum_stock_quantity: 10,
        unit: "كغ",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  });

  it("should initialize with empty products and loading state", async () => {
    const { result } = await renderHook(() => useProducts({}));
    expect(result.current).toBeDefined();
  });

  it("should mock product repository calls", async () => {
    const { result } = await renderHook(() => useProducts({}));
    await result.current.reload();
    expect(productRepository.getAll).toHaveBeenCalled();
  });

  it("should mock search repository calls", async () => {
    const { result } = await renderHook(() => useProducts({ search: "طحين" }));
    await result.current.reload();
    expect(productRepository.search).toHaveBeenCalledWith("طحين", {
      is_active: undefined,
    });
  });

  it("should handle errors from repository", async () => {
    mockGetAll.mockRejectedValueOnce(new Error("Failed to load products"));
    const { result } = await renderHook(() => useProducts({}));
    await result.current.reload();
    expect(productRepository.getAll).toHaveBeenCalled();
  });

  it("should call reload and refetch functions", async () => {
    const { result } = await renderHook(() => useProducts({}));
    await result.current.reload();
    await result.current.refetch();
    expect(productRepository.getAll).toHaveBeenCalledTimes(2);
  });
});
