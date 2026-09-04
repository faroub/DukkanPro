# DukkanOS API & State Guide

## Local Hooks

### `useProducts`

Manages product list state with filtering.

**Return Type:**
```typescript
{
  products: ProductListItem[]     // List of products with badges
  loading: boolean               // Loading state
  error: string | null           // Error message or null
  reload: () => void             // Refetch function
  refetch: () => void            // Alias for reload
}
```

**Parameters:**
- `filters: ProductsFilters = {}` - Optional filters
  - `is_active?: boolean` - Filter by active status
  - `search?: string` - Search by name or SKU

**Key Features:**
- Fetch all active products via `getAll()`
- Real-time search by name or SKU via `search()`
- Filter by stock status (all, low stock, out of stock, archived)
- Loading and error state management
- Transform products with `lowStock` and `outOfStock` badges

**Example:**
```javascript
const { products, loading, error, reload } = useProducts({ search: 'طحين', is_active: true });
```

### `useLocale`

Provides locale information without calling I18nManager APIs.

**Return Type:**
```typescript
{
  locale: Locale                  // Current selected locale
  isRTL: false                    // Always false - app remains LTR
  changeLocale: (newLocale: Locale) => void  // Change locale
  getFormattedLocale: (locale: Locale) => string  // Get formatted locale
  getCurrencyCode: (locale: Locale) => string   // Get currency code (always "DZD")
}
```

**Features:**
- Returns current selected locale (persisted in SQLite or device locale)
- Always returns `isRTL` as false - app remains LTR regardless of language
- `changeLocale()` persists selection and updates i18n
- Language switching never triggers an RTL reload

**Example:**
```javascript
const { locale, changeLocale } = useLocale();
changeLocale('ar'); // Switch to Arabic
```

### `useTheme`

Detects and provides the current color scheme theme.

**Return Type:**
```typescript
// From Colors palette object (light/dark themes)
```

**Features:**
- Reads `useColorScheme()` from React Native
- Returns 'light' if scheme is 'unspecified'
- Returns the Colors palette object for the current theme

**Example:**
```javascript
const theme = useTheme(); // Returns Colors.light or Colors.dark
```

### `useColorScheme` (web variant)

Web-specific color scheme hook that supports static rendering.

**Features:**
- Hydrates on client side for web
- Returns 'light' until hydration completes
- Required for web support with Expo

### `useDebounce`

Debounces a value with a specified delay.

**Parameters:**
- `value: T` - Value to debounce
- `delay: number` - Delay in milliseconds

**Returns:**
- `T` - The debounced value

### `useOnboarding`

Manages onboarding flow state.

**Features:**
- Tracks onboarding step progression
- Persists completion state
- Navigation between onboarding steps

## Context Providers

### `AppProviders`

Top-level provider that composes all other providers.

**Structure:**
```tsx
<AppProviders>
  <SafeAreaView>
    <DatabaseProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </DatabaseProvider>
  </SafeAreaView>
</AppProviders>
```

**Dependencies:**
- `useTheme()` hook for theme detection
- `DatabaseProvider` for SQLite context
- `LocaleProvider` for i18n context

### `DatabaseProvider`

Manages SQLite database via context.

**Context Value:**
```typescript
{
  db: SQLite.SQLiteDatabase | null    // Database instance or null
  init: () => Promise<void>          // Initialize database
}
```

**Features:**
- Opens/creates `dukkanos.db` on mount
- Creates tables if not exist: sales, payments, inventory, settings
- Exposes database instance via `DatabaseContext`
- Proper cleanup in `useEffect` return

**Schema Tables:**
- `sales` - Sale records with date, type, amount, payment, status
- `payments` - Payment records referencing sales
- `inventory` - Inventory items with product name, quantity, min stock
- `settings` - Key-value settings store

### `LocaleProvider`

Provides internationalization via `react-i18next`.

**Features:**
- Initializes i18next with French as default language
- Detects device locale on first launch using `expo-localization`
- Persists selected locale in AsyncStorage (merchant override)
- Language switching does NOT trigger RTL layout changes
- App remains visually LTR regardless of selected language
- Syncs locale state with i18n language changes via `languageChanged` event

**Supported Locales:** `["ar", "fr", "en"]`
**Default Type:** `"fr"`

**Context:** Provides `i18n` context to the rest of the app via `I18nextProvider`

## Utility Functions

### `formatCentimes(centimes, locale)`

Formats centimes amount to DZD display string.

**Parameters:**
- `centimes: number` - Amount in centimes (integer)
- `locale: "ar-DZ" | "fr-DZ" | "en-DZ"` - Locale string

**Returns:** Formatted DZD string (e.g. "140 DZD", "١٤٠ دج")

**Locales:**
- `ar-DZ`: Arabic-Indic numerals, "دج" symbol
- `fr-DZ`: Western numerals, "123,45 DZD" or "123 DZD"
- `en-DZ`: Western numerals with comma separator

### `parseCentimes(formatted)`

Parses a DZD formatted string back to centimes integer.

