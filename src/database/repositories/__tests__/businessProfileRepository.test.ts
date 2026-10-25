/**
 * businessProfileRepository.test.ts — Unit tests for businessProfileRepository.
 *
 - Tests use the application's SQLite database (opened via getDatabase()).
 - Each test runs against a fresh in-memory-ish database path; see the project's
   test setup for details.
 - All assertions are on the return values of the repository methods.
 */

import { BusinessProfile } from "../../../types/entities";
import { getDatabase } from "../../database";
import { create, get, update } from "../businessProfileRepository";

let db: any;

beforeAll(async () => {
  db = await getDatabase();
});

describe("businessProfileRepository", () => {
  beforeEach(async () => {
    await db.execAsync(`
      DELETE FROM business_profiles;
      DELETE FROM sqlite_sequence WHERE name = 'business_profiles';
    `);
  });

  describe("get()", () => {
    it("returns null when no profile exists", async () => {
      const profile = await get();
      expect(profile).toBeNull();
    });

    it("returns the existing profile after create", async () => {
      // Create a profile first.
      await create({
        business_name: "Test Grocery",
        owner_name: "Test Owner",
        business_type: "grocery",
        currency: "DZD",
        selected_locale: "fr",
      });
      const profile = await get();
      expect(profile).not.toBeNull();
      expect(profile?.business_name).toBe("Test Grocery");
      expect(profile?.owner_name).toBe("Test Owner");
    });

    it("is idempotent — returning the same profile on repeated calls", async () => {
      await create({
        business_name: "Idempotent Test",
        owner_name: "I.T.",
        business_type: "grocery",
        currency: "DZD",
        selected_locale: "ar",
      });
      const p1 = await get();
      const p2 = await get();
      expect(p1?.business_name).toBe(p2?.business_name);
      expect(p1?.id).toBe(p2?.id);
    });
  });

  describe("create()", () => {
    it("creates a new profile and returns it", async () => {
      const newProfile: Parameters<typeof create>[0] = {
        business_name: "New Test Shop",
        owner_name: "Tester",
        business_type: "baker",
        currency: "DZD",
        selected_locale: "en",
      };
      const created = await create(newProfile);
      expect(created).not.toBeNull();
      expect(created?.business_name).toBe("New Test Shop");
      expect(created?.business_type).toBe("baker");
    });

    it("is idempotent — re-creating the same profile returns the existing one", async () => {
      // Call create twice with the same data.
      const p1 = await create({
        business_name: "Idempotent Shop",
        owner_name: "I.S.",
        business_type: "market_vendor",
        currency: "DZD",
        selected_locale: "fr",
      });
      const p2 = await create({
        business_name: "Idempotent Shop",
        owner_name: "I.S.",
        business_type: "market_vendor",
        currency: "DZD",
        selected_locale: "fr",
      });
      expect(p1?.id).toBe(p2?.id);
      expect(p1?.business_name).toBe(p2?.business_name);
    });
  });

  describe("update()", () => {
    it("updates the profile fields", async () => {
      await create({
        business_name: "Before Update",
        owner_name: "Old Owner",
        business_type: "grocery",
        currency: "DZD",
        selected_locale: "fr",
      });
      const updated = await update({
        id: 1, // will be resolved by get() after create
        business_name: "After Update",
        owner_name: "New Owner",
        business_type: "service_seller",
        currency: "DZD",
        selected_locale: "en",
      });
      expect(updated?.business_name).toBe("After Update");
      expect(updated?.owner_name).toBe("New Owner");
      expect(updated?.business_type).toBe("service_seller");
      expect(updated?.selected_locale).toBe("en");
    });

    it("rejects currency changes if sales or payments exist", async () => {
      const profile = await create({
        business_name: "Currency Lock Test",
        owner_name: "Owner",
        business_type: "grocery",
        currency: "DZD",
        selected_locale: "fr",
      });

      // Insert a sale row
      await db.runAsync(
        `INSERT INTO sales (customer_id, status, subtotal_centimes, discount_centimes, total_centimes,
                            amount_paid_centimes, remaining_balance_centimes, payment_method, currency, sold_at)
         VALUES (NULL, 'completed', 1000, 0, 1000, 1000, 0, 'cash', 'DZD', datetime('now'))`
      );

      // Updating non-currency fields should succeed
      const nameUpdated = await update({
        ...profile,
        business_name: "New Name DZD",
      });
      expect(nameUpdated.business_name).toBe("New Name DZD");

      // Updating currency should throw CURRENCY_LOCKED
      await expect(
        update({
          ...profile,
          currency: "EUR",
        })
      ).rejects.toThrow(/CURRENCY_LOCKED/);
    });
  });
});
