/**
 * common.ts — Common TypeScript types used across the Dukkan OS codebase.
 *
 * - ID — numeric primary-key type, alias for number
 * - Result — success/failure outcome of an operation
 * - PaginatedResult — paginated query response wrapper
 */

// ---------------------------------------------------------------------------
// ID — numeric identifier used as primary key across all tables.
// ---------------------------------------------------------------------------
export type ID = number;

// ---------------------------------------------------------------------------
// Result — outcome of an async operation; carries data or error information.
// ---------------------------------------------------------------------------
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Overload: create a success-only result helper type (optional)
export const ok = <T>(data: T): Result<T, Error> => ({ success: true, data });
export const err = <E extends Error>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// ---------------------------------------------------------------------------
// PaginatedResult — wrapper for list queries that return a page of items
// along with pagination metadata (hasMore, nextCursor, totalCount).
// ---------------------------------------------------------------------------
export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Common utility types
// ---------------------------------------------------------------------------
export const enum PaymentMethod {
  Cash = "cash",
  Electronic = "electronic",
  Mixed = "mixed",
  Partial = "partial",
  Credit = "credit",
}

// export const enum MovementType {
//   In = "in",
//   Out = "out",
//   Adjustment = "adjustment",
// }
