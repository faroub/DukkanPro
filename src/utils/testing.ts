import ar from "@/localization/ar";
import en from "@/localization/en";
import fr from "@/localization/fr";
import { AppProviders } from "@/providers/AppProviders";
import i18n from "i18next";
import React from "react";
import { initReactI18next } from "react-i18next";

// @ts-ignore - types for @testing-library/react-native not installed
import { render } from "@testing-library/react-native";

// Mock SQLite database instance
export function mockDatabase() {
  const db: Record<string, any> = {};
  const transactions: Array<() => void> = [];

  return {
    db,
    transactions,
    // Mock execute method for queries
    execute: jest.fn(),
    // Mock prepSTMT for prepared statements
    prepSTMT: jest.fn(),
    // Mock run method for SQL execution
    run: jest.fn((sql: string, ...params: any[]) => {
      transactions.push(() => {
        db[sql] = { sql, params, result: undefined };
      });
      return { lastID: 1, changes: 1 };
    }),
    // Mock all method for fetching all rows
    all: jest.fn(() => {
      return Object.values(db).map((row: any) => row.result);
    }),
    // Mock get method for fetching single row
    get: jest.fn(() => {
      return undefined;
    }),
    // Mock exec method for executing multiple statements
    exec: jest.fn((sqlStatements: string[]) => {
      sqlStatements.forEach((sql) => {
        // @ts-ignore - this context for exec method
        this.run(sql);
      });
      return [];
    }),
  };
}

// Mock i18next instance for testing
export function mockLocale(locale: "ar" | "fr" | "en" = "fr") {
  i18n.use(initReactI18next).init({
    fallbackLng: "fr",
    lng: locale,
    resources: {
      ar: { translation: ar },
      en: { translation: en },
      fr: { translation: fr },
    },
    debug: false,
  });

  return { i18n, locale };
}

// Wrapper that provides AppProviders for testing
export function renderWithProviders(
  ui: React.ReactNode,
  options: {
    locale?: "ar" | "fr" | "en";
    database?: ReturnType<typeof mockDatabase>;
  } = {},
) {
  const { locale = "fr", database } = options;

  // Set up i18next with the selected locale
  mockLocale(locale);

  // Provide the component with AppProviders
  // If a custom database is provided, override the DatabaseProvider
  const baseProviders = React.createElement(AppProviders, null, ui);

  return render(baseProviders);
}
