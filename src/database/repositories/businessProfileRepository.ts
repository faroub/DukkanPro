/**
 * businessProfileRepository — Repository for business_profiles table.
 *
 - Uses prepared statements via db.runSync / db.getAllSync / db.getFirstSync.
 - Archive (soft-delete) sets is_active = false; financial records are never physically deleted.
 - All methods are synchronous (returning promises for Expo SQLite compatibility).
 */

import { BusinessProfile } from "../../types/entities";
import { executeAll, executeWrite } from "../database";

export type BusinessProfileFilters = {
  is_active?: boolean;
};

export type BusinessProfileResult = {
  profile: BusinessProfile | null;
  error?: string;
};

type BusinessProfileInput = Omit<
  BusinessProfile,
  "id" | "created_at" | "updated_at" | "phone_number" | "address" | "rc_number"
> & {
  phone_number?: string | null;
  address?: string | null;
  rc_number?: string | null;
};
type BusinessProfileUpdate = Omit<
  BusinessProfile,
  "created_at" | "updated_at" | "phone_number" | "address" | "rc_number"
> & {
  phone_number?: string | null;
  address?: string | null;
  rc_number?: string | null;
};

/**
 - Retrieve the first (or only) business profile.
 - Returns null if none exists (supports idempotent creation workflow).
 */
export async function get(): Promise<BusinessProfile | null> {
  const rows: any[] = await executeAll(
    // No WHERE clause — we expect at most one row.
    `SELECT id, business_name, owner_name, business_type, currency,
     selected_locale, phone_number, address, rc_number, created_at, updated_at
     FROM business_profiles`,
  );
  if (rows.length === 0) {
    return null;
  }
  // Return the first (and only) row, mapped to the interface.
  const r = rows[0];
  return {
    id: r.id,
    business_name: r.business_name,
    owner_name: r.owner_name,
    business_type: r.business_type,
    currency: r.currency,
    selected_locale: r.selected_locale as "ar" | "fr" | "en",
    phone_number: r.phone_number,
    address: r.address,
    rc_number: r.rc_number,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/**
 - Create a new business profile.
 - If a profile already exists, the existing one is returned (idempotent).
 - The profile is not deleted or overridden if it already has data.
 */
export async function create(
  profile: BusinessProfileInput,
): Promise<BusinessProfile> {
  // Check if a profile already exists.
  const existing: BusinessProfile | null = await get();
  if (existing) {
    // Already has one — return it (idempotent).
    return existing;
  }

  const result = await executeWrite(
    // language=SQLite
    `INSERT INTO business_profiles
     (business_name, owner_name, business_type, currency, selected_locale,
      phone_number, address, rc_number, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      profile.business_name,
      profile.owner_name,
      profile.business_type,
      profile.currency,
      profile.selected_locale,
      profile.phone_number ?? null,
      profile.address ?? null,
      profile.rc_number ?? null,
    ],
  );

  // Re-fetch the newly inserted row.
  const created = await get();
  if (!created) throw new Error("Business profile was not created");
  return created;
}

/**
 - Update an existing business profile.
 - Only the provided fields are updated; id, created_at remain unchanged.
 */
export async function update(
  profile: BusinessProfileUpdate,
): Promise<BusinessProfile> {
  await executeWrite(
    // language=SQLite
    `UPDATE business_profiles
     SET business_name = ?,
         owner_name = ?,
         business_type = ?,
         currency = ?,
         selected_locale = ?,
         phone_number = ?,
         address = ?,
         rc_number = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [
      profile.business_name,
      profile.owner_name,
      profile.business_type,
      profile.currency,
      profile.selected_locale,
      profile.phone_number ?? null,
      profile.address ?? null,
      profile.rc_number ?? null,
      profile.id,
    ],
  );
  const updated = await get();
  if (!updated) throw new Error("Business profile was not updated");
  return updated;
}
