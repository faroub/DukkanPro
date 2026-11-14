import { mapSaleErrorToMessage } from "../saleErrors";

describe("saleErrors mapper", () => {
  const mockT = (key: string, options?: any) => options?.defaultValue || key;

  it("maps PRICE_CHANGED error prefix", () => {
    const msg = mapSaleErrorToMessage("PRICE_CHANGED: price moved", mockT);
    expect(msg).toContain("product price changed");
  });

  it("maps PRODUCT_INACTIVE error prefix", () => {
    const msg = mapSaleErrorToMessage("PRODUCT_INACTIVE: product 5 inactive", mockT);
    expect(msg).toContain("no longer active");
  });

  it("maps INACTIVE_CUSTOMER error prefix", () => {
    const msg = mapSaleErrorToMessage("INACTIVE_CUSTOMER: customer 10 archived", mockT);
    expect(msg).toContain("inactive or archived customer");
  });

  it("maps Insufficient stock error message", () => {
    const msg = mapSaleErrorToMessage("Insufficient stock for Milk", mockT);
    expect(msg).toContain("Insufficient stock available");
  });

  it("maps customer required error message", () => {
    const msg = mapSaleErrorToMessage("A customer must be selected to record partial payment or debt.", mockT);
    expect(msg).toContain("A customer must be selected");
  });

  it("maps Customer not found error message", () => {
    const msg = mapSaleErrorToMessage("Customer id=99 not found", mockT);
    expect(msg).toContain("selected customer was not found");
  });

  it("falls back to generic localized message for unknown error", () => {
    const msg = mapSaleErrorToMessage("Unknown DB Error 500", mockT);
    expect(msg).toBe("Sale could not be completed.");
  });

  it("falls back to generic localized message for empty string", () => {
    const msg = mapSaleErrorToMessage("", mockT);
    expect(msg).toBe("Sale could not be completed.");
  });
});
