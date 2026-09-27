import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LocaleProvider } from "@/providers/LocaleProvider";
import { AppThemeProvider } from "@/providers/ThemeProvider";
import { getDatabase } from "@/database/database";
import { create as createProduct } from "@/database/repositories/productRepository";
import { create as createCustomer } from "@/database/repositories/customerRepository";
import { create as createSale } from "@/database/repositories/saleRepository";
import {
  create as createBusinessProfile,
  get as getBusinessProfile,
  update as updateBusinessProfile,
} from "@/database/repositories/businessProfileRepository";
import type { Product, Customer, Sale } from "@/types/entities";

// @ts-ignore
import { mockRouter, resetMockRouter, setMockSearchParams } from "../../jest.setup";
export { mockRouter, resetMockRouter, setMockSearchParams };

/**
 * Screen Test Provider Wrapper
 * Wraps screen under test with all required runtime providers
 */
export function ScreenProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <LocaleProvider>
        <AppThemeProvider>{children}</AppThemeProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

/**
 * Primary helper to render any screen with full provider harness
 */
export function renderScreen(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: ScreenProviders, ...options });
}

/**
 * Database Reset Helper for Test Case Isolation
 */
export async function resetTestDb() {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM sale_items;
    DELETE FROM customer_payments;
    DELETE FROM inventory_movements;
    DELETE FROM sales;
    DELETE FROM products;
    DELETE FROM customers;
    DELETE FROM business_profiles;
    DELETE FROM sqlite_sequence;
  `);
  return db;
}

/**
 * Seeding Helpers for Screen Tests
 */
export async function seedTestProduct(
  overrides?: Partial<Omit<Product, "id" | "created_at" | "updated_at">>
): Promise<Product> {
  return createProduct({
    name: "Lait Milk",
    sku: "MILK-001",
    sale_price_centimes: 12000, // 120 DZD
    cost_price_centimes: 9000,   // 90 DZD
    stock_quantity: 50,
    minimum_stock_quantity: 10,
    category: "Dairy",
    unit: "L",
    is_active: true,
    ...overrides,
  });
}

export async function seedTestCustomer(
  overrides?: Partial<Omit<Customer, "id" | "created_at" | "updated_at">>
): Promise<Customer> {
  return createCustomer({
    name: "Karim Brahimi",
    phone: "0550123456",
    note: "VIP Buyer",
    is_active: true,
    ...overrides,
  });
}

export async function seedTestSale(
  saleInputOverrides?: Partial<{
    customerId?: number;
    paymentMethod: "cash" | "electronic" | "mixed" | "partial" | "credit";
    items: Array<{
      productId: number;
      quantity: number;
      unitSalePriceCentimes: number;
      note?: string;
    }>;
    note?: string;
    discountCentimes?: number;
    amountPaidCentimes?: number;
  }>
): Promise<Sale> {
  const product = await seedTestProduct();
  return createSale({
    paymentMethod: "cash",
    amountPaidCentimes: 24000,
    discountCentimes: 0,
    items: [
      {
        productId: product.id,
        quantity: 2,
        unitSalePriceCentimes: product.sale_price_centimes,
      },
    ],
    ...saleInputOverrides,
  });
}

export async function seedTestBusinessProfile(
  business_name = "Superette El-Amel",
  phone_number = "021334455",
  address = "Alger Centre"
) {
  const existing = await getBusinessProfile();
  if (!existing) {
    return createBusinessProfile({
      business_name,
      owner_name: "Yassine",
      business_type: "grocery",
      currency: "DZD",
      selected_locale: "fr",
      phone_number,
      address,
      rc_number: "123456789",
    });
  }
  return updateBusinessProfile({
    ...existing,
    business_name,
    phone_number,
    address,
  });
}
