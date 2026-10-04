# Dukkan OS — API & State Guide

## Customer Balance Service (`customerBalanceService`)

**Exported Functions:**

### `getCustomerDebt(customerId: number): Promise<number>`
Retrieves the customer's current debt calculated from completed sales minus recorded payments.
- Debt = sum of valid unpaid sale balances (`remaining_balance_centimes` from completed sales) minus total payments
- Cancelled and returned sales are explicitly excluded
- Returns debt in centimes (integer)

### `getCustomerPayments(customerId: number): Promise<CustomerPayment[]>`
Retrieves all recorded payments for a customer.

### `canRecordPayment(customerId: number, amount: number): Promise<boolean>`
Checks if a payment can be recorded for a customer without overpayment.
- Returns `false` if amount <= 0
- Returns `true` if amount <= current customer debt
- Returns `false` if amount > current customer debt (overpayment blocked)

### `recordPayment(customerId: number, amount: number, method: "cash" | "electronic", note?: string): Promise<CustomerPayment | null>`
Records a payment for a customer in a single SQLite transaction.

---

## Money & Multi-Currency API (`src/utils/money.ts`)

### `formatCentimes(centimes: number, localeInput?: string, currencyInput?: string): string`
Formats an integer centimes value to currency display string.
- Defaults to the active store currency (`activeStoreCurrency` cached in `money.ts`).
- Supports `"DZD"`, `"EUR"`, and `"USD"`.

### `getCurrencySymbol(currency?: string, locale?: string): string`
Returns the display symbol/suffix for the specified or active currency (`DZD` / `د.ج`, `€`, `$`).

### `setActiveStoreCurrency(currency: string): void`
Sets the global active store currency used as the default for `formatCentimes`.

### `getActiveStoreCurrency(): CurrencyCode`
Gets the current active store currency code (`"DZD"` | `"EUR"` | `"USD"`).

---

## Dashboard Hook (`useDashboard`)

```typescript
export interface DashboardData {
  greeting: string;
  todayDate: string;
  todayLocale: "ar" | "fr" | "en";
  currencyCode: string;

  todayRevenue_centimes: number;
  todayProfit_centimes: number;
  toCollect_centimes: number;

  totalProductsCount: number;
  totalSalesCount: number;
  hasProductsOrSales: boolean;

  lowStockCount: number;
  recentSales: any[];
  lowStockProducts: any[];
  sevenDaySales?: { date: string; total: number }[];
}

export interface DashboardResult extends DashboardData {
  refetch: () => Promise<void>;
}
```

- Re-queries SQLite on component mount and on screen focus via `useFocusEffect`.
- `hasProductsOrSales` determines whether the live `DashboardScreen` or `EmptyDashboardScreen` is displayed.

---

## API Surface Summary

| Category | Key Exports |
|---|---|
| **Hooks** | `useProducts`, `useCustomers`, `useDashboard`, `useOnboarding`, `useTheme`, `useColorScheme`, `useDebounce` |
| **Providers** | `LocaleProvider`, `AppThemeProvider` |
| **Services** | `customerBalanceService`, `catalogueService`, `csvExportService`, `lowStockNotifier` |
| **Utils** | `formatCentimes`, `parseCentimes`, `getCurrencySymbol`, `setActiveStoreCurrency`, `getActiveStoreCurrency`, `formatDate`, `getTextAlignment` |
| **Repositories** | `productRepository`, `customerRepository`, `saleRepository`, `businessProfileRepository`, `dashboardRepository`, `exportRepository`, `resetRepository` |
| **Types** | `Product`, `Sale`, `SaleItem`, `Customer`, `BusinessProfile` |
