/**
 * lowStockNotifier.ts - Push Notification and Web Notification Service for Low Stock Alerts in DukkanPro.
 */

export interface LowStockItem {
  id: string;
  name: string;
  stock_quantity: number;
  minimum_stock_quantity: number;
  unit?: string;
}

const SNOOZE_KEY = "dukkanpro_low_stock_snooze_until";

export function isWebNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermissionStatus(): "granted" | "denied" | "default" | "unsupported" {
  if (!isWebNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (!isWebNotificationSupported()) return "unsupported";
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn("Failed to request notification permission:", err);
    return Notification.permission || "default";
  }
}

export function snoozeNotifications(minutes: number = 60): void {
  if (typeof localStorage === "undefined") return;
  const snoozeUntil = Date.now() + minutes * 60 * 1000;
  localStorage.setItem(SNOOZE_KEY, snoozeUntil.toString());
}

export function isNotificationSnoozed(): boolean {
  if (typeof localStorage === "undefined") return false;
  const snoozeUntilStr = localStorage.getItem(SNOOZE_KEY);
  if (!snoozeUntilStr) return false;
  const snoozeUntil = parseInt(snoozeUntilStr, 10);
  if (isNaN(snoozeUntil)) return false;
  return Date.now() < snoozeUntil;
}

export function clearSnooze(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(SNOOZE_KEY);
}

/**
 * Triggers a browser push notification for low stock products.
 */
export function triggerLowStockPushNotification(products: LowStockItem[]): boolean {
  if (products.length === 0) return false;
  if (isNotificationSnoozed()) return false;
  if (!isWebNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    const count = products.length;
    const topItem = products[0];
    let title = `⚠️ Low Stock Alert - DukkanPro (${count} item${count > 1 ? "s" : ""})`;
    let body = "";

    if (count === 1) {
      body = `"${topItem.name}" has only ${topItem.stock_quantity} left (Min threshold: ${topItem.minimum_stock_quantity}). Please restock!`;
    } else {
      const otherNames = products.slice(0, 3).map((p) => p.name).join(", ");
      body = `${count} products need restock (${otherNames}${count > 3 ? "..." : ""}). Tap to view inventory.`;
    }

    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "dukkanpro-low-stock-alert",
      requireInteraction: false,
    });

    notification.onclick = () => {
      if (typeof window !== "undefined") {
        window.focus();
      }
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn("Could not dispatch web push notification:", err);
    return false;
  }
}
