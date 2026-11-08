/**
 * Localization types for Dukkan OS
 *
 * Supported locales: Arabic (ar), French (fr), English (en)
 * Arabic uses RTL layout direction; French and English use LTR. The direction
 * is applied by updateLayoutDirection (src/localization/i18n.ts), the single
 * authorized control site for I18nManager.
 */

export type Locale = "ar" | "fr" | "en";

export type AppLayoutDirection = "ltr";

export type TextAlignment = "left" | "right" | "center";