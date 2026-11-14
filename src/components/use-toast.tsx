import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface ToastData {
  id: number;
  message: string;
  duration: number;
}

type ToastListener = (toast: ToastData) => void;
const listeners = new Set<ToastListener>();

export function _resetToastForTesting() {
  listeners.clear();
}

/**
 * showToast - Transmit transient toast message across the application.
 */
export function showToast(message?: string, options?: { duration?: number }) {
  if (!message) return;
  const duration = options?.duration ?? 2500;
  const payload: ToastData = {
    id: Date.now() + Math.random(),
    message,
    duration,
  };
  if (__DEV__) {
    console.log("Toast:", message, "duration:", duration);
  }
  listeners.forEach((listener) => listener(payload));
}

export const useToast = showToast;

/**
 * ToastHost - UI container mounted once in _layout.tsx.
 * Listens for toast events and renders a transient non-blocking toast overlay.
 */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleToast = (toast: ToastData) => {
      setCurrentToast(toast);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();

      clearTimeout(timer);
      timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setCurrentToast(null);
        });
      }, toast.duration);
    };

    listeners.add(handleToast);

    return () => {
      listeners.delete(handleToast);
      clearTimeout(timer);
    };
  }, [fadeAnim]);

  if (!currentToast) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.hostOverlay,
        { bottom: Math.max(insets.bottom + Spacing.lg, 28) },
      ]}
      testID="toast-host-container"
    >
      <Animated.View
        style={[
          styles.toastCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={[styles.toastText, { color: theme.textPrimary }]}>
          {currentToast.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hostOverlay: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  toastCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    maxWidth: 420,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
