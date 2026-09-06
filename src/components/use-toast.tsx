import { toast } from "expo-haptics";

/**
 * useToast - A simple toast notification hook
 * Shows a transient message at the bottom of the screen
 */
export function useToast(message?: string, options?: { duration?: number }) {
  const duration = options?.duration ?? 2000;
  // Use expo-haptics toast or a simple alert
  // For now, we'll use a simple approach
  // In a real app, you might use react-native-toast-message or expo-toast
  console.log("Toast:", message);
  // TODO: Replace with proper toast implementation
  if (message) {
    alert(message);
  }
}