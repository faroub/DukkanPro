/**
 * csvExportService — CSV export functionality for Dukkan OS.
 *
 - All CSV headers are translated using the selected i18n locale.
 - Money values are stored and exported as integer centimes.
 - No cost prices, profit margins, or internal stock quantities in
   customer-facing exports.
 - Uses expo-file-system for writing and expo-sharing for sharing.
 */

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useTranslation } from "react-i18next";

/**
 - Convert a number to integer centimes string (no decimals).
 */
function formatCentimes(value: number): string {
  return Math.round(value).toString();
}

/**
 - Build a CSV row from an array of string values.
 */
function buildCsvRow(values: string[]): string {
  return values.map((v) => `"${v}"`).join(",");
}

/**
 - Escape and quote a string for safe CSV embedding.
 */
function csvSafe(value: string): string {
  // If the value contains a comma, newline, or double quote, we need to quote it
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 - Generate CSV for products.
 - Fields: id, name, sku, category, sale price (DZD), unit.
 - Excludes: cost_price_centimes, stock_quantity (internal data).
 */
export function exportProducts(products: any[], t: ReturnType<typeof useTranslation>["t"]): string {
  const header = [
    t("products.id"),
    t("products.name"),
    t("products.sku"),
    t("products.category"),
    t("products.salePrice"),
    t("products.unit"),
  ];

  const rows: string[] = [buildCsvRow(header)];

  for (const product of products) {
    const row = [
      csvSafe(product.id.toString()),
      csvSafe(product.name || ""),
      csvSafe(product.sku || ""),
      csvSafe(product.category || ""),
      csvSafe(formatCentimes(product.sale_price_centimes)),
      csvSafe(product.unit || ""),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}

/**
 - Generate CSV for customers.
 - Fields: id, name, phone.
 - Excludes: debt, cost prices, notes (customer-facing data only).
 */
export function exportCustomers(customers: any[], t: ReturnType<typeof useTranslation>["t"]): string {
  const header = [
    t("customers.id"),
    t("customers.name"),
    t("customers.phone"),
  ];

  const rows: string[] = [buildCsvRow(header)];

  for (const customer of customers) {
    const row = [
      csvSafe(customer.id.toString()),
      csvSafe(customer.name || ""),
      csvSafe(customer.phone || ""),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}

/**
 - Generate CSV for sales.
 - Fields: id, date, customer, payment method, subtotal, total, status.
 - Excludes: cost prices, profit margins, internal balances.
 */
export function exportSales(sales: any[], t: ReturnType<typeof useTranslation>["t"]): string {
  const header = [
    t("sales.sale_id"),
    t("sales.date"),
    t("sales.customer"),
    t("sales.payment_method"),
    t("sales.subtotal"),
    t("sales.total"),
    t("sales.status"),
  ];

  const rows: string[] = [buildCsvRow(header)];

  for (const sale of sales) {
    const customerName = sale.customer_id ? `Customer ${sale.customer_id}` : t("sales.unknown_client");
    const row = [
      csvSafe(sale.id.toString()),
      csvSafe(sale.sold_at ? sale.sold_at.split("T")[0] : t("common:unknown")),
      csvSafe(customerName),
      csvSafe(t(`payment_method.${sale.payment_method}` || sale.payment_method)),
      csvSafe(formatCentimes(sale.subtotal_centimes)),
      csvSafe(formatCentimes(sale.total_centimes)),
      csvSafe(t(`status.${sale.status}` || sale.status)),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}

/**
 - Generate CSV for sale items.
 - Fields: id, product name, quantity, unit price, line total.
 - Excludes: unit cost price (historical cost not for customer-facing export).
 */
export function exportSaleItems(saleItems: any[], t: ReturnType<typeof useTranslation>["t"]): string {
  const header = [
    t("saleItems.id"),
    t("saleItems.productName"),
    t("saleItems.quantity"),
    t("saleItems.unitPrice"),
    t("saleItems.lineTotal"),
  ];

  const rows: string[] = [buildCsvRow(header)];

  for (const item of saleItems) {
    const row = [
      csvSafe(item.id.toString()),
      csvSafe(item.product_name_snapshot || t("common:unknown")),
      csvSafe(item.quantity.toString()),
      csvSafe(formatCentimes(item.unit_sale_price_centimes)),
      csvSafe(formatCentimes(item.line_total_centimes)),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}

/**
 - Generate CSV for customer payments.
 - Fields: id, amount, payment method, date.
 */
export function exportPayments(payments: any[], t: ReturnType<typeof useTranslation>["t"]): string {
  const header = [
    t("payments.id"),
    t("payments.amount"),
    t("payments.payment_method"),
    t("payments.date"),
  ];

  const rows: string[] = [buildCsvRow(header)];

  for (const payment of payments) {
    const row = [
      csvSafe(payment.id.toString()),
      csvSafe(formatCentimes(payment.amount_centimes)),
      csvSafe(t(`payment_method.${payment.payment_method}` || payment.payment_method)),
      csvSafe(payment.paid_at ? payment.paid_at.split("T")[0] : t("common:unknown")),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}

/**
 - Generate CSV for inventory movements.
 - Fields: id, product, movement type, quantity, note, date.
 - Excludes: internal product cost, stock levels.
 */
export function exportInventoryMovements(movements: any[], t: ReturnType<typeof useTranslation>["t"]): string {
  const header = [
    t("inventoryMovements.id"),
    t("inventoryMovements.product"),
    t("inventoryMovements.movementType"),
    t("inventoryMovements.quantity"),
    t("inventoryMovements.note"),
    t("inventoryMovements.date"),
  ];

  const rows: string[] = [buildCsvRow(header)];

  for (const movement of movements) {
    const productRef = movement.product_id ? `Product ${movement.product_id}` : t("common:unknown");
    const row = [
      csvSafe(movement.id.toString()),
      csvSafe(productRef),
      csvSafe(t(`movementType.${movement.movement_type}` || movement.movement_type)),
      csvSafe(movement.quantity_change.toString()),
      csvSafe(movement.note || ""),
      csvSafe(movement.created_at ? movement.created_at.split("T")[0] : t("common:unknown")),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}