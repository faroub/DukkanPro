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

// Memory cache & readiness contract
let inMemorySnoozeUntil = 0;
let isSnoozeInitialized = false;
let snoozeInitPromise: Promise<void> | null = null;

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

/**
 * Initializes snooze state from AsyncStorage on app startup.
 */
export async function initSnoozeState(): Promise<void> {
  if (snoozeInitPromise) return snoozeInitPromise;

  snoozeInitPromise = (async () => {
    try {
      const snoozeUntilStr = await AsyncStorage.getItem(SNOOZE_KEY);
      if (snoozeUntilStr) {
        const snoozeUntil = parseInt(snoozeUntilStr, 10);
        if (Number.isFinite(snoozeUntil) && snoozeUntil > Date.now()) {
          inMemorySnoozeUntil = snoozeUntil;
        } else {
          inMemorySnoozeUntil = 0;
          await AsyncStorage.removeItem(SNOOZE_KEY).catch(() => {});
        }
      } else {
        inMemorySnoozeUntil = 0;
      }
    } catch (err) {
      console.warn("Failed to load snooze state from AsyncStorage:", err);
      inMemorySnoozeUntil = 0;
    } finally {
      isSnoozeInitialized = true;
    }
  })();

  return snoozeInitPromise;
}

/** Reset readiness state (for testing isolation) */
export function _resetSnoozeStateForTesting(): void {
  inMemorySnoozeUntil = 0;
  isSnoozeInitialized = false;
  snoozeInitPromise = null;
}

/**
 * Ensure snooze state is initialized before checking notifications.
 */
export async function ensureSnoozeInitialized(): Promise<void> {
  if (!isSnoozeInitialized) {
    await initSnoozeState();
  }
}

/**
 * Snooze low stock notifications for a specified duration in minutes.
 */
export async function snoozeNotifications(minutes: number = 60): Promise<number> {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0 || minutes > 10080) {
    throw new Error(
      `INVALID_SNOOZE_DURATION: minutes must be a positive finite number <= 10080 (7 days), received ${minutes}`,
    );
  }

  const snoozeUntil = Date.now() + minutes * 60 * 1000;
  inMemorySnoozeUntil = snoozeUntil;
  isSnoozeInitialized = true;

  try {
    await AsyncStorage.setItem(SNOOZE_KEY, snoozeUntil.toString());
  } catch (err) {
    console.warn("Failed to persist snooze state:", err);
    throw err;
  }

  return snoozeUntil;
}

export function isNotificationSnoozed(): boolean {
  if (inMemorySnoozeUntil > 0) {
    if (Date.now() < inMemorySnoozeUntil) {
      return true;
    }
    // Expired
    inMemorySnoozeUntil = 0;
    AsyncStorage.removeItem(SNOOZE_KEY).catch(() => {});
  }
  return false;
}

export async function clearSnooze(): Promise<void> {
  inMemorySnoozeUntil = 0;
  isSnoozeInitialized = true;
  try {
    await AsyncStorage.removeItem(SNOOZE_KEY);
  } catch (err) {
    console.warn("Failed to clear snooze from AsyncStorage:", err);
    throw err;
  }
}

// Pre-hydrate snooze state
initSnoozeState();

/**
 * Triggers a push notification for low stock products.
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
