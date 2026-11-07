import {
    exportCustomers,
    exportInventoryMovements,
    exportPayments,
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

    // Sale price is exported in main units (500 centimes = 5 units),
    // never as raw centimes that a reader would mistake for 500 units.
    expect(csv).toContain('"5"');
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
    expect(csv).toContain('"10"');
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

describe("CSV export quoting", () => {
  it("quotes a value containing a comma exactly once", () => {
    const csv = exportProducts(
      [
        {
          id: 1,
          name: "Milk, 1L",
          sku: "MK-1",
          category: "Dairy",
          sale_price_centimes: 500,
          unit: "pcs",
        },
      ],
      t as never,
    );
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toBe(`"1","Milk, 1L","MK-1","Dairy","5","pcs"`);
  });

  it("escapes an embedded double quote exactly once, not twice", () => {
    const csv = exportProducts(
      [
        {
          id: 1,
          name: 'Soda "Classic"',
          sku: "SK-1",
          category: "Soda",
          sale_price_centimes: 500,
          unit: "pcs",
        },
      ],
      t as never,
    );
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toBe(`"1","Soda ""Classic""","SK-1","Soda","5","pcs"`);
  });

  it("keeps a value containing a newline inside a single quoted field", () => {
    const csv = exportCustomers(
      [
        {
          id: 1,
          name: "Line one\nLine two",
          phone: "0550000000",
        },
      ],
      t as never,
    );
    // The newline lives inside the quoted field — a CSV parser reads this as
    // one record with a two-line name. Doubled quoting would corrupt it.
    expect(csv).toBe(
      `"customers.id","customers.name","customers.phone"\n"1","Line one\nLine two","0550000000"`,
    );
  });
});

describe("CSV export numeric values", () => {
  it("exports a negative quantity_change without a formula-injection apostrophe", () => {
    const csv = exportInventoryMovements(
      [
        {
          id: 1,
          product_id: 2,
          movement_type: "out",
          quantity_change: -3,
          note: "Cancelled sale",
          created_at: "2026-11-07 09:00:00",
        },
      ],
      t as never,
    );
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toBe(`"1","Product 2","movementType.out","-3","Cancelled sale","2026-11-07"`);
  });

  it("exports a negative sale-item quantity unchanged", () => {
    const csv = exportSaleItems(
      [
        {
          id: 1,
          product_name_snapshot: "Bread",
          quantity: -3,
          unit_sale_price_centimes: 500,
          line_total_centimes: 1500,
        },
      ],
      t as never,
    );
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toBe(`"1","Bread","-3","5","15"`);
  });
});

describe("CSV export date trimming", () => {
  it("trims a SQLite space-separated timestamp to the date in sales", () => {
    const csv = exportSales(
      [
        {
          id: 1,
          payment_method: "cash",
          subtotal_centimes: 1000,
          total_centimes: 1000,
          status: "completed",
          sold_at: "2026-11-07 14:30:00",
        },
      ],
      t as never,
    );
    expect(csv).toContain('"2026-11-07"');
    expect(csv).not.toContain("14:30:00");
  });

  it("trims a SQLite space-separated timestamp to the date in payments", () => {
    const csv = exportPayments(
      [
        {
          id: 1,
          amount_centimes: 1000,
          payment_method: "cash",
          paid_at: "2026-11-07 08:15:00",
        },
      ],
      t as never,
    );
    expect(csv).toContain('"2026-11-07"');
    expect(csv).not.toContain("08:15:00");
  });

  it("trims a SQLite space-separated timestamp to the date in inventory movements", () => {
    const csv = exportInventoryMovements(
      [
        {
          id: 1,
          product_id: 2,
          movement_type: "in",
          quantity_change: 10,
          note: "Restock",
          created_at: "2026-11-07 18:45:00",
        },
      ],
      t as never,
    );
    expect(csv).toContain('"2026-11-07"');
    expect(csv).not.toContain("18:45:00");
  });
});

describe("CSV export currency column", () => {
  it("includes the currency column in sales exports", () => {
    const csv = exportSales(
      [
        {
          id: 1,
          payment_method: "cash",
          subtotal_centimes: 1000,
          total_centimes: 1000,
          status: "completed",
          sold_at: "2026-11-07 14:30:00",
          currency: "DZD",
        },
      ],
      t as never,
    );
    expect(csv.split("\n")[0]).toContain("sales.currency");
    expect(csv).toContain('"DZD"');
  });

  it("includes the currency column in payments exports", () => {
    const csv = exportPayments(
      [
        {
          id: 1,
          amount_centimes: 1000,
          payment_method: "cash",
          paid_at: "2026-11-07 14:30:00",
          currency: "EUR",
        },
      ],
      t as never,
    );
    expect(csv.split("\n")[0]).toContain("payments.currency");
    expect(csv).toContain('"EUR"');
  });

  it("labels amount headers with the active currency unit", () => {
    const csv = exportPayments([], t as never);
    expect(csv.split("\n")[0]).toBe(
      `"payments.id","payments.amount (DZD)","payments.currency","payments.payment_method","payments.date"`,
    );
  });
});
