import { Pressable, StyleSheet, View, type ViewProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();

  return (
    <View style={styles.container} {...rest}>
      <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText style={[styles.title, { color: theme.textPrimary }]}>{title}</ThemedText>

        <ThemedText style={[styles.message, { color: theme.textSecondary }]}>{message}</ThemedText>

        <View style={styles.buttons}>
          <Pressable
            style={[styles.cancelButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <ThemedText style={[styles.buttonText, { color: theme.textPrimary }]}>{cancelLabel}</ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.confirmButton,
              { backgroundColor: theme.primary },
              destructive && [styles.destructiveButton, { backgroundColor: theme.destructive }],
            ]}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
          >
            <ThemedText style={[styles.buttonText, { color: "#FFFFFF" }]}>{confirmLabel}</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
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
    borderRadius: Spacing.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: 14,
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
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    flex: 1,
    minHeight: 48,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  destructiveButton: {},
  buttonText: {
    fontSize: 14,
    fontWeight: 600,
  },
});
