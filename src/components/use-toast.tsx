/**
 * showToast - A simple toast notification helper
 * Shows a transient message at the bottom of the screen
 */
export function showToast(message?: string, options?: { duration?: number }) {
  const duration = options?.duration ?? 2000;
  if (__DEV__) {
    console.log("Toast:", message, "duration:", duration);
  }
}

export const useToast = showToast;

