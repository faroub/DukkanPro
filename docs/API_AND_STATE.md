# DukkanOS API & State Guide
## Customer Balance Service (`customerBalanceService`)

**Exported Functions:**

### `getCustomerDebt(customerId: number): Promise<number>`

Retrieves the customer's current debt calculated from completed sales minus recorded payments.

- Debt = sum of valid unpaid sale balances (remaining_balance_centimes from completed sales) minus total payments
- Cancelled and returned sales are explicitly excluded from the calculation
- Debt cannot be negative (overpayment is blocked in MVP)
- Returns debt in centimes (integer)

```typescript
export async function getCustomerDebt(customerId: number): Promise<number>
```

### `getCustomerPayments(customerId: number): Promise<CustomerPayment[]>`

Retrieves all recorded payments for a customer.

```typescript
export async function getCustomerPayments(customerId: number): Promise<CustomerPayment[]>
```

### `canRecordPayment(customerId: number, amount: number): Promise<boolean>`

Checks if a payment can be recorded for a customer without blocking overpayment.

- Returns `false` if amount <= 0
- Returns `true` if amount <= current customer debt
- Returns `false` if amount > current customer debt (overpayment blocked)

```typescript
export async function canRecordPayment(customerId: number, amount: number): Promise<boolean>
```

### `recordPayment(customerId: number, amount: number, method: "cash" | "electronic", note?: string): Promise<CustomerPayment | null>`

Records a payment for a customer in a single SQLite transaction.

- Amount must be positive (enforced by `canRecordPayment` check)
- Payment method: cash or electronic (MVP)
- Note is optional
- Confirmation is handled by the caller
- Blocks overpayment in MVP
- Returns the recorded `CustomerPayment` on success, or `null` if payment was blocked

```typescript
export async function recordPayment(
  customerId: number,
  amount: number,
  method: "cash" | "electronic",
  note?: string,
): Promise<CustomerPayment | null>
```

### `getCustomerBalanceSummary(customerId: number): Promise<BalanceSummary>`

Gets a summary of a customer's financial status.

```typescript
export async function getCustomerBalanceSummary(customerId: number) {
  const debt = await getCustomerDebt(customerId);
  const payments = await getCustomerPayments(customerId);

  return {
    customerId,
    debt_centimes: debt,
    total_paid_centime: payments.reduce(
      (sum, p) => sum + p.amount_centimes,
      0,
    ),
    paymentCount: payments.length,
  };
}
```

**Interface:**

```typescript
interface CustomerPayment {
  id: number;
  customer_id: number;
  amount_centimes: number;
  payment_method: "cash" | "electronic" | "mixed" | "partial" | "credit";
  note: string | null;
  paid_at: string;
  created_at: string;
}

interface BalanceSummary {
  customerId: number;
  debt_centimes: number;
  total_paid_centime: number;
  paymentCount: number;
}
```

**Mocked in tests:** `jest.mock("@/database/database")`

## API Surface Summary

| Category | Key Exports |
|---|---|
| **Hooks** | `useProducts`, `useCustomers`, `useDashboard`, `useOnboarding`, `useTheme`, `useColorScheme`, `useDebounce` |
| **Providers** | `LocaleProvider`, `AppThemeProvider` |
| **Services** | `customerBalanceService` |
| **Utils** | `formatCentimes`, `parseCentimes`, `formatDate`, `formatRelativeDate`, `getTextAlignment`, `getWritingDirection`, `truncateText`, `toArabicIndicDigits`, `toLatinDigits`, `containsArabic`, `containsRTL`, `textStyle` |
| **Repositories** | `productRepository`, `customerRepository`, `saleRepository`, `inventoryRepository`, `businessProfileRepository`, `exportRepository` |
| **Types** | `ProductsFilters`, `ProductListItem`, `UseThemeReturn` |
| **Constants** | `CENTIMES_PER_DINAR` from `src/constants/theme.ts` |
