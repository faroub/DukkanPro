/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

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
        callback();
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
