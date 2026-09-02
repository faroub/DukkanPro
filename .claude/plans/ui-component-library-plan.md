# UI Component Library Plan - Dukkan OS

## Context
Creating a primitive UI component library for Dukkan OS, an offline-first business app for Algerian micro-businesses. The library includes 15 foundational components under `src/components/ui/` that must follow strict guidelines: LTR layout regardless of language, theme tokens from `@/constants/theme`, no hard-coded user-facing strings, and Arabic right-alignment only at the text level.

## Implementation Approach

### 1. Translation System Setup
- Create `src/locales/` directory with `ar.json`, `fr.json`, `en.json` dictionaries
- All user-facing strings go through `useTranslation()` hook from `react-i18next`
- Dictionaries contain identical keys across all languages with Arabic/French/English translations
- i18next configured in `src/providers/i18n-provider.tsx` (if needed) or use `react-i18next` default config

### 2. Component Library (15 components)

| # | Component | Key Props | Primary Style |
|---|-----------|-----------|--------------|
| 1 | AppText | align: left\|right\|center\|auto | Theme typography |
| 2 | AppScreen | children, optional header | Off-white background |
| 3 | AppHeader | title, backBtn?, rightAction? | LTR back arrow |
| 4 | PrimaryButton | disabled?, loading? | Deep green |
| 5 | SecondaryButton | disabled?, outlined style | Outlined |
| 6 | IconButton | accessible label, onPress | Large touch target |
| 7 | Card | children | Surface + border + shadow |
| 8 | EmptyState | icon, title, subtitle? | Translated text |
| 9 | LoadingState | message? | Activity indicator |
| 10 | ErrorState | message, onRetry | Retry button |
| 11 | ConfirmDialog | title, message, onConfirm, onCancel | Red destructive confirm |
| 12 | MoneyText | centimes, locale? | DZD formatting |
| 13 | SearchInput | placeholderKey?, onChangeIcon? | Search icon |
| 14 | FormField | labelKey, inputType?, errorKey? | Labeled input |
| 15 | StatusBadge | status: 'paid'\|'partial'\|'cancelled' | Color-coded |

### 3. Key Design Decisions

**LTR Layout**: All components maintain fixed LTR layout. Arabic text uses `textAlign: "right"` inline only; no `I18nManager.forceRTL`, no global mirroring, no `row-reverse`.

**Arabic Alignment**: Use `getTextAlignment(locale)` from `@/utils/text` for AppText alignment. Other components use appropriate alignment at the text component level only.

**Theme Tokens**: All components import from `@/constants/theme` for colors, spacing, typography, borders, shadows.

**Import Pattern**: Components use `@/components/ui` internal imports where applicable (e.g., AppText using other ui components, but not circular dependencies).

**No Hard-Coded Strings**: All user-facing strings come from translation dictionaries. Components accept `locale` or use context, but never hard-code Arabic/French/English text.

### 4. File Structure Plan

```
src/components/ui/
├── AppText.tsx
├── AppScreen.tsx
├── AppHeader.tsx
├── PrimaryButton.tsx
├── SecondaryButton.tsx
├── IconButton.tsx
├── Card.tsx
├── EmptyState.tsx
├── LoadingState.tsx
├── ErrorState.tsx
├── ConfirmDialog.tsx
├── MoneyText.tsx
├── SearchInput.tsx
├── FormField.tsx
└── StatusBadge.tsx

src/locales/
├── ar.json  (Arabic translations)
├── fr.json  (French translations)
└── en.json  (English translations)

src/providers/
└── i18n-provider.tsx (if needed for translation context)
```

### 5. Implementation Order (recommended)

1. **Translation dictionaries** - ar.json, fr.json, en.json
2. **Core components** - AppText, AppScreen, AppHeader (layout fundamentals)
3. **Action components** - PrimaryButton, SecondaryButton, IconButton
4. **State components** - Card, EmptyState, LoadingState, ErrorState
5. **Dialog/Feedback** - ConfirmDialog
6. **Domain-specific** - MoneyText, SearchInput, FormField, StatusBadge

### 6. Verification

- `npx tsc --noEmit` passes with no errors
- All 15 components render without crashing
- No `console.log` with hard-coded user strings
- Arabic text aligns right within LTR container
- Deep green for positive money/profit, amber for warnings, red for errors/cancelled
- Touch targets minimum 48px height on buttons

### 7. Dependencies (already available)

- `i18next`, `react-i18next` - already in package.json
- `expo-localization` - available for detecting device locale
- `@/constants/theme` - theme tokens already defined
- `@/utils/money` - money formatting utilities
- `@/utils/text` - text alignment utilities

## Ready to proceed with implementation.