# DukkanPro Application Architecture

DukkanPro is an offline-first React Native app (Expo SDK 57) for small-business
inventory, sales, customers, and payments. All business data lives in a local
SQLite database; there is no backend.

The codebase is organized by **feature**, with thin Expo Router files that only
render feature screens, and a shared set of UI, data, and service layers.

## Folder Structure

```
src/
├── app/              # Expo Router routes (thin wrappers around feature screens)
├── components/       # Shared UI primitives and cross-feature components
├── constants/        # Theme palette (light/dark)
├── database/         # SQLite singleton, schema, migrations, repositories
├── features/         # Feature modules: screens + their local components
├── hooks/            # Reusable hooks (data, layout, theme)
├── localization/     # i18n setup and locale helpers
├── locales/          # ar / fr / en translation bundles
├── providers/        # Locale and theme React context providers
├── services/         # Feature-spanning business services
├── stores/           # Global client state (cart)
├── types/            # Shared TypeScript types
└── utils/            # Pure helpers (money, dates, text)
```

### `src/app/` — Expo Router file-based routing

Route files are intentionally minimal: they import a feature screen and render
it. Navigation wiring lives here, business logic never does.

- `_layout.tsx` — Root layout: providers + Stack navigator (all headers hidden)
- `index.tsx` — Onboarding gate: checks `useOnboarding.isOnboardingComplete()`,
  then either shows `OnboardingScreen` or redirects to `/(tabs)`
- `(tabs)/_layout.tsx` — Tab navigator (home, sell, products, customers, more)
  with a custom `AppTabBar`
- `(tabs)/*.tsx` — The five tab screens
- `products/`, `customers/`, `sales/`, `settings/` — Stack routes grouped by
  domain (`[id]` detail, `new`, `edit/[id]`, and feature-specific routes such as
  `products/stock-adjustment`, `customers/record-payment`, `sales/history`,
  `settings/export`, `settings/data-reset`)
- `onboarding.tsx`, `explore.tsx`, `+not-found.tsx`

### `src/features/` — Feature modules

Each feature folder groups its screens and their private components:

| Feature | Screens |
|---|---|
| `catalogue/` | `CatalogueScreen` (+ `CataloguePreview`, `CatalogueSettings`, `ProductSelector`) |
| `customers/` | `CustomerListScreen`, `CustomerDetailScreen`, `CustomerFormScreen`, `RecordPaymentScreen`, `PaymentReminderPreview` |
| `dashboard/` | `DashboardScreen` (+ greeting, summary cards, sales chart, low-stock alerts, quick actions, recent sales) |
| `onboarding/` | `OnboardingScreen`, `EmptyDashboardScreen` (+ wizard steps) |
| `products/` | `ProductListScreen`, `ProductDetailScreen`, `ProductFormScreen`, `StockAdjustmentScreen`, `LowStockScreen` |
| `sales/` | `SellScreen`, `SalesHistoryScreen`, `SaleDetailScreen` (cart, checkout sheet, receipt preview, cancel/return dialogs, barcode scanner) |
| `settings/` | `MoreScreen`, `BusinessSettingsScreen`, `LanguageSettingsScreen`, `ThemeSettingsScreen`, `InventorySettingsScreen`, `ExportSettingsScreen`, `DataResetScreen` |

### `src/components/` — Shared UI

- `ui/` — Primitives: `AppHeader`, `AppScreen`, `AppText`, `Button`s
  (`Primary`, `Secondary`, `Icon`), `Card`, `FormField`, `SearchInput`,
  `MoneyText`, `StatusBadge`, `EmptyState`, `LoadingState`, `ErrorState`,
  `ConfirmDialog`, `Collapsible`, `ErrorBoundary`
- `themed-text.tsx` / `themed-view.tsx` — Theme-aware wrappers
- `navigation/AppTabBar.tsx` — Custom tab bar
- `FooterTrademark.tsx` — Screen footer used across customer screens
- `external-link.tsx` — Web-targeted link (used by `explore`)
- `animated-icon.tsx` (+ `.web.tsx`) — Splash animation overlay
- `use-toast.tsx` — `showToast` notifications
- `index.ts` — Barrel re-exporting the shared components as `@/components`

### `src/database/` — Data persistence (no context)

The database is a **module singleton**, not a React context:

- `database.ts` — `getDatabase()` opens `DukkanOS.db` once, sets pragmas
  (`foreign_keys`, WAL), runs migrations, and seeds dev data (`__DEV__` only).
  Also re-exports bound query helpers (`dbAll`/`dbRead`/`dbWrite`, aliased as
  `executeAll`/`executeRead`/`executeWrite`) and `transaction`.
- `query.ts` — Low-level prepared-statement runners.
- `schema.ts` — Schema SQL strings.
- `migrations.ts` — Versioned, idempotent migrations tracked in
  `_migration_version`.
- `seed.ts` — Development-only sample data.
- `repositories/` — One repository per domain: `productRepository`,
  `customerRepository`, `saleRepository`,
  `businessProfileRepository`, `dashboardRepository`, `exportRepository`,
  `resetRepository`. Each imports the query helpers directly.

Write paths that span multiple tables (e.g. `saleRepository.create`) run inside
a SQLite transaction so sale header + items + stock deduction + inventory
movement are all-or-nothing.

### `src/hooks/`

- Data/state: `useProducts`, `useCustomers`, `useDashboard`, `useOnboarding`
- Utilities: `useDebounce`
- Layout: `useEdgeToEdge` (safe-area padding for edge-to-edge)
- Theme: `use-theme` (`useTheme()`) and `use-color-scheme` (+ `.web.ts`)

