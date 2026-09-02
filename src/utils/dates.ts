/**
 * Dukkan OS Date Formatting
 *
 * Formats dates using Intl.DateTimeFormat with locales
 * ar-DZ, fr-DZ, en-DZ for Algerian micro-business merchants.
 */

/**
 * Format a Date object or ISO string using the specified locale.
 *
 * @param date - Date object or ISO string
 * @param locale - Locale string (ar-DZ, fr-DZ, en-DZ)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  locale: 'ar-DZ' | 'fr-DZ' | 'en-DZ' = 'fr-DZ'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Date introuvable';
  }

  switch (locale) {
    case 'ar-DZ':
      // Arabic locale: full date in Arabic, e.g., "٢ سبتمبر ٢٠٢٦"
      return dateObj.toLocaleDateString('ar-DZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });

    case 'fr-DZ':
      // French locale: date in French, e.g., "2 sept. 2026"
      return dateObj.toLocaleDateString('fr-DZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });

    case 'en-DZ':
      // English locale: date in English, e.g., "September 2, 2026"
      return dateObj.toLocaleDateString('en-DZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });

    default:
      return dateObj.toLocaleDateString('fr-DZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
  }
}

/**
 * Format a date relative to "today" using the locale.
 * e.g., "Aujourd'hui", "Hier", "3 jours en arrière"
 *
 * @param date - Date object or ISO string
 * @param locale - Locale string (ar-DZ, fr-DZ, en-DZ)
 * @returns Relative date string
 */
export function formatRelativeDate(
  date: Date | string,
  locale: 'ar-DZ' | 'fr-DZ' | 'en-DZ' = 'fr-DZ'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDay());
  const targetStart = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  );

  const diffMs = Math.abs(targetStart.getTime() - todayStart.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  switch (locale) {
    case 'ar-DZ':
      if (diffDays === 0) return 'اليوم';
      if (diffDays === 1) return 'أمس';
      if (diffDays < 7) return `${diffDays} أيام`;
      return dateObj.toLocaleDateString('ar-DZ', {
        month: 'numeric',
        day: 'numeric',
      });

    case 'fr-DZ':
      if (diffDays === 0) return 'Aujourd\'hui';
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `${diffDays} jours`;
      return dateObj.toLocaleDateString('fr-DZ', {
        month: 'numeric',
        day: 'numeric',
      });

    case 'en-DZ':
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return dateObj.toLocaleDateString('en-DZ', {
        month: 'numeric',
        day: 'numeric',
      });

    default:
      return dateObj.toLocaleDateString('fr-DZ', {
        month: 'numeric',
        day: 'numeric',
      });
  }
}

/**
 * Format a time string (HH:MM) using the locale.
 *
 * @param date - Date object or ISO string (time portion will be used)
 * @param locale - Locale string (ar-DZ, fr-DZ, en-DZ)
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string,
  locale: 'ar-DZ' | 'fr-DZ' | 'en-DZ' = 'fr-DZ'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  switch (locale) {
    case 'ar-DZ':
      return dateObj.toLocaleTimeString('ar-DZ', {
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'fr-DZ':
      return dateObj.toLocaleTimeString('fr-DZ', {
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'en-DZ':
      return dateObj.toLocaleTimeString('en-DZ', {
        hour: '2-digit',
        minute: '2-digit',
      });

    default:
      return dateObj.toLocaleTimeString('fr-DZ', {
        hour: '2-digit',
        minute: '2-digit',
      });
  }
}

/**
 * Format a date and time combined using the locale.
 *
 * @param date - Date object or ISO string
 * @param locale - Locale string (ar-DZ, fr-DZ, en-DZ)
 * @returns Combined date and time string
 */
export function formatDateTime(
  date: Date | string,
  locale: 'ar-DZ' | 'fr-DZ' | 'en-DZ' = 'fr-DZ'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  switch (locale) {
    case 'ar-DZ':
      return dateObj.toLocaleString('ar-DZ', {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'fr-DZ':
      return dateObj.toLocaleString('fr-DZ', {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'en-DZ':
      return dateObj.toLocaleString('en-DZ', {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    default:
      return dateObj.toLocaleString('fr-DZ', {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
  }
}

export type { formatDate, formatRelativeDate, formatTime, formatDateTime };