**Parameters:**
- `formatted: string` - The formatted DZD string

**Returns:** Amount in centimes (integer), or 0 if parsing fails

**Accepts:** "140 DZD", "140,00 DZD", "١٤٠ دج", etc.

### `formatDate(date, locale)`

Formats a Date object or ISO string using the specified locale.

**Parameters:**
- `date: Date | string` - Date object or ISO string
- `locale: "ar-DZ" | "fr-DZ" | "en-DZ"` - Locale string

**Returns:** Formatted date string

**Locales:** Same as formatCentimes

### `formatRelativeDate(date, locale)`

Formats a date relative to "today" using the locale.

**Parameters:**
- `date: Date | string` - Date object or ISO string
- `locale: "ar-DZ" | "fr-DZ" | "en-DZ"` - Locale string

**Returns:** Relative date string (e.g. "Aujourd'hui", "Hier", "3 jours en arrière", "Today", "Yesterday")

### `getTextAlignment(locale)`

Gets the appropriate text alignment for the given locale.

**Parameters:**
- `locale: "ar" | "fr" | "en"` - Language locale

**Returns:** `"left" | "right"` - CSS textAlign value

**Logic:** Arabic → "right", French/English → "left"

### `getWritingDirection(locale)`

Gets the appropriate writing direction for the given locale.

**Parameters:**
- `locale: "ar" | "fr" | "en"` - Language locale

**Returns:** `"ltr" | "rtl"` - CSS writingDirection value

**Logic:** Arabic → "rtl", French/English → "ltr"

### `truncateText(text, maxWidth, locale)`

Safely truncates text with ellipsis, preserving grapheme clusters for proper Arabic/French/English support.

**Parameters:**
- `text: string` - Text to truncate
- `maxWidth: number` - Maximum width in characters
- `locale: "ar" | "fr" | "en"` - Language locale

**Returns:** Truncated text with ellipsis if needed

**Logic:** Arabic handles grapheme clusters, French/English simple slice

### `toArabicIndicDigits(text)`

Converts Latin digits to Arabic-Indic digits for display in Arabic locale.

**Parameters:**
- `text: string` - Text with Latin digits

**Returns:** Text with Arabic-Indic digits

### `toLatinDigits(text)`

Converts Arabic-Indic digits back to Latin digits for editing/input.

**Parameters:**
- `text: string` - Text with Arabic-Indic digits

**Returns:** Text with Latin digits

### `containsArabic(text)`

Checks if text contains Arabic characters.

**Parameters:**
- `text: string` - Text to check

**Returns:** `boolean` - True if text contains Arabic characters

**Regex:** `/[؀-ۿ]/`

### `containsRTL(text)`

Checks if text contains right-to-left characters (Arabic or Persian).

**Parameters:**
- `text: string` - Text to check

**Returns:** `boolean` - True if text contains RTL characters

**Regex:** `/[֐-ࣿ]/`

### `textStyle(locale, options)`

Wraps text in a style object that respects LTR layout globally while allowing Arabic text to be right-aligned within its container.

**Parameters:**
- `locale: "ar" | "fr" | "en"` - Language locale
- `options: Record<string, unknown>` - Additional style overrides

**Returns:** Text style object with correct alignment

**Properties:** `textAlign`, `writingMode`, plus any overrides

## Database Repositories

### Product Repository (`productRepository`)

**Exported Functions:**
- `getAll(filters?: ProductsFilters)` - Get all products with optional filters
- `search(query, filters?)` - Search products by name/SKU

**Mocked in tests:** `jest.mock("@/database/repositories/productRepository")`

### Customer Repository (`customerRepository`)

**Exported Functions:** Similar pattern for customer data

### Sale Repository (`saleRepository`)

**Exported Functions:** Sale record operations

### Inventory Repository (`inventoryRepository`)

**Exported Functions:** Inventory management operations

### Business Profile Repository (`businessProfileRepository`)

**Exported Functions:** Business profile settings

### Export Repository (`exportRepository`)

**Exported Functions:** Data export operations

## API Surface Summary

| Category | Key Exports |
|---|---|
| **Hooks** | `useProducts`, `useLocale`, `useTheme`, `useColorScheme`, `useDebounce`, `useOnboarding` |
| **Providers** | `AppProviders`, `DatabaseProvider`, `LocaleProvider` |
| **Utils** | `formatCentimes`, `parseCentimes`, `formatDate`, `formatRelativeDate`, `getTextAlignment`, `getWritingDirection`, `truncateText`, `toArabicIndicDigits`, `toLatinDigits`, `containsArabic`, `containsRTL`, `textStyle` |
| **Repositories** | `productRepository`, `customerRepository`, `saleRepository`, `inventoryRepository`, `businessProfileRepository`, `exportRepository` |
| **Types** | `ProductsFilters`, `ProductListItem`, `UseLocaleReturn`, `UseThemeReturn` |
| **Constants** | `CENTIMES_PER_DINAR` from `src/constants/theme.ts` |