import {
    exportCustomers,
    exportProducts,
    exportSaleItems,
    exportSales,
} from "@/services/export/csvExportService";

const t = (key: string) => key;

describe("CSV export privacy", () => {
  it("excludes product cost and internal stock", () => {
    const csv = exportProducts(
      [
        {
          id: 1,
          name: "Bread",
          sku: "BR-1",
          category: "Bakery",
          sale_price_centimes: 500,
          cost_price_centimes: 200,
          stock_quantity: 99,
          unit: "pcs",
        },
      ],
      t as never,
    );

    expect(csv).toContain("500");
    expect(csv).not.toContain("cost_price");
    expect(csv).not.toContain("stock_quantity");
    expect(csv).not.toContain("200");
    expect(csv).not.toContain("99");
  });

  it("excludes customer debt and private notes", () => {
    const csv = exportCustomers(
      [
        {
          id: 1,
          name: "Samir",
          phone: "0550000000",
          debt_centimes: 3000,
          note: "private",
        },
      ],
      t as never,
    );
    expect(csv).toContain("Samir");
    expect(csv).not.toContain("debt_centimes");
    expect(csv).not.toContain("private");
    expect(csv).not.toContain("3000");
  });

  it("excludes historical unit cost from sale items", () => {
    const csv = exportSaleItems(
      [
        {
          id: 1,
          product_name_snapshot: "Bread",
          quantity: 2,
          unit_sale_price_centimes: 500,
          line_total_centimes: 1000,
          unit_cost_price_centimes: 200,
        },
      ],
      t as never,
    );
    expect(csv).toContain("1000");
    expect(csv).not.toContain("unit_cost_price");
    expect(csv).not.toContain("200");
  });

  it("excludes profit and internal balances from sales", () => {
    const csv = exportSales(
      [
        {
          id: 1,
          customer_id: 2,
          payment_method: "cash",
          subtotal_centimes: 1000,
          total_centimes: 1000,
          status: "completed",
          profit_centimes: 400,
          remaining_balance_centimes: 500,
        },
      ],
      t as never,
    );
    expect(csv).not.toContain("profit_centimes");
    expect(csv).not.toContain("remaining_balance_centimes");
    expect(csv).not.toContain("400");
  });
});
