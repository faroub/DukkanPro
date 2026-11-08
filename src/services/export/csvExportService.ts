/**
 * csvExportService — CSV export functionality for DukkanPro.
 *
 * - All CSV headers are translated using the selected i18n locale.
 * - Money is stored as integer centimes and exported as decimal main
 *   units via formatCentimesToInputDzd; amount headers are labeled with
 *   the active store currency (e.g. "Amount (DZD)").
 * - No cost prices, profit margins, or internal stock quantities in
 *   customer-facing exports.
 * - Formula injection characters are neutralized on text fields only: =, @,
 *   TAB and CR unconditionally, and a leading + or - only when followed by a
 *   letter, so numeric values such as a quantity of -3 and phone numbers like
 *   +213555123456 export unchanged.
 * - Uses expo-file-system for writing and expo-sharing for sharing.
 */

import { useTranslation } from "react-i18next";
import { formatCentimesToInputDzd, getActiveStoreCurrency } from "@/utils/money";

/**
 * Build a CSV row from an array of string values.
 */
function buildCsvRow(values: string[]): string {
  return values.map((v) => `"${v}"`).join(",");
}

/**
 * Escape a string for safe CSV embedding and neutralize formula injection.
 *
 * Neutralized unconditionally: =, @, TAB, CR. A leading + or - is neutralized
 * only when followed by a letter (e.g. "-memo"), so numeric values such as a
 * quantity of -3 stay unchanged.
 */
function csvSafe(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (/^[=@\t\r]/.test(escaped) || /^[-+][A-Za-z]/.test(escaped)) {
    return `'${escaped}`;
  }
  return escaped;
}

/**
 * Escape quotes only, without formula neutralization — used for the phone
 * column, whose legitimate values begin with + (e.g. +213555123456) and must
 * be exported unchanged.
 */
function csvSafePhone(value: string): string {
  return value.replace(/"/g, '""');
}

/**
 * Generate CSV for products.
 */
export function exportProducts(products: any[], t: ReturnType<typeof useTranslation>["t"]): string {
  const currency = getActiveStoreCurrency();
  const header = [
    t("products.id"),
    t("products.name"),
    t("products.sku"),
    t("products.category"),
    `${t("products.salePrice")} (${currency})`,
    t("products.unit"),
  ];

  const rows: string[] = [buildCsvRow(header)];

  for (const product of products) {
    const row = [
      product.id.toString(),
      csvSafe(product.name || ""),
      csvSafe(product.sku || ""),
      csvSafe(product.category || ""),
      formatCentimesToInputDzd(product.sale_price_centimes),
      csvSafe(product.unit || ""),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}

/**
 * Generate CSV for customers.
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
      customer.id.toString(),
      csvSafe(customer.name || ""),
      csvSafePhone(customer.phone || ""),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}

/**
 * Generate CSV for sales.
 */
export function exportSales(sales: any[], t: ReturnType<typeof useTranslation>["t"]): string {
  const currency = getActiveStoreCurrency();
  const header = [
    t("sales.sale_id"),
    t("sales.date"),
    t("sales.customer"),
    t("sales.payment_method"),
    `${t("sales.subtotal")} (${currency})`,
    `${t("sales.total")} (${currency})`,
    t("sales.currency"),
    t("sales.status"),
  ];

  const rows: string[] = [buildCsvRow(header)];

  for (const sale of sales) {
    const customerName = sale.customer_name || t("sales.unknown_client");
    const row = [
      sale.id.toString(),
      sale.sold_at ? sale.sold_at.slice(0, 10) : t("common:unknown"),
      csvSafe(customerName),
      csvSafe(t(`payment_method.${sale.payment_method}`)),
      formatCentimesToInputDzd(sale.subtotal_centimes),
      formatCentimesToInputDzd(sale.total_centimes),
      sale.currency || "DZD",
      csvSafe(t(`status.${sale.status}`)),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}

/**
 * Generate CSV for sale items.
 */
export function exportSaleItems(saleItems: any[], t: ReturnType<typeof useTranslation>["t"]): string {
  const currency = getActiveStoreCurrency();
  const header = [
    t("saleItems.id"),
    t("saleItems.productName"),
    t("saleItems.quantity"),
    `${t("saleItems.unitPrice")} (${currency})`,
    `${t("saleItems.lineTotal")} (${currency})`,
  ];

  const rows: string[] = [buildCsvRow(header)];

  for (const item of saleItems) {
    const row = [
      item.id.toString(),
      csvSafe(item.product_name_snapshot || t("common:unknown")),
      item.quantity.toString(),
      formatCentimesToInputDzd(item.unit_sale_price_centimes),
      formatCentimesToInputDzd(item.line_total_centimes),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}

/**
 * Generate CSV for customer payments.
 */
export function exportPayments(payments: any[], t: ReturnType<typeof useTranslation>["t"]): string {
  const currency = getActiveStoreCurrency();
  const header = [
    t("payments.id"),
    `${t("payments.amount")} (${currency})`,
    t("payments.currency"),
    t("payments.payment_method"),
    t("payments.date"),
  ];

  const rows: string[] = [buildCsvRow(header)];

  for (const payment of payments) {
    const row = [
      payment.id.toString(),
      formatCentimesToInputDzd(payment.amount_centimes),
      payment.currency || "DZD",
      csvSafe(t(`payment_method.${payment.payment_method}`)),
      payment.paid_at ? payment.paid_at.slice(0, 10) : t("common:unknown"),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}

/**
 * Generate CSV for inventory movements.
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
      movement.id.toString(),
      csvSafe(productRef),
      csvSafe(t(`movementType.${movement.movement_type}`)),
      movement.quantity_change.toString(),
      csvSafe(movement.note || ""),
      movement.created_at ? movement.created_at.slice(0, 10) : t("common:unknown"),
    ];
    rows.push(buildCsvRow(row));
  }

  return rows.join("\n");
}
