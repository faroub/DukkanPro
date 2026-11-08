import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { FooterTrademark } from "@/components/FooterTrademark";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { showToast } from "@/components/use-toast";
import {
  BorderRadius,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useCartStore } from "@/stores/cartStore";
import { useTheme } from "@/hooks/use-theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBackup, restoreBackup } from "@/services/backup/backupService";
import type { RestoreSummary } from "@/services/backup/backupService";

/**
 * BackupScreen - Full-data JSON backup & restore (see docs/BACKUP_RESTORE.md).
 * - "Create backup" snapshots every table into one JSON file and offers it to
 *   the OS share sheet.
 * - "Restore backup" picks a backup file, and replaces ALL local data in one
 *   atomic transaction, but only after an explicit overwrite confirmation
 *   when the database is not empty.
 */

type Translate = ReturnType<typeof useTranslation>["t"];

/** Map a typed restoreBackup error prefix to a localized message. */
function restoreErrorMessage(message: string, t: Translate): string {
  const detail = message.slice(message.indexOf(":") + 1).trim();
  if (message.startsWith("UNSUPPORTED_BACKUP_VERSION")) {
    return t("backup.unsupportedVersion");
  }
  if (message.startsWith("BACKUP_NEWER_VERSION")) {
    return t("backup.newerVersion");
  }
  if (message.startsWith("INVALID_BACKUP_CONTENT")) {
    return t("backup.invalidContent", { detail });
  }
  if (message.startsWith("BROKEN_REFERENCES")) {
    return t("backup.brokenReferences");
  }
  if (message.startsWith("RESTORE_INCONSISTENT")) {
    return t("backup.restoreInconsistent");
  }
  return t("backup.invalidFile");
}

