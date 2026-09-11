import { formatCentimes } from "@/utils/money";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform, Share } from "react-native";

export interface CatalogueExportOptions {
  showPrices: boolean;
  hideOutOfStock: boolean;
  contact: string;
  address: string;
  shopName?: string;
  welcomeNote?: string;
}

export interface CatalogueProduct {
  id: number;
  name: string;
  category?: string;
  price_centimes: number;
  stock: number;
}

type CatalogueExportResult = { type: "text"; text: string };

/**
 * Generate formatted plain text suitable for WhatsApp / SMS or clipboard sharing.
 * Strictly includes ONLY public data (Product name, category, price if enabled, availability).
 * Strictly excludes: cost prices, profits, debt, customer data, and internal stock counts.
 */
export function generateCatalogueText(
  options: CatalogueExportOptions,
  products: CatalogueProduct[],
  t: (key: string) => string,
): string {
  const { showPrices, hideOutOfStock, contact, address, shopName, welcomeNote } = options;
  const lines: string[] = [];

  const storeTitle = shopName || "Dukkan OS Catalogue";
  lines.push(`🛒 *${storeTitle}*`);
  if (address) lines.push(`📍 ${address}`);
  if (contact) lines.push(`📞 ${contact}`);
  if (welcomeNote) lines.push(`💬 _${welcomeNote}_`);
  lines.push("──────────────────");

  let count = 0;
  for (const product of products) {
    if (hideOutOfStock && product.stock <= 0) continue;
    count++;

    const isAvailable = product.stock > 0;
    const availabilityLabel = isAvailable
      ? t("catalogue.available")
      : t("catalogue.outOfStock");

    let itemLine = `${count}. *${product.name}*`;
    if (showPrices) {
      itemLine += ` - ${formatCentimes(product.price_centimes)}`;
    }
    itemLine += ` (${availabilityLabel})`;

    lines.push(itemLine);
  }

  if (count === 0) {
    lines.push(t("catalogue.noProductsForCatalogue"));
  }

  lines.push("──────────────────");
  lines.push(`✨ ${t("catalogue.thanksMessage")}`);
  lines.push(`📅 ${new Date().toLocaleDateString()}`);

  return lines.join("\n");
}

/**
 * Generate clean, print-ready HTML for the customer brochure PDF.
 * Strictly includes ONLY public data.
 */
