# DukkanOS Testing Guide

## Test Runner

Run all tests:
```bash
npm test
```

This uses Jest with the `jest-expo` preset configured in `package.json`.

## Test Configuration

The project uses:
- **Jest** for test runner
- **React Native Testing Library** (`@testing-library/react-native`) for UI tests
- **jest-expo** preset for Expo SDK 57 compatibility
- **@testing-library/jest-dom** for custom jest matchers

## Test File Conventions

- Unit tests: `src/**/__tests__/*.test.ts` or `src/**/*.test.ts`
- Component tests: `src/components/**/*.test.tsx`
- Hook tests: `src/hooks/__tests__/*.test.ts`
- Repository tests: `src/database/repositories/__tests__/*.test.ts`

## Running Specific Tests

```bash
# Run all tests
yarn test

# Run tests in a specific file
yarn test -- --testPathPattern=useProducts

# Run tests matching a pattern
yarn test -- --testNamePattern="product repository"

# Watch mode
yarn test --watch
```

## Async UI Testing

Always use asynchronous queries when asserting UI changes or async updates:

```javascript
// Good - use findBy queries for async updates
await screen.findByText('Loading complete');
await waitFor(() => expect(element).toBeVisible());

// Bad - avoid synchronous getBy queries for async operations
const button = screen.getByText('Submit'); // May fail if not rendered yet
```

## Mocking Native Modules

### Mocking Expo Native Modules

All native modules are mocked using `jest-expo` defaults. Add manual mocks in `__mocks__` directories if needed:

```javascript
// __mocks__/expo-sqlite.ts
export const mockDB = {
  exec: jest.fn(),
  fetch: jest.fn(),
  getAll: jest.fn(),
};

export default {
  Database: jest.fn(() => mockDB),
};
```

### Mocking External APIs

Use `jest.mock()` for external API calls:

```javascript
// Mock fetch for API calls
jest.mock('fetch', () => ({
  ...jest.requireActual('fetch'),
  get: jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: {} }),
  }),
});
```

### useEffect Cleanup

Ensure all async operations and native lifecycle listeners have proper cleanups:

```javascript
useEffect(() => {
  const subscription = someNativeModule.addListener('event', handler);
  
  return () => {
    subscription.remove();
  };
}, [deps]);
```

## Testing Hooks

Use `renderHook` from `@testing-library/react-native`:

```javascript
import { renderHook } from '@testing-library/react-native';
import { useProducts } from '../useProducts';

describe('useProducts', () => {
  it('should initialize with loading state', async () => {
    const { result } = await renderHook(() => useProducts({}));
    expect(result.current.loading).toBe(true);
  });
});
```

## Updating Snapshots

When UI changes require snapshot updates:

```bash
# Update all snapshots
yarn test -- -u

# Update specific snapshot
yarn test -- --testPathPattern=ProductCard -u
```