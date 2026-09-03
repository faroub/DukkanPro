import { useEffect, useState } from "react";

/**
 * useDebounce hook - delays value updates
 *
 * Returns a debounced value that only updates after `delay` milliseconds
 * of no changes to the input.
 *
 * Usage:
 *  const debouncedSearch = useDebounce(searchQuery, 300);
 */
export function useDebounce(value: string, delay: number = 300): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debounced;
}