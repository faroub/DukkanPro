import { Pressable, StyleSheet, type ViewProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export interface ConfirmDialogProps extends ViewProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  confirmLabel: string;
  cancelLabel: string;
  locale?: "ar" | "fr" | "en";
}

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  destructive = false,
  confirmLabel,
  cancelLabel,
  locale = "fr",
  ...rest
}: ConfirmDialogProps) {
  return (
    <ThemedView type="background" style={styles.container} {...rest}>
      <ThemedView style={styles.dialog}>
        <ThemedText style={styles.title}>{title}</ThemedText>

        <ThemedText style={styles.message}>{message}</ThemedText>

        <ThemedView style={styles.buttons}>
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <ThemedText style={styles.buttonText}>{cancelLabel}</ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.confirmButton,
              destructive && styles.destructiveButton,
            ]}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
          >
            <ThemedText style={styles.buttonText}>{confirmLabel}</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dialog: {
    width: "80%",
    maxWidth: 350,
    backgroundColor: "#FFFFFF",
    borderRadius: Spacing.lg,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: 14,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#1B6B3A",
    minHeight: 48,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
  },
  destructiveButton: {
    backgroundColor: "#B91C1C",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 500,
  },
});
