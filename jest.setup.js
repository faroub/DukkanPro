/* global jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true })),
  copyAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve("{}")),
  deleteAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
  CameraView: ({ children }) => children,
}));

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  setParams: jest.fn(),
  canGoBack: jest.fn(() => true),
};

export let mockLocalSearchParams = {};

// Registered useFocusEffect callbacks — lets tests simulate a screen
// regaining focus (e.g. returning from a pushed screen) without remounting.
let mockFocusCallbacks = [];

export function triggerMockFocus() {
  mockFocusCallbacks.forEach((cb) => cb());
}

export function setMockSearchParams(params) {
  mockLocalSearchParams = params;
}

export function resetMockRouter() {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.back.mockReset();
  mockRouter.setParams.mockReset();
  mockRouter.canGoBack.mockReturnValue(true);
  mockLocalSearchParams = {};
  mockFocusCallbacks = [];
}

jest.mock('expo-router', () => {
  const mockReact = require('react');
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockLocalSearchParams,
    usePathname: () => '/',
    useSegments: () => [],
    useRoute: () => ({ params: mockLocalSearchParams }),
    useNavigation: () => ({
      goBack: mockRouter.back,
      navigate: mockRouter.push,
      setOptions: jest.fn(),
    }),
    useFocusEffect: (callback) => {
      mockReact.useEffect(() => {
        mockFocusCallbacks.push(callback);
        callback();
        return () => {
          mockFocusCallbacks = mockFocusCallbacks.filter((cb) => cb !== callback);
        };
      }, []);
    },
    router: mockRouter,
    Link: ({ children, onPress }) => {
      const { TouchableOpacity } = require('react-native');
      const React = require('react');
      return React.createElement(TouchableOpacity, { onPress }, children);
    },
    Stack: Object.assign(({ children }) => children, { Screen: () => null }),
    Tabs: Object.assign(({ children }) => children, { Screen: () => null }),
  };
});
