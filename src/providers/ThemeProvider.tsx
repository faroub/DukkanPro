import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Appearance, ColorSchemeName, useColorScheme as useRNColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "system" | "light" | "dark";
export type EffectiveColorScheme = "light" | "dark";

export interface ThemeContextType {
  themePreference: ThemePreference;
  colorScheme: EffectiveColorScheme;
  systemColorScheme: EffectiveColorScheme;
  isDark: boolean;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const THEME_STORAGE_KEY = "@dukkan_theme_preference";

// Internal global fallback state
let globalThemePreference: ThemePreference = "system";
let globalEffectiveColorScheme: EffectiveColorScheme = "light";
const listeners = new Set<(scheme: EffectiveColorScheme, pref: ThemePreference) => void>();

export function getGlobalColorScheme(): EffectiveColorScheme {
  return globalEffectiveColorScheme;
}

export function getGlobalThemePreference(): ThemePreference {
  return globalThemePreference;
}

export const ThemeContext = createContext<ThemeContextType>({
  themePreference: "system",
  colorScheme: "light",
  systemColorScheme: "light",
  isDark: false,
  setThemePreference: async () => {},
  toggleTheme: async () => {},
});

export function useThemePreference(): ThemeContextType {
  return useContext(ThemeContext);
}

export interface ThemeProviderProps {
  children: React.ReactNode;
}

function computeEffectiveScheme(pref: ThemePreference, systemScheme?: ColorSchemeName | null): EffectiveColorScheme {
  if (pref === "dark") return "dark";
  if (pref === "light") return "light";
  return systemScheme === "dark" ? "dark" : "light";
}

export function AppThemeProvider({ children }: ThemeProviderProps) {
  const rnColorScheme = useRNColorScheme();
  const [appAppearanceScheme, setAppAppearanceScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() || "light");
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");

  // Subscribe to real-time Appearance changes from OS/browser
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setAppAppearanceScheme(colorScheme);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Load persisted theme preference on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "system" || stored === "light" || stored === "dark") {
          if (isMounted) {
            setThemePreferenceState(stored);
            globalThemePreference = stored;
          }
        }
      } catch (err) {
        console.warn("Failed to load theme preference:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeSystemScheme: EffectiveColorScheme = (rnColorScheme || appAppearanceScheme) === "dark" ? "dark" : "light";
  const colorScheme: EffectiveColorScheme = computeEffectiveScheme(themePreference, activeSystemScheme);

  useEffect(() => {
    globalThemePreference = themePreference;
    globalEffectiveColorScheme = colorScheme;
  }, [themePreference, colorScheme]);

  const setThemePreference = useCallback(
    async (preference: ThemePreference) => {
      setThemePreferenceState(preference);
      globalThemePreference = preference;
      const currentSystem = Appearance.getColorScheme();
      const effective = computeEffectiveScheme(preference, currentSystem);
      globalEffectiveColorScheme = effective;
      listeners.forEach((fn) => fn(effective, preference));

      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
      } catch (err) {
        console.warn("Failed to persist theme preference:", err);
      }
    },
    []
  );

  const toggleTheme = useCallback(async () => {
    let nextPref: ThemePreference;
    if (themePreference === "light") {
      nextPref = "dark";
    } else if (themePreference === "dark") {
      nextPref = "system";
    } else {
      nextPref = "light";
    }
    await setThemePreference(nextPref);
  }, [themePreference, setThemePreference]);

  const isDark = colorScheme === "dark";

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        colorScheme,
        systemColorScheme: activeSystemScheme,
        isDark,
        setThemePreference,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
