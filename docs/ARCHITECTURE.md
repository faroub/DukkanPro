# DukkanPro Application Architecture

DukkanPro is an offline-first React Native app (Expo SDK 57) for small-business
inventory, sales, customers, and payments. All business data lives in a local
SQLite database (`DukkanPro.db`); there is no cloud backend.

The codebase is organized by **feature**, with thin Expo Router files that only
render feature screens, and a shared set of UI, data, and service layers.

---

## Folder Structure

```
src/
├── app/              # Expo Router routes (thin wrappers around feature screens)
├── components/       # Shared UI primitives and cross-feature components
├── constants/        # Theme palette (light/dark) and layout dimensions
├── database/         # SQLite singleton, schema, migrations, repositories
├── features/         # Feature modules: screens + their local components
├── hooks/            # Reusable hooks (data, layout, theme)
├── localization/     # i18n setup and locale helpers
├── locales/          # ar / fr / en translation bundles
├── providers/        # Locale and theme React context providers
├── services/         # Feature-spanning business services
├── stores/           # Global client state (cartStore)
├── testing/          # Screen-level testing harness & DB seeders
├── types/            # Shared TypeScript types
└── utils/            # Pure helpers (money, dates, text)
```

---

## Key Modules

### 1. `src/app/` — Expo Router file-based routing

Route files are intentionally minimal: they import a feature screen and render
it. Navigation wiring lives here, business logic never does.

- `_layout.tsx` — Root layout: providers + Stack navigator (all headers hidden)
- `index.tsx` — Onboarding gate: checks `useOnboarding.isOnboardingComplete()`,
  then either shows `OnboardingScreen` or redirects to `/(tabs)`
- `(tabs)/_layout.tsx` — Tab navigator (home, sell, products, customers, more)
  with a custom `AppTabBar`
- `(tabs)/*.tsx` — The five tab screens
- `products/`, `customers/`, `sales/`, `settings/` — Stack routes grouped by domain
- `+not-found.tsx` — Custom 404 screen

### 2. `src/features/` — Feature modules

Each feature folder groups its screens and private components:

| Feature | Screens & Components |
|---|---|
| `catalogue/` | `CatalogueScreen` (+ `CataloguePreview`, `CatalogueSettings`, `ProductSelector`) |
| `customers/` | `CustomerListScreen`, `CustomerDetailScreen`, `CustomerFormScreen`, `RecordPaymentScreen`, `PaymentReminderPreview` |
| `dashboard/` | `DashboardScreen` (+ `GreetingCard`, `SummaryCards`, `SalesChart`, `LowStockAlertBanner`, `LowStockList`, `RecentSalesList`, `QuickActionSheet`, `LowStockNotificationModal`) |
| `onboarding/` | `OnboardingScreen`, `EmptyDashboardScreen` (+ wizard steps) |
| `products/` | `ProductListScreen`, `ProductDetailScreen`, `ProductFormScreen`, `StockAdjustmentScreen`, `LowStockScreen` |
| `sales/` | `SellScreen`, `SalesHistoryScreen`, `SaleDetailScreen` (+ cart, checkout sheet, receipt preview, cancel/return dialogs, barcode scanner) |
| `settings/` | `MoreScreen`, `BusinessSettingsScreen`, `LanguageSettingsScreen`, `ThemeSettingsScreen`, `InventorySettingsScreen`, `ExportSettingsScreen`, `DataResetScreen` |

### 3. `src/database/` — Data persistence (Module Singleton)

The database is a **module singleton**, not a React context:

- `database.ts` — `getDatabase()` opens `DukkanPro.db` once, sets pragmas
  (`foreign_keys = ON`, WAL mode), runs migrations, and seeds dev data (`__DEV__` only).
- `query.ts` — Low-level prepared-statement runners (`executeAll`, `executeRead`, `executeWrite`).
- `schema.ts` — Schema SQL strings.
- `repositories/` — Domain repositories: `productRepository`,
  `customerRepository`, `saleRepository`, `businessProfileRepository`, `dashboardRepository`, `exportRepository`, `resetRepository`.

Write paths that span multiple tables (e.g. `saleRepository.create`) run inside
a SQLite transaction so sale header + items + stock deduction + inventory
movement are all-or-nothing.

---

## 💱 Multi-Currency Architecture

All monetary values are stored as **integer centimes** in SQLite (100 centimes = 1 unit).
At display time, `formatCentimes(amountCentimes)` formats the value based on the active store currency cached in `src/utils/money.ts`:

- **DZD** (Default): Formatted as `140 DZD` / `140 د.ج`
- **EUR**: Formatted as `140 €`
- **USD**: Formatted as `$140`

When the merchant updates their store currency in `BusinessSettingsScreen.tsx`, `setActiveStoreCurrency(currency)` is synchronized with SQLite (`business_profiles.currency`).

---

## 🎨 Theme Architecture

Components call `useTheme()` to resolve active theme colors dynamically (`theme.background`, `theme.surface`, `theme.textPrimary`, `theme.textSecondary`, `theme.border`, `theme.primary`, etc.).
Theme preferences (`system` / `light` / `dark`) are managed by `AppThemeProvider` and persisted to AsyncStorage.

---

## 📐 Conventions

- **LTR-Only Layout:** The app stays visually LTR for every language (French, Arabic, English); Arabic text may right-align inside individual components.
- **Money as Integer Centimes:** Monetary arithmetic is performed strictly on integers (centimes).
- **Thin Route Files:** Screens and business logic reside inside `src/features/`.
