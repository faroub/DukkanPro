# Dukkan OS Testing Guide

## Test Runner

Run all automated Jest tests:
```bash
npm test
```

This executes Jest with the `jest-expo` preset configured in `package.json`.

---

## Test Configuration

The testing setup uses:
- **Jest** test runner
- **React Native Testing Library** (`@testing-library/react-native`)
- **jest-expo** preset for Expo SDK 57 compatibility
- **`jest.setup.js`** for mocking native Expo modules (`expo-camera`, `@react-native-async-storage/async-storage`, `expo-router`)

---

## Testing Harness (`src/testing/screenTestHarness.tsx`)

A dedicated screen testing harness is provided in `src/testing/screenTestHarness.tsx`:

- **`renderScreen(ui: React.ReactElement)`**: Renders a screen wrapped in `SafeAreaProvider`, `LocaleProvider`, and `AppThemeProvider`.
- **`resetTestDb()`**: Wipes and re-initializes SQLite test database tables before each test.
- **`seedTestProduct()`**: Seeds test product records into SQLite.
- **`seedTestCustomer()`**: Seeds test customer records into SQLite.
- **`seedTestSale()`**: Seeds test sale records into SQLite.
- **`seedTestBusinessProfile()`**: Seeds store business profile into SQLite.

### Example Integration Test

```typescript
import React from "react";
import { waitFor, screen } from "@testing-library/react-native";
import { ProductListScreen } from "@/features/products/ProductListScreen";
import { renderScreen, resetTestDb, seedTestProduct } from "@/testing/screenTestHarness";

describe("ProductListScreen", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("renders list of products from catalogue", async () => {
    await seedTestProduct("Lait Candia 1L", 12000, 9000, 50, 10);
    renderScreen(<ProductListScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("Lait Candia 1L").length).toBeGreaterThan(0);
    });
  });
});
```

---

## Running Specific Tests

```bash
# Run all tests
npm test

# Run a specific test suite
npx jest src/__tests__/screens/dashboardScreen.test.tsx

# Run tests matching a pattern
npx jest --testNamePattern="ProductListScreen"
```

---

## TypeScript Type Check

Verify TypeScript type safety across the project:
```bash
npx tsc --noemit
```
