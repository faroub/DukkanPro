/**
 * Dukkan OS Theme Constants
 *
 * Color palette, spacing, typography, border radius, and shadows.
 * Entire application remains visually LTR regardless of selected language.
 * Values sourced from DESIGN.md (Google Stitch design system).
 */

import { Platform } from "react-native";

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

/**
 * Color palette — LTR-compatible, same layout in all languages.
 * Values sourced from DESIGN.md (Google Stitch design system).
 */
export const Colors = {
  light: {
    background: "#F8F7F4",
    text: "#1A1A1A",
    textPrimary: "#1A1A1A",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    primary: "#1B6B3A",
    primaryDark: "#14552E",
    primaryLight: "#E8F5EE",
    secondary: "#904D00",
    secondaryLight: "#FFDCC2",
    positive: "#1B6B3A",
    warning: "#D97706",
    destructive: "#B91C1C",
    error: "#B91C1C",
    errorLight: "#FEF2F2",
    warningLight: "#FFFBEB",
    disabledBackground: "#D1D5DB",
    surface: "#FFFFFF",
    surfaceAlt: "#F0EFEA",
    border: "#E5E5E5",
    borderLight: "#F0F0F0",
    backgroundElement: "#F0EFEA",
    notification: "#FBBF24",
  } as const,
  dark: {
    background: "#121212",
    text: "#F9FAFB",
    textPrimary: "#F9FAFB",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    primary: "#1B6B3A",
    primaryDark: "#14552E",
    primaryLight: "#E8F5EE",
    secondary: "#904D00",
    secondaryLight: "#FFDCC2",
    positive: "#1B6B3A",
    warning: "#D97706",
    destructive: "#B91C1C",
    error: "#B91C1C",
    errorLight: "#FEF2F2",
    warningLight: "#FFFBEB",
    disabledBackground: "#D1D5DB",
    surface: "#1F2937",
    surfaceAlt: "#1E293B",
    border: "#374151",
    borderLight: "#2C2C2C",
    backgroundElement: "#1E293B",
    notification: "#FBBF24",
  } as const,
} as const;

export type ColorKey = keyof typeof Colors.light;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Typography scale — minimum 16px body, supporting Arabic/French/English.
 * All values match DESIGN.md exactly. Arabic text may use right alignment
 * inside individual components, but surrounding layout stays LTR. No global
 * RTL mirroring.
 */
export const Typography = {
  // Body minimum 16px as required
  body: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.15,
  },
  // Headings
  heading1: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700 as const,
    letterSpacing: 0,
  },
  heading2: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 600 as const,
    letterSpacing: 0,
  },
  heading3: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 600 as const,
    letterSpacing: 0,
  },
  // Body Large
  bodyLarge: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 400 as const,
    letterSpacing: 0.15,
  },
  // Label
  label: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 600 as const,
    letterSpacing: 0.1,
  },
  // Caption
  caption: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 400 as const,
    letterSpacing: 0.1,
  },
  // Money Display
  moneyDisplay: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700 as const,
    letterSpacing: 0,
  },
  // Money Small
  moneySmall: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 16,
    lineHeight: 20,
    fontWeight: 600 as const,
    letterSpacing: 0,
  },
  moneySm: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 16,
    lineHeight: 20,
    fontWeight: 600 as const,
    letterSpacing: 0,
  },
  // Badges
  badge: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 600 as const,
    letterSpacing: 0.1,
  },
  badgeLabel: {
    fontFamily: Platform.select({
      ios: "system-ui",
      android: "Roboto",
      default: "system-ui",
    }),
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 600 as const,
    letterSpacing: 0.1,
  },
  // Arabic-specific: right-aligned text within LTR layout
  arabic: {
    textAlign: "right" as const,
    // Arabic text stays LTR in surrounding layout
  },
} as const;

/**
 * Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxx: 48,
} as const;

export const BottomTabInset = 60;
export const MaxContentWidth = 480;

/** Stitch component dimensions. */
export const ComponentDimensions = {
  screenPadding: 16,
  cardPadding: 16,
  cardGap: 12,
  formFieldGap: 16,
  headerHeight: 56,
  tabBarHeight: 60,
  primaryButtonHeight: 48,
  secondaryButtonHeight: 48,
  destructiveButtonHeight: 48,
  inputHeight: 48,
  searchInputHeight: 44,
  listRowMinHeight: 56,
  iconSize: 24,
  emptyStateIconSize: 48,
} as const;

export type SpacingValue = (typeof Spacing)[keyof typeof Spacing];

/**
 * Border radius values
 */
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  button: 10,
  full: 9999,
  pill: 9999,
} as const;

/**
 * Shadow values
 */
export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

/**
 * Z-index stack for layering
 */
export const ZIndex = {
  tooltip: 1000,
  modal: 1000,
  overlay: 900,
  drawer: 800,
  bottomSheet: 700,
  header: 600,
  content: 500,
  footer: 400,
} as const;
