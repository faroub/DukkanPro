import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  BorderRadius,
  Colors,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";

interface BarcodeScannerModalProps {
  visible: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScannerModal({
  visible,
  onScan,
  onClose,
}: BarcodeScannerModalProps) {
  const [manualCode, setManualCode] = useState("");

  const handleSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>Scanner Code-Barres</ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <SymbolView
                name={{
                  ios: "xmark" as any,
                  android: "close" as any,
                  web: "close" as any,
                }}
                size={18}
                tintColor={Colors.light.textSecondary}
              />
            </Pressable>
          </View>

          {/* Scanner Viewfinder Box */}
          <View style={styles.viewfinder}>
            <View style={styles.reticle}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
              <View style={styles.scanLaser} />
            </View>
            <ThemedText style={styles.scanHint}>
              Pointez l'appareil vers le code-barres de l'article
            </ThemedText>
          </View>

          {/* Manual Input Fallback */}
          <View style={styles.manualSection}>
            <ThemedText style={styles.manualLabel}>
              Ou saisissez le code manuellement :
            </ThemedText>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ex: 6130123456789 ou SKU"
                placeholderTextColor={Colors.light.textMuted}
                value={manualCode}
                onChangeText={setManualCode}
                onSubmitEditing={handleSubmit}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              title="Valider le code"
              onPress={handleSubmit}
              disabled={!manualCode.trim()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: ComponentDimensions.screenPadding,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    height: 180,
    backgroundColor: "#111827",
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  reticle: {
    width: 140,
    height: 90,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 16,
    height: 16,
    borderColor: "#10B981",
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLaser: {
    width: "100%",
    height: 2,
    backgroundColor: "#EF4444",
    opacity: 0.8,
  },
  scanHint: {
    ...Typography.caption,
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: Spacing.sm,
  },
  manualSection: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  manualLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    height: 48,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.textPrimary,
    paddingVertical: 0,
  },
  actions: {
    gap: Spacing.xs,
  },
});
