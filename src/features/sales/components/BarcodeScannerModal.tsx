import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions, type BarcodeType } from "expo-camera";
import { SymbolView } from "expo-symbols";

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
import { Product } from "@/types/entities";
import { formatCentimes } from "@/utils/money";

export interface BarcodeScannerModalProps {
  visible: boolean;
  onScan: (code: string, matchedProduct?: Product) => void;
  onClose: () => void;
  products?: Product[];
  onNavigateToCreateProduct?: (sku: string) => void;
  onSearchInCatalog?: (code: string) => void;
}

// Parity with the web (html5-qrcode) format list.
const BARCODE_TYPES: BarcodeType[] = [
  "ean13",
  "ean8",
  "code128",
  "code39",
  "code93",
  "upc_a",
  "upc_e",
  "qr",
  "itf14",
  "datamatrix",
];

export function BarcodeScannerModal({
  visible,
  onScan,
  onClose,
  products = [],
  onNavigateToCreateProduct,
  onSearchInCatalog,
}: BarcodeScannerModalProps) {
  // `request: true` prompts for camera access when the modal mounts (i.e. when
  // the user opens the scanner), mirroring the browser permission prompt.
  const [permission, requestPermission] = useCameraPermissions({ request: true });
  const [manualCode, setManualCode] = useState("");
  const [continuousMode, setContinuousMode] = useState(false);
  const [sessionScanCount, setSessionScanCount] = useState(0);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [unmatchedCode, setUnmatchedCode] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [lastScannedFeedback, setLastScannedFeedback] = useState<{
    name: string;
    priceCentimes: number;
  } | null>(null);

  const isProcessingRef = useRef(false);
  const [laserAnim] = useState(() => new Animated.Value(0));

  // Product lookup — same matching rules as the web modal and SellScreen.
  const findProductByCode = useCallback(
    (code: string): Product | undefined => {
      const trimmed = code.trim().toLowerCase();
      if (!trimmed) return undefined;

      return products.find((p) => {
        if (!p.sku) return false;
        const s = p.sku.trim().toLowerCase();
        if (s === trimmed) return true;
        const sClean = s.replace(/^0+/, "");
        const tClean = trimmed.replace(/^0+/, "");
        return sClean.length > 0 && sClean === tClean;
      });
    },
    [products]
  );

  const handleCodeFound = useCallback(
    (code: string) => {
      const clean = code.trim();
      if (!clean) return;

      const product = findProductByCode(clean);

      if (product) {
        onScan(clean, product);
        setSessionScanCount((prev) => prev + 1);
        setMatchedProduct(product);
        setUnmatchedCode(null);
        setLastScannedFeedback({
          name: product.name,
          priceCentimes: product.sale_price_centimes,
        });

        setTimeout(() => setLastScannedFeedback(null), 2500);
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1000);
      } else {
        setUnmatchedCode(clean);
        setMatchedProduct(null);
        isProcessingRef.current = false;
      }
    },
    [findProductByCode, onScan]
  );

  const onBarcodeScanned = useCallback(
    (result: { data: string }) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      handleCodeFound(result.data);
    },
    [handleCodeFound]
  );

  // Permission denied permanently: the OS won't show the prompt again, so the
  // only way back is the system settings screen for this app.
  const handleRequestPermission = () => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Linking.openSettings();
    } else {
      requestPermission();
    }
  };

  // Laser reticle animation while the camera preview is live.
  useEffect(() => {
    if (visible && cameraReady) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible, cameraReady, laserAnim]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      handleCodeFound(manualCode.trim());
      setManualCode("");
    }
  };

  const cameraActive = visible && !!permission && permission.granted;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ThemedText style={styles.title}>Scanner Code-Barres</ThemedText>
              <ThemedText style={styles.subtitle}>
                Pointez la caméra vers le code-barres ou le SKU
              </ThemedText>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={8}
              accessibilityLabel="Fermer le scanner"
            >
              <SymbolView
                name={{ ios: "xmark" as any, android: "close" as any }}
                size={18}
                tintColor={Colors.light.textSecondary}
              />
            </Pressable>
          </View>

          {/* Toolbar */}
          <View style={styles.toolbar}>
            <Pressable
              style={[styles.modeToggle, continuousMode && styles.modeToggleActive]}
              onPress={() => setContinuousMode(!continuousMode)}
            >
              <SymbolView
                name={{ ios: "repeat" as any, android: "autorenew" as any }}
                size={16}
                tintColor={
                  continuousMode ? Colors.light.primary : Colors.light.textSecondary
                }
              />
              <ThemedText
                style={[styles.modeToggleText, continuousMode && styles.modeToggleTextActive]}
              >
                Scan continu {continuousMode ? "Activé" : "Désactivé"}
              </ThemedText>
            </Pressable>

            {sessionScanCount > 0 && (
              <View style={styles.countBadge}>
                <ThemedText style={styles.countBadgeText}>
                  {sessionScanCount} scanné{sessionScanCount > 1 ? "s" : ""}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.scrollContent}>
            {/* Camera Viewfinder */}
            <View style={styles.viewfinderWrapper}>
              {cameraActive ? (
                <CameraView
                  style={styles.cameraBox}
                  facing="back"
                  enableTorch={torchOn}
                  barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
                  onBarcodeScanned={onBarcodeScanned}
                  onCameraReady={() => setCameraReady(true)}
                  animateShutter={false}
                />
              ) : (
                <View style={styles.cameraFallback}>
                  {permission === null ? (
                    <View style={styles.centeredMessage}>
                      <SymbolView
                        name={{ ios: "camera.viewfinder" as any, android: "photo_camera" as any }}
                        size={32}
                        tintColor={Colors.light.primary}
                      />
                      <ThemedText style={styles.fallbackTitle}>
                        Activation de la caméra...
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.centeredMessage}>
                      <SymbolView
                        name={{ ios: "lock" as any, android: "lock" as any }}
                        size={32}
                        tintColor={Colors.light.warning}
                      />
                      <ThemedText style={styles.fallbackTitle}>
                        Caméra non autorisée
                      </ThemedText>
                      <ThemedText style={styles.fallbackSub}>
                        {permission.canAskAgain
                          ? "Autorisez l'accès à la caméra pour scanner les code-barres."
                          : "L'accès a été refusé. Réactivez la caméra dans les paramètres de l'application."}
                      </ThemedText>
                      <Pressable style={styles.retryBtn} onPress={handleRequestPermission}>
                        <ThemedText style={styles.retryBtnText}>
                          {permission.canAskAgain
                            ? "Autoriser la caméra"
                            : "Ouvrir les paramètres"}
                        </ThemedText>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* Reticle overlay */}
              {cameraActive && cameraReady && (
                <View style={styles.reticleOverlay} pointerEvents="none">
                  <View style={styles.reticle}>
                    <View style={[styles.corner, styles.tl]} />
                    <View style={[styles.corner, styles.tr]} />
                    <View style={[styles.corner, styles.bl]} />
                    <View style={[styles.corner, styles.br]} />

                    <Animated.View
                      style={[
                        styles.scanLaser,
                        {
                          transform: [
                            {
                              translateY: laserAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-45, 45],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.scanHint}>
                    Alignez le code dans le rectangle
                  </ThemedText>
                </View>
              )}

              {/* Torch toggle */}
              {cameraActive && cameraReady && (
                <View style={styles.cameraControls}>
                  <Pressable
                    style={[styles.cameraControlBtn, torchOn && styles.cameraControlBtnActive]}
                    onPress={() => setTorchOn((v) => !v)}
                    accessibilityLabel="Activer le flash"
                  >
                    <SymbolView
                      name={{
                        ios: torchOn ? ("bolt.fill" as any) : ("bolt.slash.fill" as any),
                        android: torchOn ? ("flash_on" as any) : ("flash_off" as any),
                      }}
                      size={18}
                      tintColor={torchOn ? "#FACC15" : "#FFFFFF"}
                    />
                  </Pressable>
                </View>
              )}

              {/* Floating scan feedback toast */}
              {lastScannedFeedback && (
                <View style={styles.floatingToast}>
                  <SymbolView
                    name={{ ios: "checkmark.circle.fill" as any, android: "check_circle" as any }}
                    size={18}
                    tintColor={Colors.light.positive}
                  />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.floatingToastTitle} numberOfLines={1}>
                      {lastScannedFeedback.name}
                    </ThemedText>
                    <ThemedText style={styles.floatingToastSub}>
                      +1 au panier • {formatCentimes(lastScannedFeedback.priceCentimes)}
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>

            {/* Matched Product Card */}
            {matchedProduct && (
              <View style={styles.matchedCard}>
                <View style={styles.matchedBadgeRow}>
                  <View style={styles.successBadge}>
                    <SymbolView
                      name={{ ios: "checkmark" as any, android: "check" as any }}
                      size={14}
                      tintColor={Colors.light.positive}
                    />
                    <ThemedText style={styles.successBadgeText}>Produit identifié</ThemedText>
                  </View>
                  <ThemedText style={styles.skuTag}>SKU: {matchedProduct.sku}</ThemedText>
                </View>

                <ThemedText style={styles.matchedName}>{matchedProduct.name}</ThemedText>

                <View style={styles.matchedDetailsRow}>
                  <ThemedText style={styles.matchedPrice}>
                    {formatCentimes(matchedProduct.sale_price_centimes)}
                  </ThemedText>
                  <View
                    style={[
                      styles.stockPill,
                      matchedProduct.stock_quantity <=
                        (matchedProduct.minimum_stock_quantity || 0) && styles.stockPillLow,
                    ]}
                  >
                    <ThemedText style={styles.stockPillText}>
                      Stock: {matchedProduct.stock_quantity} {matchedProduct.unit || "pcs"}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.matchedActions}>
                  <PrimaryButton
                    title="Ajouter au panier (+1)"
                    onPress={() => {
                      onScan(matchedProduct.sku || "", matchedProduct);
                      onClose();
                    }}
                  />
                  <Pressable
                    style={styles.scanAgainBtn}
                    onPress={() => {
                      setMatchedProduct(null);
                      isProcessingRef.current = false;
                    }}
                  >
                    <ThemedText style={styles.scanAgainText}>
                      Scanner un autre article
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Unmatched Code Card */}
            {unmatchedCode && (
              <View style={styles.unmatchedCard}>
                <View style={styles.unmatchedHeader}>
                  <SymbolView
                    name={{ ios: "questionmark.circle" as any, android: "help_outline" as any }}
                    size={20}
                    tintColor={Colors.light.warning}
                  />
                  <ThemedText style={styles.unmatchedTitle}>
                    Article non trouvé ({unmatchedCode})
                  </ThemedText>
                </View>
                <ThemedText style={styles.unmatchedDesc}>
                  {"Ce code-barres n'est pas encore enregistré dans votre stock."}
                </ThemedText>

                <View style={styles.unmatchedActions}>
                  {onNavigateToCreateProduct && (
                    <Pressable
                      style={styles.createProductBtn}
                      onPress={() => {
                        onClose();
                        onNavigateToCreateProduct(unmatchedCode);
                      }}
                    >
                      <SymbolView
                        name={{ ios: "plus.circle" as any, android: "add_circle_outline" as any }}
                        size={16}
                        tintColor="#FFFFFF"
                      />
                      <ThemedText style={styles.createProductBtnText}>
                        Créer ce produit
                      </ThemedText>
                    </Pressable>
                  )}

                  {onSearchInCatalog && (
                    <Pressable
                      style={styles.searchCatalogBtn}
                      onPress={() => {
                        onClose();
                        onSearchInCatalog(unmatchedCode);
                      }}
                    >
                      <ThemedText style={styles.searchCatalogText}>
                        Rechercher dans le catalogue
                      </ThemedText>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.resumeScanBtn}
                    onPress={() => {
                      setUnmatchedCode(null);
                      isProcessingRef.current = false;
                    }}
                  >
                    <ThemedText style={styles.resumeScanText}>Reprendre le scan</ThemedText>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Manual Code Entry */}
            <View style={styles.manualSection}>
              <ThemedText style={styles.manualLabel}>
                Saisie manuelle du code-barres ou SKU :
              </ThemedText>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 6130123456789 ou FL-001"
                  placeholderTextColor={Colors.light.textMuted}
                  value={manualCode}
                  onChangeText={setManualCode}
                  onSubmitEditing={handleManualSubmit}
                  returnKeyType="search"
                  autoCapitalize="characters"
                />
                <Pressable
                  style={[styles.validateBtn, !manualCode.trim() && styles.validateBtnDisabled]}
                  onPress={handleManualSubmit}
                  disabled={!manualCode.trim()}
                >
                  <ThemedText style={styles.validateBtnText}>Chercher</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: ComponentDimensions.screenPadding,
  },
  container: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "90%",
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  title: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  modeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modeToggleActive: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
  },
  modeToggleText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  modeToggleTextActive: {
    color: Colors.light.primary,
  },
  countBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primaryLight,
  },
  countBadgeText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.light.positive,
  },
  scrollContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  viewfinderWrapper: {
    position: "relative",
    width: "100%",
    height: 230,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: "#090D16",
  },
  cameraBox: {
    width: "100%",
    height: "100%",
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  reticle: {
    width: 220,
    height: 120,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: Colors.light.primary,
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  scanLaser: {
    width: "90%",
    height: 2,
    backgroundColor: "#EF4444",
    opacity: 0.85,
    borderRadius: 1,
  },
  scanHint: {
    ...Typography.caption,
    fontSize: 12,
    color: "#E2E8F0",
    marginTop: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cameraControls: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  cameraControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cameraControlBtnActive: {
    backgroundColor: "rgba(250, 204, 21, 0.3)",
    borderColor: "#FACC15",
  },
  cameraFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  centeredMessage: {
    alignItems: "center",
    gap: 6,
    maxWidth: 320,
  },
  fallbackTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
    textAlign: "center",
    marginTop: 4,
  },
  fallbackSub: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
  },
  retryBtnText: {
    ...Typography.label,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  floatingToast: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.positive,
  },
  floatingToastTitle: {
    ...Typography.label,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  floatingToastSub: {
    ...Typography.caption,
    color: "#CBD5E1",
  },
  matchedCard: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  matchedBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primaryLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
  },
  successBadgeText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.light.positive,
    fontSize: 11,
  },
  skuTag: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  matchedName: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  matchedDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  matchedPrice: {
    ...Typography.heading2,
    color: Colors.light.primary,
    fontWeight: "700",
  },
  stockPill: {
    backgroundColor: Colors.light.backgroundElement,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
  },
  stockPillLow: {
    backgroundColor: Colors.light.warningLight,
  },
  stockPillText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  matchedActions: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  scanAgainBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  scanAgainText: {
    ...Typography.label,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  unmatchedCard: {
    backgroundColor: Colors.light.warningLight,
    borderWidth: 1,
    borderColor: Colors.light.warning,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 8,
  },
  unmatchedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unmatchedTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    flex: 1,
  },
  unmatchedDesc: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  unmatchedActions: {
    gap: 8,
    marginTop: 4,
  },
  createProductBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  createProductBtnText: {
    ...Typography.label,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchCatalogBtn: {
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchCatalogText: {
    ...Typography.label,
    fontWeight: "600",
    color: Colors.light.textPrimary,
  },
  resumeScanBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  resumeScanText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  manualSection: {
    gap: 6,
  },
  manualLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    color: Colors.light.textPrimary,
  },
  validateBtn: {
    height: 44,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  validateBtnDisabled: {
    opacity: 0.5,
  },
  validateBtnText: {
    ...Typography.label,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