### `src/providers/`

- `LocaleProvider.tsx` — Reads the stored/device locale on mount, keeps
  `I18nextProvider` in sync, and mirrors layout direction.
- `ThemeProvider.tsx` — `AppThemeProvider` context: theme preference
  (`system` / `light` / `dark`) persisted in AsyncStorage under
  `@dukkan_theme_preference`, plus `useThemePreference()`.

### `src/services/` — Business services

- `catalogue/catalogueService.ts` — Catalogue building/listing
- `customers/customerBalanceService.ts` — Customer debt and payment recording
- `export/csvExportService.ts` — CSV export of products/customers/sales
- `notifications/lowStockNotifier.ts` — Low-stock alert evaluation

### `src/stores/`

- `cartStore.ts` — Zustand store (persisted to AsyncStorage) holding the
  in-progress sale cart used by `SellScreen`.

### `src/localization/` + `src/locales/`

- `i18n.ts` — i18next + react-i18next instance; French fallback; resources from
  `locales/{ar,fr,en}.json`; `updateLayoutDirection()` pins the document
  direction; `changeLocale()` switches language and persists the choice.
- `localeConfig.ts` — Device-locale detection (expo-localization), locale
  validation, AsyncStorage + `app_settings` persistence, and Intl formatting
  (currency DZD, dates, numbers).
- `locales/*.json` — Translation bundles.

### `src/types/` and `src/utils/`

- `types/entities.ts` — Domain entities (`Product`, `Sale`, `SaleItem`, …)
- `utils/money.ts` — Integer-centime helpers (`formatCentimes`, `parseCentimes`)
- `utils/dates.ts` — Date formatting
- `utils/text.ts` — Text helpers (truncation, Arabic/RTL detection, digit
  conversion)

## Application Bootstrap

```
LocaleProvider                     ← i18n language + stored/device locale
  └─ AppThemeProvider              ← color scheme (system | light | dark)
       └─ RootNavigator
            ├─ ErrorBoundary
            ├─ SafeAreaProvider
            │    └─ expo-router ThemeProvider (DarkTheme | DefaultTheme)
            │         ├─ StatusBar
            │         ├─ AnimatedSplashOverlay
            │         └─ Stack (headerShown: false)
            └─ index.tsx → onboarding gate → /(tabs)
```

1. `src/app/index.tsx` renders the Expo Router root.
2. `_layout.tsx` wraps the tree in `LocaleProvider` → `AppThemeProvider`.
3. `index.tsx` checks onboarding status and either shows the onboarding flow or
   replaces to `/(tabs)`.

## Key Flows

### Sell flow

1. `SellScreen` reads products via `useProducts` and the cart via `cartStore`.
2. Products are added to the cart (barcode scan or search).
3. `CheckoutSheet` collects payment details.
4. `saleRepository.create()` runs an atomic transaction: sale header, sale
   items (with cost snapshot), stock deduction, inventory movement.
5. `ReceiptPreview` renders the receipt; the cart is cleared.

### Theme switching

1. `ThemeSettingsScreen` writes the preference to AsyncStorage
   (`@dukkan_theme_preference`).
2. `AppThemeProvider` updates the context; `useThemePreference()` drives the
   expo-router `ThemeProvider` value (`DarkTheme`/`DefaultTheme`) and
   `StatusBar` style.

### Locale switching

1. `LanguageSettingsScreen` calls `changeLocale(newLocale)`.
2. Locale is validated (`ar`, `fr`, `en`) and applied to i18next.
3. Choice is persisted to AsyncStorage and the `app_settings` SQLite table.
4. `updateLayoutDirection()` keeps the document direction **LTR**.

### Database access

Repositories import `executeRead`/`executeWrite`/`transaction` from
`@/database/database` and call them directly — the first call lazily opens the
singleton (`DukkanOS.db`), runs migrations, and (in development) seeds sample
data.

## Conventions

- **LTR-only layout.** The app stays visually LTR for every language; Arabic
  may right-align text inside individual components. Enforced by
  `src/__tests__/ltr-architecture.test.ts` and
  `scripts/check-no-rtl.ts` (rejects `I18nManager.forceRTL`/`allowRTL` and
  `flexDirection: "row-reverse"`).
- **Platform-specific files.** `.web.tsx`/`.web.ts` variants (e.g.
  `animated-icon.web.tsx`, `use-color-scheme.web.ts`, `SalesChartView.web.tsx`,
  `BarcodeScannerModal.web.tsx`) are selected by Metro on web; the native
  variant is used otherwise. For the barcode scanner this means
  `html5-qrcode` on web and `expo-camera`'s `CameraView` on native.
- **Money is integer centimes** everywhere; formatting to DZD happens only at
  display time (`formatCentimes`, `MoneyText`).
- **Route files stay thin.** Screens and logic live in `src/features/`.

## Testing

- Jest + `jest-expo` (`package.json` → `test`), setup in `jest.setup.js`.
- Unit tests for repositories, services, utils, and hooks live in `__tests__/`
  folders next to the code they cover.
- `src/__mocks__/expo-sqlite` provides the SQLite mock for tests.
- Guard suites: `route-architecture.test.ts`, `ltr-architecture.test.ts`,
  `security-rules.test.ts`, `recharts-guard.test.ts`.
- `scripts/check-architecture.ts` validates that `src/app/` contains only route
  and layout files.
