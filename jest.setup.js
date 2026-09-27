/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
  CameraView: ({ children }: any) => children,
}));

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  setParams: jest.fn(),
  canGoBack: jest.fn(() => true),
};

export let mockLocalSearchParams: Record<string, string> = {};

export function setMockSearchParams(params: Record<string, string>) {
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
    useFocusEffect: (callback: () => void) => {
      mockReact.useEffect(() => {
        callback();
      }, []);
    },
    router: mockRouter,
    Link: ({ children, onPress }: any) => {
      const { TouchableOpacity } = require('react-native');
      return <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;
    },
    Stack: Object.assign(({ children }: any) => children, { Screen: () => null }),
    Tabs: Object.assign(({ children }: any) => children, { Screen: () => null }),
  };
});
