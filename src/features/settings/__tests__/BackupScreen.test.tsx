/**
 * BackupScreen — behavioral tests for the full-data backup & restore wiring
 * (docs/BACKUP_RESTORE.md).
 *
 * 1. "Create backup" snapshots every table and hands the JSON file to the
 *    OS share sheet.
 * 2. "Restore backup" on an empty database imports the picked file.
 * 3. Restore refuses to overwrite a non-empty database without an explicit
 *    confirmation, then applies it once confirmed.
 * 4. A canceled picker and an invalid file surface clear messages and leave
 *    the database untouched.
 */
import React from "react";
import { Alert } from "react-native";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { BackupScreen } from "../BackupScreen";
import {
  renderScreen,
  resetTestDb,
  resetMockRouter,
  seedTestBusinessProfile,
  seedTestCustomer,
  seedTestProduct,
} from "@/testing/screenTestHarness";
import { getDatabase } from "@/database/database";
import { buildBackup } from "@/services/backup/backupService";
import * as toastModule from "@/components/use-toast";

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "/mock/documents/",
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve("{}")),
  EncodingType: { UTF8: "utf8" },
}));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

const toastSpy = jest
  .spyOn(toastModule, "showToast")
  .mockImplementation(() => {});

async function tableCount(table: string): Promise<number> {
  const db = await getDatabase();
  const rows: { c: number }[] = await db.getAllAsync(
    `SELECT COUNT(*) AS c FROM ${table}`,
  );
  return rows[0]?.c ?? 0;
}

/** Seed a small shop, snapshot it, and wire the picker to return that file. */
async function seedAndMockPickerFile(): Promise<string> {
  await seedTestBusinessProfile("Backup Origin Shop");
  await seedTestProduct({ name: "Backup Product", sku: "BKUP-1" });
  await seedTestCustomer({ name: "Backup Client", phone: "0770000001" });
  const json = JSON.stringify(await buildBackup());
  (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(json);
  (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
    canceled: false,
    assets: [
      { uri: "file:///mock/backup.json", name: "backup.json", size: json.length },
    ],
  });
  return json;
}

function pressRestore() {
  fireEvent.press(screen.getByLabelText(/Restaurer la sauvegarde/i));
}

describe("BackupScreen backup & restore wiring", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(async () => {
    resetMockRouter();
    await resetTestDb();
    toastSpy.mockClear();
    (Sharing.shareAsync as jest.Mock).mockClear();
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("creates a backup and offers the JSON file through the share sheet", async () => {
    await seedTestBusinessProfile("Share Shop");
    await seedTestProduct({ name: "Share Product", sku: "SHARE-1" });
    await renderScreen(<BackupScreen />);

    fireEvent.press(screen.getByLabelText(/Créer la sauvegarde/i));

    await waitFor(() => {
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining("dukkanpro-backup-"),
        expect.objectContaining({ mimeType: "application/json" }),
      );
      expect(toastSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Sauvegarde créée/i),
      );
    });
  });

  it("restores a picked backup file into an empty database", async () => {
    const json = await seedAndMockPickerFile();
    // Empty database: restore must import without an overwrite prompt.
    await resetTestDb();
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(json);

    await renderScreen(<BackupScreen />);
    pressRestore();

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Restauration terminée/u),
      ),
    );
    expect(alertSpy).not.toHaveBeenCalled();

    // The backed-up shop replaced the empty database row for row.
    expect(await tableCount("products")).toBe(1);
    expect(await tableCount("customers")).toBe(1);
    expect(await tableCount("business_profiles")).toBe(1);
  });

  it("requires an explicit confirmation before overwriting a non-empty database", async () => {
    await seedAndMockPickerFile();
    // The database is non-empty (the seeded shop), so restore must ask first.
    await renderScreen(<BackupScreen />);
    pressRestore();

    let confirmButton: { onPress: () => void } | undefined;
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledTimes(1);
      const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
      confirmButton = buttons.find(
        (button: { style?: string }) => button.style === "destructive",
      );
      expect(confirmButton).toBeDefined();
    });
    expect((Alert.alert as jest.Mock).mock.calls[0][0]).toMatch(
      /Remplacer toutes les données/u,
    );

    // Nothing was written before the confirmation.
    expect(toastSpy).not.toHaveBeenCalled();

    await act(async () => {
      await confirmButton!.onPress();
    });

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Restauration terminée/u),
      ),
    );
    expect(await tableCount("products")).toBe(1);
  });

  it("does nothing when the document picker is canceled", async () => {
    await seedTestProduct({ name: "Keep Product", sku: "KEEP-1" });
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null,
    });

    await renderScreen(<BackupScreen />);
    pressRestore();

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith("Aucun fichier sélectionné."),
    );
    expect(await tableCount("products")).toBe(1);
  });

  it("rejects an invalid file with a clear message and leaves the database untouched", async () => {
    await seedTestProduct({ name: "Keep Product", sku: "KEEP-2" });
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: "file:///mock/junk.json", name: "junk.json", size: 4 },
      ],
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      "this is not json",
    );

    await renderScreen(<BackupScreen />);
    pressRestore();

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        "Ce fichier n'est pas une sauvegarde DukkanPro valide.",
      ),
    );
    expect(await tableCount("products")).toBe(1);
  });
});
