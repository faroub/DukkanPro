import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Animated,
  Platform,
  ScrollView,
} from "react-native";
import { SymbolView } from "expo-symbols";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScannerState,
} from "html5-qrcode";

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

const CONTAINER_ELEMENT_ID = "dukkan-barcode-scanner-view";

export function BarcodeScannerModal({
  visible,
  onScan,
  onClose,
  products = [],
  onNavigateToCreateProduct,
  onSearchInCatalog,
}: BarcodeScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [cameraState, setCameraState] = useState<
    "starting" | "active" | "error" | "permission_denied" | "unsupported"
  >("starting");
  const [errorMessage, setErrorMessage] = useState("");
  const [continuousMode, setContinuousMode] = useState(false);
  const [sessionScanCount, setSessionScanCount] = useState(0);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [unmatchedCode, setUnmatchedCode] = useState<string | null>(null);
  const [lastScannedFeedback, setLastScannedFeedback] = useState<{
    name: string;
    priceCentimes: number;
  } | null>(null);

  // Camera device management
  const [availableCameras, setAvailableCameras] = useState<
    { id: string; label: string }[]
  >([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const [laserAnim] = useState(() => new Animated.Value(0));

  // Sound feedback for successful barcode detection
  const playBeep = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1050, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio playback fails gracefully if muted by browser
    }
  }, []);

  // Animate laser scanning reticle
  useEffect(() => {
    if (visible && cameraState === "active") {
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
  }, [visible, cameraState, laserAnim]);

  // Clean stop scanner helper
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED
        ) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Error stopping barcode camera:", err);
      }
      scannerRef.current = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // Product lookup helper
  const findProductByCode = useCallback(
    (code: string): Product | undefined => {
      const trimmed = code.trim().toLowerCase();
      if (!trimmed) return undefined;

      return products.find((p) => {
        if (!p.sku) return false;
        const s = p.sku.trim().toLowerCase();
        // Exact or trimmed or zero-padded variations
        if (s === trimmed) return true;
        const sClean = s.replace(/^0+/, "");
        const tClean = trimmed.replace(/^0+/, "");
        return sClean.length > 0 && sClean === tClean;
      });
    },
    [products]
  );

  // Process a detected or entered code
  const handleCodeFound = useCallback(
    (code: string) => {
      const clean = code.trim();
      if (!clean) return;

      playBeep();
      const product = findProductByCode(clean);

      if (product) {
        if (continuousMode) {
          // Continuous mode: auto-add, display floating toast, keep camera scanning
          onScan(clean, product);
          setSessionScanCount((prev) => prev + 1);
          setLastScannedFeedback({
            name: product.name,
            priceCentimes: product.sale_price_centimes,
          });

          // Clear toast after 2.5 seconds
          setTimeout(() => {
            setLastScannedFeedback(null);
          }, 2500);

          // Allow scanning another item after a 1.2s debounce
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 1200);
        } else {
          // Single-scan mode: show matched product card with quick-add action
          setMatchedProduct(product);
          setUnmatchedCode(null);
        }
      } else {
        // Not in database: show unmatched card with options to create or search
        setUnmatchedCode(clean);
        setMatchedProduct(null);
      }
    },
    [continuousMode, findProductByCode, onScan, playBeep]
  );

  // Start the camera scanning engine
  const startScanner = useCallback(
    async (cameraDeviceId?: string) => {
      if (Platform.OS !== "web" || typeof window === "undefined") {
        setCameraState("unsupported");
        setErrorMessage("Le scanner caméra est optimisé pour les appareils web et mobiles.");
        return;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraState("unsupported");
        setErrorMessage("L'accès à la caméra n'est pas pris en charge par ce navigateur (HTTPS requis).");
        return;
      }

      setCameraState("starting");
      setErrorMessage("");
      setMatchedProduct(null);
      setUnmatchedCode(null);
      setLastScannedFeedback(null);
      setSessionScanCount(0);
      isProcessingRef.current = false;

      try {
        await stopScanner();

        // Ensure container exists in DOM
        let container = document.getElementById(CONTAINER_ELEMENT_ID);
        if (!container) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          container = document.getElementById(CONTAINER_ELEMENT_ID);
        }

        if (!container) {
          setCameraState("error");
          setErrorMessage("Zone d'affichage de la caméra introuvable.");
          return;
        }

        // Query available cameras
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            setAvailableCameras(cameras);
          }
        } catch {
          // Non-fatal if listing cameras fails
        }

        const scanner = new Html5Qrcode(CONTAINER_ELEMENT_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        const cameraConfig = cameraDeviceId
          ? cameraDeviceId
          : { facingMode: "environment" };

        await scanner.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const width = Math.min(Math.floor(viewfinderWidth * 0.88), 320);
              const height = Math.min(Math.floor(viewfinderHeight * 0.65), 180);
              return { width, height };
            },
            aspectRatio: 1.333333,
          },
          (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;
            handleCodeFound(decodedText);
          },
          () => {
            // Scanner parsing cycle without detection: ignore
          }
        );

        setCameraState("active");

        // Inspect torch capability
        try {
          const caps = (scanner as any).getRunningTrackCameraCapabilities?.();
          if (caps?.torchFeature?.()?.isSupported?.()) {
            setTorchSupported(true);
          }
        } catch {
          setTorchSupported(false);
        }
      } catch (err: any) {
        console.warn("Scanner initialization error:", err);
        const name = err?.name || "";
        const msg = (err?.message || "").toLowerCase();

        if (
          name === "NotAllowedError" ||
          name === "PermissionDeniedError" ||
          msg.includes("permission") ||
          msg.includes("denied")
        ) {
          setCameraState("permission_denied");
          setErrorMessage(
            "L'accès à la caméra a été refusé. Veuillez autoriser la caméra dans les paramètres de votre navigateur."
          );
        } else if (name === "NotFoundError" || msg.includes("no camera")) {
          setCameraState("error");
          setErrorMessage("Aucune caméra détectée sur cet appareil.");
        } else {
          setCameraState("error");
          setErrorMessage("Impossible de démarrer la caméra. Vous pouvez saisir le code manuellement.");
        }
      }
    },
    [handleCodeFound, stopScanner]
  );

  // Initialize camera when modal opens
  useEffect(() => {
    let isCancelled = false;

    if (visible) {
      const timer = setTimeout(() => {
        if (!isCancelled) {
          startScanner();
        }
      }, 50);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [visible, startScanner, stopScanner]);

  // Flip / switch camera
  const handleSwitchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const nextIndex = (activeCameraIndex + 1) % availableCameras.length;
    setActiveCameraIndex(nextIndex);
    await startScanner(availableCameras[nextIndex].id);
  };

  // Toggle flashlight / torch
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const nextTorch = !torchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn("Failed to toggle torch:", err);
    }
  };

  // Manual code submission
  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      handleCodeFound(manualCode.trim());
      setManualCode("");
    }
  };

  // Image file scanning fallback
  const handleImageFileSelect = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;
    try {
      const decoded = await scannerRef.current.scanFile(file, true);
      if (decoded) {
        handleCodeFound(decoded);
      }
    } catch {
      setErrorMessage("Aucun code-barres n'a pu être lu depuis cette image.");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} id="barcode-scanner-modal-overlay">
        {/* Inject clean CSS for the camera video stream */}
        {Platform.OS === "web" && (
          <style>{`
            #${CONTAINER_ELEMENT_ID} {
              position: relative !important;
              width: 100% !important;
              height: 230px !important;
              overflow: hidden !important;
              border-radius: 12px !important;
              background-color: #090D16 !important;
            }
            #${CONTAINER_ELEMENT_ID} video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              display: block !important;
            }
            #${CONTAINER_ELEMENT_ID} canvas {
              display: none !important;
            }
            #${CONTAINER_ELEMENT_ID} #qr-shaded-region {
              border-color: rgba(30, 41, 59, 0.6) !important;
            }
          `}</style>
        )}

        <View style={styles.container}>
          {/* Header with Title & Mode Toggle */}
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

          {/* Quick Toolbar: Continuous Scan & Tools */}
          <View style={styles.toolbar}>
            <Pressable
              style={[
                styles.modeToggle,
                continuousMode && styles.modeToggleActive,
              ]}
              onPress={() => setContinuousMode(!continuousMode)}
            >
              <SymbolView
                name={{
                  ios: "repeat" as any,
                  android: "autorenew" as any,
                  web: "autorenew" as any,
                }}
                size={16}
                tintColor={
                  continuousMode ? Colors.light.primary : Colors.light.textSecondary
                }
              />
              <ThemedText
                style={[
                  styles.modeToggleText,
                  continuousMode && styles.modeToggleTextActive,
                ]}
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Camera Viewfinder Area */}
            <View style={styles.viewfinderWrapper}>
              {/* Camera DOM mounting element */}
              <View
                id={CONTAINER_ELEMENT_ID}
                nativeID={CONTAINER_ELEMENT_ID}
                style={styles.cameraBox}
              />

              {/* Reticle Overlay on top of Camera */}
              {cameraState === "active" && (
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

              {/* Camera Overlaid Controls (Flash & Flip) */}
              {cameraState === "active" && (
                <View style={styles.cameraControls}>
                  {availableCameras.length > 1 && (
                    <Pressable
                      style={styles.cameraControlBtn}
                      onPress={handleSwitchCamera}
                      accessibilityLabel="Changer de caméra"
                    >
                      <SymbolView
                        name={{
                          ios: "camera.rotate" as any,
                          android: "flip_camera_ios" as any,
                          web: "flip_camera_ios" as any,
                        }}
                        size={18}
                        tintColor="#FFFFFF"
                      />
                    </Pressable>
                  )}

                  {torchSupported && (
                    <Pressable
                      style={[
                        styles.cameraControlBtn,
                        torchOn && styles.cameraControlBtnActive,
                      ]}
                      onPress={handleToggleTorch}
                      accessibilityLabel="Activer le flash"
                    >
                      <SymbolView
                        name={{
                          ios: torchOn ? ("bolt.fill" as any) : ("bolt.slash.fill" as any),
                          android: torchOn ? ("flash_on" as any) : ("flash_off" as any),
                          web: torchOn ? ("flash_on" as any) : ("flash_off" as any),
                        }}
                        size={18}
                        tintColor={torchOn ? "#FACC15" : "#FFFFFF"}
                      />
                    </Pressable>
                  )}
                </View>
              )}

              {/* Camera Loading or Error State */}
              {cameraState !== "active" && (
                <View style={styles.cameraFallback}>
                  {cameraState === "starting" ? (
                    <View style={styles.centeredMessage}>
                      <SymbolView
                        name={{
                          ios: "camera.viewfinder" as any,
                          android: "photo_camera" as any,
                          web: "photo_camera" as any,
                        }}
                        size={32}
                        tintColor={Colors.light.primary}
                      />
                      <ThemedText style={styles.fallbackTitle}>
                        Activation de la caméra...
                      </ThemedText>
                      <ThemedText style={styles.fallbackSub}>
                        {"Veuillez autoriser l'accès si demandé par le navigateur"}
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.centeredMessage}>
                      <SymbolView
                        name={{
                          ios: "exclamationmark.triangle" as any,
                          android: "videocam_off" as any,
                          web: "videocam_off" as any,
                        }}
                        size={32}
                        tintColor={Colors.light.warning}
                      />
                      <ThemedText style={styles.fallbackTitle}>
                        Caméra inaccessible
                      </ThemedText>
                      <ThemedText style={styles.fallbackSub}>
                        {errorMessage ||
                          "Veuillez autoriser la caméra dans votre navigateur ou entrer le code ci-dessous."}
                      </ThemedText>
                      <Pressable
                        style={styles.retryBtn}
                        onPress={() => startScanner()}
                      >
                        <ThemedText style={styles.retryBtnText}>
                          Réessayer la caméra
                        </ThemedText>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* Floating Toast in Continuous Mode */}
              {lastScannedFeedback && (
                <View style={styles.floatingToast}>
                  <SymbolView
                    name={{
                      ios: "checkmark.circle.fill" as any,
                      android: "check_circle" as any,
                      web: "check_circle" as any,
                    }}
                    size={18}
                    tintColor={Colors.light.success}
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

            {/* Matched Product Card (Single Scan Mode) */}
            {matchedProduct && (
              <View style={styles.matchedCard}>
                <View style={styles.matchedBadgeRow}>
                  <View style={styles.successBadge}>
                    <SymbolView
                      name={{
                        ios: "checkmark" as any,
                        android: "check" as any,
                        web: "check" as any,
                      }}
                      size={14}
                      tintColor={Colors.light.success}
                    />
                    <ThemedText style={styles.successBadgeText}>
                      Produit identifié
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.skuTag}>
                    SKU: {matchedProduct.sku}
                  </ThemedText>
                </View>

                <ThemedText style={styles.matchedName}>
                  {matchedProduct.name}
                </ThemedText>

                <View style={styles.matchedDetailsRow}>
                  <ThemedText style={styles.matchedPrice}>
                    {formatCentimes(matchedProduct.sale_price_centimes)}
                  </ThemedText>
                  <View
                    style={[
                      styles.stockPill,
                      matchedProduct.stock_quantity <=
                        (matchedProduct.minimum_stock_quantity || 0) &&
                        styles.stockPillLow,
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

            {/* Unmatched Code Alert Card */}
            {unmatchedCode && (
              <View style={styles.unmatchedCard}>
                <View style={styles.unmatchedHeader}>
                  <SymbolView
                    name={{
                      ios: "questionmark.circle" as any,
                      android: "help_outline" as any,
                      web: "help_outline" as any,
                    }}
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
                        name={{
                          ios: "plus.circle" as any,
                          android: "add_circle_outline" as any,
                          web: "add_circle_outline" as any,
                        }}
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
                    <ThemedText style={styles.resumeScanText}>
                      Reprendre le scan
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Manual Code Input Section */}
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
                  style={[
                    styles.validateBtn,
                    !manualCode.trim() && styles.validateBtnDisabled,
                  ]}
                  onPress={handleManualSubmit}
                  disabled={!manualCode.trim()}
                >
                  <ThemedText style={styles.validateBtnText}>
                    Chercher
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Optional Image Upload Fallback */}
            {Platform.OS === "web" && (
              <View style={styles.uploadSection}>
                <input
                  type="file"
                  accept="image/*"
                  id="barcode-image-file-input"
                  style={{ display: "none" }}
                  onChange={handleImageFileSelect}
                />
                <Pressable
                  style={styles.uploadBtn}
                  onPress={() => {
                    if (typeof document !== "undefined") {
                      document.getElementById("barcode-image-file-input")?.click();
                    }
                  }}
                >
                  <SymbolView
                    name={{
                      ios: "photo" as any,
                      android: "image" as any,
                      web: "image" as any,
                    }}
                    size={16}
                    tintColor={Colors.light.textSecondary}
                  />
                  <ThemedText style={styles.uploadBtnText}>
                    {"Scanner une photo ou capture d'un code-barres"}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </ScrollView>
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
    backgroundColor: Colors.light.successLight,
  },
  countBadgeText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.light.success,
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
    ...StyleSheet.absoluteFillObject,
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
    ...StyleSheet.absoluteFillObject,
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
    ...Typography.heading4,
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
    ...Typography.bodySmall,
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
    borderColor: Colors.light.success,
  },
  floatingToastTitle: {
    ...Typography.bodySmall,
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
    backgroundColor: Colors.light.successLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
  },
  successBadgeText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.light.success,
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
    ...Typography.bodySmall,
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
    ...Typography.bodySmall,
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
    ...Typography.bodySmall,
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
    ...Typography.bodySmall,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  uploadSection: {
    alignItems: "center",
    paddingTop: 4,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  uploadBtnText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textDecorationLine: "underline",
  },
});
