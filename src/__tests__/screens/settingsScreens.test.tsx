import React from "react";
import { waitFor, screen } from "@testing-library/react-native";

import { MoreScreen } from "@/features/settings/MoreScreen";
import { BusinessSettingsScreen } from "@/features/settings/BusinessSettingsScreen";
import { LanguageSettingsScreen } from "@/features/settings/LanguageSettingsScreen";
import { ThemeSettingsScreen } from "@/features/settings/ThemeSettingsScreen";
import { ExportSettingsScreen } from "@/features/settings/ExportSettingsScreen";
import { DataResetScreen } from "@/features/settings/DataResetScreen";
import {
  renderScreen,
  resetTestDb,
  seedTestBusinessProfile,
  resetMockRouter,
} from "@/testing/screenTestHarness";

describe("Settings Screens Integration Harness", () => {
  beforeEach(async () => {
    resetMockRouter();
    await resetTestDb();
  });

  describe("MoreScreen (Settings Overview)", () => {
    it("renders settings options and navigation items", async () => {
      renderScreen(<MoreScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Profil & Identité/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Langue & Affichage/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("BusinessSettingsScreen", () => {
    it("renders business profile form fields and currency options", async () => {
      await seedTestBusinessProfile("Pro Magasin", "0555001122", "Oran");

      renderScreen(<BusinessSettingsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Nom du magasin/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText("Pro Magasin").length).toBeGreaterThan(0);
        expect(screen.getAllByText(/DZD/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/EUR/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/USD/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("LanguageSettingsScreen", () => {
    it("renders language choices (FR, AR, EN)", async () => {
      renderScreen(<LanguageSettingsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Français/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/العربية/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/English/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("ThemeSettingsScreen", () => {
    it("renders theme selection options", async () => {
      renderScreen(<ThemeSettingsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Clair/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Sombre/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("ExportSettingsScreen", () => {
    it("renders data export options for products, sales and customers", async () => {
      renderScreen(<ExportSettingsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Export/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("DataResetScreen", () => {
    it("renders data reset confirmation interface", async () => {
      renderScreen(<DataResetScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Réinitialisation/i).length).toBeGreaterThan(0);
      });
    });
  });
});
