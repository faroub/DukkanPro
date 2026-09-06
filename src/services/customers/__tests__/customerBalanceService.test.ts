/// <reference types="jest" />
// @ts-nocheck
import * as customerRepository from "@/database/repositories/customerRepository";
import * as saleRepository from "@/database/repositories/saleRepository";
import * as customerBalanceService from "@/services/customers/customerBalanceService";
import { beforeEach, describe, expect, it } from "@jest/globals";

let mockedSales: any[] = [];
let mockedPayments: any[] = [];

// Mock the database module - service imports executeRead/executeWrite from here
jest.mock("@/database/database", () => ({
  executeRead: jest.fn((sql: string, ...params: any[]) => {
    // Mock SQL query results based on common patterns
    if (sql.includes("sales") && sql.includes("customer_id")) {
      // Return columns that the service's getSalesByCustomer expects
      return mockedSales;
    }
    if (sql.includes("customer_payments") && sql.includes("customer_id")) {
      return mockedPayments;
    }
    return [];
  }),
  executeWrite: jest.fn().mockResolvedValue({ lastID: 1 }),
}));

jest.mock("@/database/repositories/saleRepository", () => ({
  getByCustomerId: jest.fn(),
}));

jest.mock("@/database/repositories/customerRepository", () => ({
  create: jest.fn(),
  getById: jest.fn(),
  getAll: jest.fn(),
  update: jest.fn(),
  archive: jest.fn(),
}));

const mockCompletedSale: any = {
  id: 1,
  customer_id: 1,
  status: "completed",
  subtotal_centimes: 28000,
  discount_centimes: 0,
  total_centimes: 28000,
  amount_paid_centimes: 0,
  remaining_balance_centimes: 28000,
  payment_method: "cash",
  note: null,
  sold_at: "2026-09-01T10:00:00Z",
  created_at: "2026-09-01T10:00:00Z",
};

const mockCancelledSale: any = {
  id: 2,
  customer_id: 1,
  status: "cancelled",
  subtotal_centimes: 5000,
  discount_centimes: 0,
  total_centimes: 5000,
  amount_paid_centimes: 0,
  remaining_balance_centimes: 0,
  payment_method: "cash",
  note: "Cancelled by customer",
  sold_at: "2026-09-02T10:00:00Z",
  created_at: "2026-09-02T10:00:00Z",
};

const mockReturnedSale: any = {
  id: 3,
  customer_id: 1,
  status: "returned",
  subtotal_centimes: 3000,
  discount_centimes: 0,
  total_centimes: 3000,
  amount_paid_centimes: 0,
  remaining_balance_centimes: 0,
  payment_method: "cash",
  note: "Returned by customer",
  sold_at: "2026-09-03T10:00:00Z",
  created_at: "2026-09-03T10:00:00Z",
};

const mockPayment1: any = {
  id: 1,
  customer_id: 1,
  amount_centimes: 40000,
  payment_method: "cash",
  note: "Partial payment",
  paid_at: "2026-09-15T10:00:00Z",
  created_at: "2026-09-15T10:00:00Z",
};

const mockPayment2: any = {
  id: 2,
  customer_id: 1,
  amount_centimes: 20000,
  payment_method: "electronic",
  note: "Salary contribution",
  paid_at: "2026-09-20T10:00:00Z",
  created_at: "2026-09-20T10:00:00Z",
};

