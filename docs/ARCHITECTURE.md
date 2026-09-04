# DukkanOS Application Architecture

## Folder Structure

```bash
src/
```
├── app/                    # Expo Router file-based routing
│   ├── (tabs)/            # Tab navigator screens
│   │   ├── products.tsx
│   │   ├── sell.tsx
│   │   ├── customers.tsx
│   │   ├── more.tsx
│   │   └── index.tsx
│   ├── products/[id].tsx  # Product detail screen
│   ├── products/new.tsx   # New product screen
│   ├── edit/[id].tsx     # Product edit screen
│   ├── _layout.tsx        # Root layout with providers
│   ├── explore.tsx        # Explore screen
│   ├── onboarding.tsx     # Onboarding flow
│   └── index.tsx          # Entry point
├── components/            # Reusable UI components
│   ├── ui/                # Base UI components (buttons, inputs, etc.)
│   ├── AppHeader.tsx
│   ├── PrimaryButton.tsx
│   ├── SecondaryButton.tsx
│   ├── SearchInput.tsx
│   ├── Card.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   ├── LoadingState.tsx
│   └── ...
├── animated-icon.tsx
├── hint-row.tsx
├── web-badge.tsx
└── themed-view.tsx
├── hooks/                 # Custom React hooks
│   ├── useProducts.ts     # Product fetching & filtering
│   ├── useLocale.ts       # Locale management
│   ├── use-color-scheme.ts # Theme detection
│   ├── useDebounce.ts     # Debounced value updates
│   └── useOnboarding.ts   # Onboarding state management
├── database/              # SQLite database layer
│   ├── database.ts        # Database initialization
│   ├── schema.ts          # Database schema definitions
│   ├── migrations.ts      # Migration logic
│   ├── query.ts           # Database query helpers
│   └── repositories/      # Repository pattern for data access
│       ├── productRepository.ts
│       ├── customerRepository.ts
│       ├── inventoryRepository.ts
│       ├── exportRepository.ts
│       ├── saleRepository.ts
│       └── businessProfileRepository.ts
├── providers/             # React context providers
│   ├── AppProviders.tsx   # Compose DatabaseProvider + LocaleProvider
│   ├── DatabaseProvider.tsx # SQLite database context
│   └── LocaleProvider.tsx # i18n context via react-i18next
├── utils/                 # Utility functions (pure, testable)
│   ├── money.ts           # DZD currency formatting
│   ├── dates.ts           # Date formatting & relative dates
│   ├── text.ts            # Text manipulation (Arabic support, truncation)
│   └── testing.ts         # Test utilities & mocks
├── locales/               # i18n translation files
│   ├── en.json
│   ├── fr.json
│   └── ar.json
├── types/                 # TypeScript type definitions
│   ├── entities.ts        # Product, Sale, Inventory types
│   └── common.ts          # Shared utility types
└── constants/             # Application constants
    └── theme.ts           # Color themes & palette
```

## State Flow

1. **Entry Point**: `src/app/index.tsx` renders the Expo Router root
2. **App Providers**: `src/app/_layout.tsx` wraps everything in `AppProviders`
3. **Database State**: `DatabaseProvider` manages SQLite database via context
4. **Locale State**: `LocaleProvider` manages i18n language via `react-i18next`
5. **Theme State**: `useTheme()` hook reads `useColorScheme()` from React Native
6. **Product Data**: `useProducts` hook fetches data from `productRepository`
7. **UI Components**: Consume context via `useLocale`, `useTheme`, or direct props

## Data Layers

### Presentation Layer
- UI components (`src/components/`) - dumb components receiving props
- Custom hooks (`src/hooks/`) - business logic separated from UI
- Expo Router screens (`src/app/`) - navigation and screen composition

### Business Logic Layer
- Repository pattern (`src/database/repositories/`) - abstracts data access
- Utility functions (`src/utils/`) - pure functions for formatting, validation
- Custom hooks (`src/hooks/`) - React state management with side effects

### Data Layer
- SQLite database (`src/database/`) - persistent storage via expo-sqlite
- i18n system (`src/locales/`) - translation management via i18next
- AsyncStorage/SQLite persistence for user preferences

## Key Flows

### Product Listing Flow
1. Screen calls `useProducts()` hook
2. Hook triggers `loadProducts` callback
3. Repository method (`getAll` or `search`) queries SQLite
4. Results transformed with `lowStock`/`outOfStock` badges
5. State updated, UI re-renders with product list

### Locale Change Flow
1. `changeLocale(newLocale)` called from UI
2. Validates locale is supported
3. `i18n.changeLanguage(newLocale)` - dynamic, no reload
4. Locale persisted in SQLite/AsyncStorage
5. `LocaleProvider` updates context for subtree

### Database Flow
1. Component mounts, `DatabaseProvider` init effect runs
2. `openDatabase()` creates/opens `dukkanos.db`
3. Schema tables created if not exist
4. Context value exposed via `DatabaseContext`
5. Repositories use `DatabaseContext` to query data

## Navigation

- Uses **Expo Router** with file-based routing
- Tab navigator defined in `src/app/(tabs)/`
- Deep linking configured in `app.json`
- Typed routes experiment enabled (`typedRoutes: true`)