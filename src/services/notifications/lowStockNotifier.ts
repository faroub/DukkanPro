/**
 * lowStockNotifier.ts - Cross-Platform Low Stock Alert & Notification Service for DukkanPro.
 * Supports Android, iOS, and Web via AsyncStorage and safe Web Notification checks.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface LowStockItem {
  id: string | number;
  name: string;
  stock_quantity: number;
  minimum_stock_quantity: number;
  unit?: string;
}

const SNOOZE_KEY = "dukkanpro_low_stock_snooze_until";

// Memory cache for synchronous checks
let inMemorySnoozeUntil = 0;

export function isWebNotificationSupported(): boolean {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof Notification !== "undefined"
  );
}

export function getNotificationPermissionStatus():
  | "granted"
  | "denied"
  | "default"
  | "unsupported" {
  if (Platform.OS !== "web") {
    // On native mobile, in-app alerts are active by default
    return "granted";
  }
  if (!isWebNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<
  "granted" | "denied" | "default" | "unsupported"
> {
  if (Platform.OS !== "web") {
    return "granted";
  }
  if (!isWebNotificationSupported()) {
    return "unsupported";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn("Failed to request notification permission:", err);
    return typeof Notification !== "undefined" ? Notification.permission : "default";
  }
}

export function snoozeNotifications(minutes: number = 60): void {
  const snoozeUntil = Date.now() + minutes * 60 * 1000;
  inMemorySnoozeUntil = snoozeUntil;
  AsyncStorage.setItem(SNOOZE_KEY, snoozeUntil.toString()).catch(() => {});
}

export function isNotificationSnoozed(): boolean {
  if (inMemorySnoozeUntil > 0 && Date.now() < inMemorySnoozeUntil) {
    return true;
  }
  return false;
}

export function clearSnooze(): void {
  inMemorySnoozeUntil = 0;
  AsyncStorage.removeItem(SNOOZE_KEY).catch(() => {});
}

/**
 * Initializes snooze state from AsyncStorage on app startup.
 */
export async function initSnoozeState(): Promise<void> {
  try {
    const snoozeUntilStr = await AsyncStorage.getItem(SNOOZE_KEY);
    if (snoozeUntilStr) {
      const snoozeUntil = parseInt(snoozeUntilStr, 10);
      if (!isNaN(snoozeUntil)) {
        inMemorySnoozeUntil = snoozeUntil;
      }
    }
  } catch (_e) {
    // Ignore storage read issues
  }
}

// Pre-hydrate snooze state
initSnoozeState();

/**
 * Triggers a push notification for low stock products (Web Notification API on Web, in-app on Native).
 */
export function triggerLowStockPushNotification(
  products: LowStockItem[],
): boolean {
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