describe("customerBalanceService", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockedSales = [];
    mockedPayments = [];
  });

  describe("getCustomerDebt", () => {
    it("should calculate debt from completed sales balance minus payments", async () => {
      // Mock: one completed sale with 28000 centimes (280 DZD), no payments
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
      ]);
      mockedSales = [mockCompletedSale];

      const debt = await customerBalanceService.getCustomerDebt(1);
      // Debt = 28000 - 0 = 28000
      expect(debt).toBe(28000);
    });

    it("should exclude cancelled sales from debt calculation", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCancelledSale,
      ]);
      mockedSales = [mockCancelledSale];

      const debt = await customerBalanceService.getCustomerDebt(1);
      // Cancelled sales should be excluded, so debt = 0
      expect(debt).toBe(0);
    });

    it("should exclude returned sales from debt calculation", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockReturnedSale,
      ]);
      mockedSales = [mockReturnedSale];

      const debt = await customerBalanceService.getCustomerDebt(1);
      // Returned sales should be excluded, so debt = 0
      expect(debt).toBe(0);
    });

    it("should handle multiple completed sales", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
        { ...mockCompletedSale, id: 2, total_centimes: 15000 },
      ]);
      mockedSales = [
        mockCompletedSale,
        {
          ...mockCompletedSale,
          id: 2,
          total_centimes: 15000,
          remaining_balance_centimes: 15000,
        },
      ];

      const debt = await customerBalanceService.getCustomerDebt(1);
      // Debt = 28000 + 15000 - 0 = 43000
      expect(debt).toBe(43000);
    });

    it("should block overpayment (debt cannot be negative)", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
      ]);
      mockedSales = [mockCompletedSale];
      mockedSales = [mockCompletedSale];

      // Make a payment larger than debt
      const result = await customerBalanceService.recordPayment(
        1,
        999999,
        "cash",
      );
      // Should block overpayment and return null or indicate failure
      expect(result).toBeNull();
    });

    it("should return 0 debt when no sales exist", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([]);

      const debt = await customerBalanceService.getCustomerDebt(1);
      expect(debt).toBe(0);
    });
  });

  describe("getCustomerPayments", () => {
    it("should retrieve payments for a customer", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([]);

      const payments = await customerBalanceService.getCustomerPayments(1);
      expect(payments).toEqual([]);
    });

    it("should return empty array when no payments exist", async () => {
      const payments = await customerBalanceService.getCustomerPayments(1);
      expect(payments).toEqual([]);
    });
  });

  describe("canRecordPayment", () => {
    it("should allow payment when amount <= debt", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
      ]);
      mockedSales = [mockCompletedSale];
      mockedSales = [mockCompletedSale];

      const result = await customerBalanceService.canRecordPayment(1, 28000);
      expect(result).toBe(true);
    });

    it("should block overpayment when amount > debt", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
      ]);
      mockedSales = [mockCompletedSale];

      const result = await customerBalanceService.canRecordPayment(1, 99999);
      expect(result).toBe(false);
    });

    it("should block zero amount payment", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
      ]);
      mockedSales = [mockCompletedSale];

      const result = await customerBalanceService.canRecordPayment(1, 0);
      expect(result).toBe(false);
    });

    it("should block negative amount payment", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
      ]);

      const result = await customerBalanceService.canRecordPayment(1, -100);
      expect(result).toBe(false);
    });
  });

  describe("recordPayment", () => {
    it("should record a payment successfully", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
      ]);
      mockedSales = [mockCompletedSale];

      (customerRepository.create as jest.Mock).mockResolvedValueOnce({
        id: 1,
        customer_id: 1,
        business_name: "Test",
        owner_name: "Test",
        business_type: "grocery",
        currency: "DZD",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await customerBalanceService.recordPayment(
        1,
        20000,
        "cash",
      );
      // Should record the payment successfully
      expect(result).not.toBeNull();
    });

    it("should return null when payment would overceed debt", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
      ]);
      mockedSales = [mockCompletedSale];

      const result = await customerBalanceService.recordPayment(
        1,
        99999,
        "cash",
      );
      // Should return null when payment exceeds debt
      expect(result).toBeNull();
    });

    it("should record electronic payment", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
      ]);
      mockedSales = [mockCompletedSale];

      (customerRepository.create as jest.Mock).mockResolvedValueOnce({
        id: 1,
        customer_id: 1,
        business_name: "Test",
        owner_name: "Test",
        business_type: "grocery",
        currency: "DZD",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await customerBalanceService.recordPayment(
        1,
        20000,
        "electronic",
      );
      expect(result).not.toBeNull();
    });
  });

  describe("getCustomerBalanceSummary", () => {
    it("should return balance summary with debt, total paid, and payment count", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([
        mockCompletedSale,
      ]);

      const summary = await customerBalanceService.getCustomerBalanceSummary(1);
      // Summary should have debt, totalPaid, and paymentCount
      expect(summary).toMatchObject({
        debt_centimes: expect.any(Number),
        total_paid_centime: expect.any(Number),
        paymentCount: expect.any(Number),
      });
    });

    it("should return zero summary for customer with no sales or payments", async () => {
      (saleRepository.getByCustomerId as jest.Mock).mockResolvedValueOnce([]);

      const summary = await customerBalanceService.getCustomerBalanceSummary(1);
      expect(summary).toMatchObject({
        debt_centimes: 0,
        total_paid_centime: 0,
        paymentCount: 0,
      });
    });
  });
});
