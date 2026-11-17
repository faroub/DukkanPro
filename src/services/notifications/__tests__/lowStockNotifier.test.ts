import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearSnooze,
  ensureSnoozeInitialized,
  getNotificationPermissionStatus,
  initSnoozeState,
  isNotificationSnoozed,
  requestNotificationPermission,
  snoozeNotifications,
  _resetSnoozeStateForTesting,
} from "../lowStockNotifier";

describe("lowStockNotifier service", () => {
  beforeEach(async () => {
    _resetSnoozeStateForTesting();
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe("snooze initialization and readiness contract", () => {
    it("hydrates unexpired snooze state from AsyncStorage during initialization", async () => {
      const futureTime = Date.now() + 3600000;
      await AsyncStorage.setItem("dukkanpro_low_stock_snooze_until", futureTime.toString());

      await initSnoozeState();
      await ensureSnoozeInitialized();

      expect(isNotificationSnoozed()).toBe(true);
    });

    it("clears expired snooze state from AsyncStorage during initialization", async () => {
      const pastTime = Date.now() - 3600000;
      await AsyncStorage.setItem("dukkanpro_low_stock_snooze_until", pastTime.toString());

      await initSnoozeState();
      await ensureSnoozeInitialized();

      expect(isNotificationSnoozed()).toBe(false);
      expect(await AsyncStorage.getItem("dukkanpro_low_stock_snooze_until")).toBeNull();
    });

    it("clears malformed non-numeric snooze state gracefully", async () => {
      await AsyncStorage.setItem("dukkanpro_low_stock_snooze_until", "not_a_number");

      await initSnoozeState();
      await ensureSnoozeInitialized();

      expect(isNotificationSnoozed()).toBe(false);
    });
  });

  describe("snoozeNotifications duration validation", () => {
    it("rejects invalid, zero, or negative snooze durations", async () => {
      await expect(snoozeNotifications(0)).rejects.toThrow("INVALID_SNOOZE_DURATION");
      await expect(snoozeNotifications(-15)).rejects.toThrow("INVALID_SNOOZE_DURATION");
      await expect(snoozeNotifications(NaN)).rejects.toThrow("INVALID_SNOOZE_DURATION");
      await expect(snoozeNotifications(Infinity)).rejects.toThrow("INVALID_SNOOZE_DURATION");
      await expect(snoozeNotifications(20000)).rejects.toThrow("INVALID_SNOOZE_DURATION");
    });

    it("sets memory and AsyncStorage when given valid duration", async () => {
      await snoozeNotifications(30);

      expect(isNotificationSnoozed()).toBe(true);
      const stored = await AsyncStorage.getItem("dukkanpro_low_stock_snooze_until");
      expect(stored).not.toBeNull();
      expect(parseInt(stored!, 10)).toBeGreaterThan(Date.now());
    });
  });

  describe("clearSnooze", () => {
    it("clears snooze state from memory and storage consistently", async () => {
      await snoozeNotifications(60);
      expect(isNotificationSnoozed()).toBe(true);

      await clearSnooze();

      expect(isNotificationSnoozed()).toBe(false);
      expect(await AsyncStorage.getItem("dukkanpro_low_stock_snooze_until")).toBeNull();
    });
  });

  describe("platform permission reporting", () => {
    it("reports granted permission status on native mobile platforms", async () => {
      expect(getNotificationPermissionStatus()).toBe("granted");
      expect(await requestNotificationPermission()).toBe("granted");
    });
  });
});
