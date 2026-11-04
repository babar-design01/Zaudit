/** Longer than this would not fit in a usage record, and no real address gets close. */
const EMAIL_MAX = 120;

/**
 * The address in the form it is stored, or null when it cannot be one. This only
 * checks the shape: nothing confirms the person owns it.
 */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length > EMAIL_MAX) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}
