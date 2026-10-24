import React from "react";
import { renderScreen, resetTestDb, seedTestBusinessProfile, resetMockRouter } from "@/testing/screenTestHarness";
import { MoreScreen } from "@/features/settings/MoreScreen";
import { BusinessSettingsScreen } from "@/features/settings/BusinessSettingsScreen";
import { LanguageSettingsScreen } from "@/features/settings/LanguageSettingsScreen";
import { ThemeSettingsScreen } from "@/features/settings/ThemeSettingsScreen";
import { ExportSettingsScreen } from "@/features/settings/ExportSettingsScreen";
import { DataResetScreen } from "@/features/settings/DataResetScreen";

describe("Settings Screens Integration Harness", () => {
  beforeEach(async () => {
    resetMockRouter();
    await resetTestDb();
  });

  describe("MoreScreen (Settings Overview)", () => {
    it("renders settings options and navigation items", async () => {
      const screen = await renderScreen(<MoreScreen />);

      const profileItems = await screen.findAllByText(/Profil & Identité/i);
      expect(profileItems.length).toBeGreaterThan(0);
      const langItems = await screen.findAllByText(/Langue & Affichage/i);
      expect(langItems.length).toBeGreaterThan(0);
    });
  });

  describe("BusinessSettingsScreen", () => {
    it("renders business profile form fields and currency options", async () => {
      await seedTestBusinessProfile("Pro Magasin", "0555001122", "Oran");

      const screen = await renderScreen(<BusinessSettingsScreen />);

      const labelElements = await screen.findAllByText(/Nom du magasin/i);
      expect(labelElements.length).toBeGreaterThan(0);
      const nameElements = await screen.findAllByText("Pro Magasin");
      expect(nameElements.length).toBeGreaterThan(0);
      const dzdElements = await screen.findAllByText(/DZD/i);
      expect(dzdElements.length).toBeGreaterThan(0);
    });
  });

  describe("LanguageSettingsScreen", () => {
    it("renders language choices (FR, AR, EN)", async () => {
      const screen = await renderScreen(<LanguageSettingsScreen />);

      const fr = await screen.findAllByText(/Français/i);
      expect(fr.length).toBeGreaterThan(0);
      const ar = await screen.findAllByText(/العربية/i);
      expect(ar.length).toBeGreaterThan(0);
      const en = await screen.findAllByText(/English/i);
      expect(en.length).toBeGreaterThan(0);
    });
  });

  describe("ThemeSettingsScreen", () => {
    it("renders theme selection options", async () => {
      const screen = await renderScreen(<ThemeSettingsScreen />);

      const clair = await screen.findAllByText(/Clair/i);
      expect(clair.length).toBeGreaterThan(0);
      const sombre = await screen.findAllByText(/Sombre/i);
      expect(sombre.length).toBeGreaterThan(0);
    });
  });

  describe("ExportSettingsScreen", () => {
    it("renders data export options for products, sales and customers", async () => {
      const screen = await renderScreen(<ExportSettingsScreen />);

      const exportItems = await screen.findAllByText(/Export/i);
      expect(exportItems.length).toBeGreaterThan(0);
    });
  });

  describe("DataResetScreen", () => {
    it("renders data reset confirmation interface", async () => {
      const screen = await renderScreen(<DataResetScreen />);

      const resetItems = await screen.findAllByText(/Réinitialisation/i);
      expect(resetItems.length).toBeGreaterThan(0);
    });
  });
});