export function BackupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // The overwrite-confirmation alert is triggered from inside runRestore, and
  // its confirm action must re-run runRestore — a ref breaks that self
  // reference so the callback never reads itself before declaration.
  const runRestoreRef = useRef<
    (fileContents: string, confirmOverwrite: boolean) => Promise<void>
  >(async () => {});

  const handleCreateBackup = useCallback(async () => {
    setIsCreating(true);
    try {
      const { uri } = await createBackup();
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/json",
          dialogTitle: t("backup.title") || "DukkanPro backup",
        });
      } else {
        showToast(
          t("backup.sharingUnavailable") ||
            "Sharing is unavailable; the backup file was saved inside the app storage.",
        );
      }
      showToast(
        t("backup.createSuccess") ||
          "Backup created. Share it or keep it somewhere safe.",
      );
    } catch (error) {
      console.error("Backup creation error:", error);
      showToast(t("backup.error") || "Backup operation failed.");
    } finally {
      setIsCreating(false);
    }
  }, [t]);

  const runRestore = useCallback(
    async (fileContents: string, confirmOverwrite: boolean) => {
      setIsRestoring(true);
      try {
        const summary: RestoreSummary = await restoreBackup(fileContents, {
          confirmOverwrite,
        });
        // Restored data invalidates any in-memory cart.
        useCartStore.getState().clearCart();
        showToast(
          t("backup.restoreSuccess", {
            rows: summary.rowsImported,
            defaultValue: `Restore complete: ${summary.rowsImported} rows imported.`,
          }),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.startsWith("OVERWRITE_REQUIRED")) {
          Alert.alert(
            t("backup.overwriteTitle") || "Replace all current data?",
            t("backup.overwriteMessage") ||
              "This device already contains data. Restoring this backup will permanently replace all of it. This cannot be undone.",
            [
              { text: t("common.cancel") || "Cancel", style: "cancel" },
              {
                text: t("backup.overwriteConfirm") || "Replace Data",
                style: "destructive",
                onPress: () => {
                  void runRestoreRef.current(fileContents, true);
                },
              },
            ],
          );
          return;
        }
        console.error("Backup restore error:", error);
        showToast(restoreErrorMessage(message, t));
      } finally {
        setIsRestoring(false);
      }
    },
    [t],
  );

  useEffect(() => {
    runRestoreRef.current = runRestore;
  }, [runRestore]);

  const handleRestoreBackup = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) {
        showToast(t("backup.pickCanceled") || "No file selected.");
        return;
      }
      const fileContents = await FileSystem.readAsStringAsync(
        result.assets[0].uri,
        { encoding: FileSystem.EncodingType.UTF8 },
      );
      await runRestore(fileContents, false);
    } catch (error) {
      console.error("Backup file read error:", error);
      showToast(t("backup.error") || "Backup operation failed.");
    }
  }, [runRestore, t]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        {
          backgroundColor: theme.background,
          paddingTop: Math.max(insets.top, Spacing.lg),
          paddingBottom: insets.bottom + Spacing.xxl,
          paddingLeft: insets.left + Spacing.lg,
          paddingRight: insets.right + Spacing.lg,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.container}>
        {/* Breadcrumb Context */}
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.textSecondary}
          />
          <ThemedText
            style={[styles.breadcrumbText, { color: theme.textSecondary }]}
          >
            {t("navigation.back") || "Back"}
          </ThemedText>
        </TouchableOpacity>

        {/* Screen Header */}
        <View style={styles.headerSection}>
          <ThemedText
            style={[styles.headingTitle, { color: theme.textPrimary }]}
          >
            {t("backup.title") || "Backup & Restore"}
          </ThemedText>
          <ThemedText
            style={[styles.headingSubtitle, { color: theme.textSecondary }]}
          >
            {t("backup.subtitle") || "Full offline data backup"}
          </ThemedText>
        </View>

        {/* Section 1: Create backup */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeaderLeft}>
            <View
              style={[
                styles.createIconContainer,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <MaterialIcons name="backup" size={20} color={theme.primary} />
            </View>
            <View>
              <ThemedText
                style={[styles.sectionTitle, { color: theme.textPrimary }]}
              >
                {t("backup.createTitle") || "Create a Backup"}
              </ThemedText>
              <ThemedText
                style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
              >
                {t("backup.subtitle") || "Full offline data backup"}
              </ThemedText>
            </View>
          </View>

          <ThemedText
            style={[styles.sectionDescription, { color: theme.textSecondary }]}
          >
            {t("backup.createDesc") ||
              "Export every product, customer, sale, payment and inventory movement into a single JSON file."}
          </ThemedText>

          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: isCreating ? theme.disabledBackground : theme.primary },
            ]}
            onPress={handleCreateBackup}
            disabled={isCreating || isRestoring}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t("backup.createButton") || "Create Backup"}
          >
            <MaterialIcons name="file-upload" size={20} color="#FFFFFF" />
            <ThemedText style={[styles.createButtonText, { color: "#FFFFFF" }]}>
              {isCreating
                ? t("backup.creating") || "Creating backup…"
                : t("backup.createButton") || "Create Backup"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Divider / Zone Break */}
        <View style={styles.zoneDivider}>
          <View
            style={[styles.dividerLine, { backgroundColor: theme.borderLight }]}
          />
          <View
            style={[styles.dangerZonePill, { backgroundColor: theme.surfaceAlt }]}
          >
            <MaterialIcons name="dangerous" size={16} color={theme.error} />
            <ThemedText
              style={[styles.dangerZoneText, { color: theme.textSecondary }]}
            >
              {t("dataReset.dangerZone") || "OR / DANGER ZONE"}
            </ThemedText>
          </View>
          <View
            style={[styles.dividerLine, { backgroundColor: theme.borderLight }]}
          />
        </View>

        {/* Section 2: Restore (destructive — replaces all data) */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeaderLeft}>
            <View
              style={[
                styles.restoreIconContainer,
                { backgroundColor: theme.errorLight },
              ]}
            >
              <MaterialIcons name="restore" size={20} color={theme.error} />
            </View>
            <View>
              <ThemedText
                style={[styles.sectionTitle, { color: theme.textPrimary }]}
              >
                {t("backup.restoreTitle") || "Restore from a Backup File"}
              </ThemedText>
              <ThemedText
                style={[styles.sectionSubtitle, { color: theme.error }]}
              >
                {t("dataReset.factoryResetSubtitle") ||
                  "Irreversible database erasure"}
              </ThemedText>
            </View>
          </View>

          <ThemedText
            style={[styles.sectionDescription, { color: theme.textSecondary }]}
          >
            {t("backup.restoreDesc") ||
              "Replace ALL current data on this device with the contents of a backup file. This cannot be undone."}
          </ThemedText>

          <TouchableOpacity
            style={[
              styles.restoreButton,
              {
                backgroundColor:
                  isRestoring ? theme.disabledBackground : theme.error,
              },
            ]}
            onPress={handleRestoreBackup}
            disabled={isCreating || isRestoring}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t("backup.restoreButton") || "Restore Backup"}
          >
            <MaterialIcons name="file-download" size={20} color="#FFFFFF" />
            <ThemedText
              style={[styles.restoreButtonText, { color: "#FFFFFF" }]}
            >
              {isRestoring
                ? t("backup.restoring") || "Restoring data…"
                : t("backup.restoreButton") || "Restore Backup"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <FooterTrademark />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "transparent",
    gap: Spacing.md,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    alignSelf: "flex-start",
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerSection: {
    gap: Spacing.xs,
  },
  headingTitle: {
    ...Typography.heading2,
  },
  headingSubtitle: {
    ...Typography.caption,
  },
  sectionCard: {
    padding: ComponentDimensions.cardPadding,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  createIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.button,
    ...Shadows.sm,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  zoneDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dangerZonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginHorizontal: 8,
  },
  dangerZoneText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.button,
    ...Shadows.sm,
  },
  restoreButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