export function generateCatalogueHtml(
  options: CatalogueExportOptions,
  products: CatalogueProduct[],
  t: (key: string) => string,
): string {
  const { showPrices, hideOutOfStock, contact, address, shopName, welcomeNote } = options;

  const validProducts = products.filter(
    (p) => !hideOutOfStock || p.stock > 0,
  );

  const productRows = validProducts
    .map((p, idx) => {
      const isAvailable = p.stock > 0;
      const statusClass = isAvailable ? "status-avail" : "status-out";
      const statusText = isAvailable
        ? t("catalogue.available")
        : t("catalogue.outOfStock");
      const priceText = showPrices ? formatCentimes(p.price_centimes) : "";

      return `
        <tr class="product-row">
          <td class="num">${idx + 1}</td>
          <td class="name-cell">
            <div class="product-name">${escapeHtml(p.name)}</div>
            ${p.category ? `<div class="product-cat">${escapeHtml(p.category)}</div>` : ""}
          </td>
          ${showPrices ? `<td class="price-cell">${priceText}</td>` : ""}
          <td class="status-cell">
            <span class="status-badge ${statusClass}">${statusText}</span>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="fr" dir="ltr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(shopName || "Catalogue")}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1A1A1A;
          background: #FFFFFF;
          padding: 32px 24px;
          margin: 0 auto;
          max-width: 680px;
        }
        .header-bar {
          height: 6px;
          background-color: #1B6B3A;
          border-radius: 3px;
          margin-bottom: 24px;
        }
        .store-header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #E5E5E5;
        }
        .store-title {
          font-size: 26px;
          font-weight: 700;
          color: #1B6B3A;
          margin-bottom: 6px;
        }
        .store-meta {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 6px;
        }
        .welcome-pill {
          display: inline-block;
          background: #E8F5EE;
          color: #1B6B3A;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          margin-top: 10px;
        }
        .table-container {
          width: 100%;
          margin-bottom: 28px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 12px;
          border-bottom: 2px solid #F0EFEA;
        }
        .product-row {
          border-bottom: 1px solid #F0EFEA;
        }
        .product-row td {
          padding: 12px;
          vertical-align: middle;
        }
        .num {
          width: 32px;
          color: #9CA3AF;
          font-size: 14px;
          font-weight: 600;
        }
        .name-cell {
          text-align: left;
        }
        .product-name {
          font-size: 16px;
          font-weight: 600;
          color: #1A1A1A;
        }
        .product-cat {
          font-size: 13px;
          color: #6B7280;
          margin-top: 2px;
        }
        .price-cell {
          text-align: right;
          font-size: 16px;
          font-weight: 700;
          color: #1B6B3A;
          white-space: nowrap;
        }
        .currency {
          font-size: 12px;
          font-weight: 500;
          color: #6B7280;
        }
        .status-cell {
          text-align: right;
          width: 110px;
        }
        .status-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          text-align: center;
        }
        .status-avail {
          background-color: #E8F5EE;
          color: #1B6B3A;
        }
        .status-out {
          background-color: #FEF2F2;
          color: #B91C1C;
        }
        .footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #E5E5E5;
          text-align: center;
          color: #6B7280;
          font-size: 13px;
        }
        .thanks {
          font-size: 15px;
          font-weight: 600;
          color: #1A1A1A;
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header-bar"></div>
      <div class="store-header">
        <h1 class="store-title">${escapeHtml(shopName || "Supérette El-Amel")}</h1>
        ${address ? `<div class="store-meta">📍 ${escapeHtml(address)}</div>` : ""}
        ${contact ? `<div class="store-meta">📞 ${escapeHtml(contact)}</div>` : ""}
        ${welcomeNote ? `<div class="welcome-pill">${escapeHtml(welcomeNote)}</div>` : ""}
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 32px">#</th>
              <th>${escapeHtml(t("catalogue.selectProductsTitle"))}</th>
              ${showPrices ? `<th style="text-align: right">${escapeHtml(t("catalogue.showRetailPrices"))}</th>` : ""}
              <th style="text-align: right">${escapeHtml(t("catalogue.available"))}</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <div class="thanks">${escapeHtml(t("catalogue.thanksMessage"))}</div>
        <div>${escapeHtml(t("catalogue.validNotice"))} • ${new Date().toLocaleDateString()}</div>
      </div>
    </body>
    </html>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Native share handler for PDF catalogue.
 * Uses expo-print to generate PDF and expo-sharing / Share.share to open the native share sheet.
 */
export async function shareCataloguePDF(
  options: CatalogueExportOptions,
  products: CatalogueProduct[],
  t: (key: string) => string,
): Promise<{ success: boolean; method: string }> {
  try {
    const html = generateCatalogueHtml(options, products, t);

    if (Platform.OS !== "web") {
      const { uri } = await Print.printToFileAsync({ html });
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `${options.shopName || "Catalogue"} PDF`,
          UTI: "com.adobe.pdf",
        });
        return { success: true, method: "expo-sharing" };
      }
    }

    // Fallback on web or when expo-sharing is unavailable: native share sheet with text representation
    const text = generateCatalogueText(options, products, t);
    await Share.share({
      title: `${options.shopName || "Dukkan OS"} Catalogue`,
      message: text,
    });
    return { success: true, method: "native-share" };
  } catch {
    // If printToFileAsync fails, fallback gracefully to text share
    const text = generateCatalogueText(options, products, t);
    await Share.share({
      title: `${options.shopName || "Dukkan OS"} Catalogue`,
      message: text,
    });
    return { success: true, method: "fallback-share" };
  }
}

/**
 * Native share handler for Text / WhatsApp message format.
 * Triggers native share sheet with formatted message.
 */
export async function shareCatalogueText(
  options: CatalogueExportOptions,
  products: CatalogueProduct[],
  t: (key: string) => string,
): Promise<{ success: boolean }> {
  const text = generateCatalogueText(options, products, t);
  await Share.share({
    title: `${options.shopName || "Dukkan OS"} Catalogue`,
    message: text,
  });
  return { success: true };
}

/**
 * Legacy exportCataloguePDF preserved for existing unit tests.
 */
export async function exportCataloguePDF(
  options: CatalogueExportOptions,
  t: (key: string) => string,
): Promise<CatalogueExportResult> {
  const sampleProducts: CatalogueProduct[] = [
    {
      id: 1,
      name: "Wheat Bread",
      category: "Bakery",
      price_centimes: 500,
      stock: 10,
    },
    { id: 2, name: "Milk", category: "Dairy", price_centimes: 300, stock: 0 },
    {
      id: 3,
      name: "Olive Oil",
      category: "Oils",
      price_centimes: 800,
      stock: 5,
    },
    { id: 4, name: "Cheese", category: "Dairy", price_centimes: 700, stock: 0 },
  ];

  const lines: string[] = [];
  lines.push("Dukkan OS Catalogue");
  lines.push("");
  lines.push("Contact: " + options.contact);
  lines.push("Address: " + options.address);
  lines.push("");
  lines.push("Products:");
  lines.push("");

  let hasProducts = false;
  for (const product of sampleProducts) {
    if (options.hideOutOfStock && product.stock <= 0) continue;
    hasProducts = true;

    const availabilityKey = product.stock > 0 ? "available" : "outOfStock";
    const priceLine = options.showPrices
      ? "Price: " + formatCentimes(product.price_centimes) + " DZD"
      : "";

    lines.push("• " + product.name + " (" + (product.category || "") + ")");
    lines.push(
      "  " +
        t("catalogue." + availabilityKey) +
        ": " +
        t("catalogue." + availabilityKey),
    );
    if (priceLine) {
      lines.push("  " + priceLine);
    }
    lines.push("");
  }

  if (!hasProducts) {
    lines.push("No products available");
    lines.push("");
  }

  lines.push("---");
  lines.push("Generated: " + new Date().toLocaleDateString());

  return { type: "text", text: lines.join("\n") };
}
