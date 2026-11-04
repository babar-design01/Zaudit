import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * The gate on `/admin`: one shared password, set as `ADMIN_PASSWORD`. Without it
 * the page does not exist at all, so a deployment is closed until someone
 * chooses to open it.
 *
 * The cookie holds a keyed hash of the password rather than a session, so there
 * is nothing to store, and changing the password signs everyone out.
 */

const COOKIE = 'audix_admin';
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const ATTEMPTS = { windowMs: 15 * 60_000, max: 8 };

const attempts = new Map<string, number[]>();

export const adminEnabled = () => !!process.env.ADMIN_PASSWORD;

const sessionToken = () => createHmac('sha256', process.env.ADMIN_PASSWORD as string).update('audix-admin-session').digest('hex');

function same(a: string, b: string): boolean {
  // Hashed first so the comparison takes the same time whatever the length.
  const hash = (s: string) => createHmac('sha256', 'audix-admin-compare').update(s).digest();
  return timingSafeEqual(hash(a), hash(b));
}

export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return !!value && same(value, sessionToken());
}

/** Per process and in memory, like the audit's own limit: it slows a guesser rather than stopping a determined one. */
function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < ATTEMPTS.windowMs);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > ATTEMPTS.max;
}

export async function signIn(password: string, ip: string): Promise<'ok' | 'wrong' | 'limited'> {
  if (!adminEnabled()) return 'wrong';
  if (tooManyAttempts(ip)) return 'limited';
  if (!same(password, process.env.ADMIN_PASSWORD as string)) return 'wrong';
  (await cookies()).set(COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: THIRTY_DAYS,
  });
  return 'ok';
}

export async function signOut(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: '/admin' });
}
