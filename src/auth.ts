import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { WELCOME_CREDITS, grant } from '@/lib/credits';
import { accounts, db, sessions, users, verificationTokens } from '@/lib/db';

/**
 * Sign-in, by emailed link and nothing else.
 *
 * There is no password to store, reset or leak, and no OAuth app to keep alive.
 * The cost is a round trip through an inbox, which for a tool people reach for
 * every few weeks is a fair trade.
 *
 * Without a database this exports a configuration that refuses to sign anyone
 * in, which is what the rest of the app expects when accounts are switched off:
 * `accountsEnabled()` is false, the audit route asks for nothing, and no part
 * of the page offers an account.
 */

const from = process.env.AUTH_EMAIL_FROM || 'Audix <hello@audix.com>';

const adapter = (() => {
  const on = db();
  if (!on) return undefined;
  return DrizzleAdapter(on, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  });
})();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  // Sessions live in the database, so signing out of one device is real and a
  // deleted account stops working immediately.
  session: { strategy: 'database', maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  pages: { signIn: '/signin', verifyRequest: '/signin?sent=1', error: '/signin' },
  providers: process.env.AUTH_RESEND_KEY
    ? [
        Resend({
          apiKey: process.env.AUTH_RESEND_KEY,
          from,
          // 15 minutes: long enough to find the mail, short enough that a link
          // left in an inbox is not a standing key to the account.
          maxAge: 15 * 60,
        }),
      ]
    : [],
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  events: {
    // The free audit the pricing page promises, granted once, at the only
    // moment we know the account is new.
    async createUser({ user }) {
      if (user.id) await grant(user.id, WELCOME_CREDITS, 'welcome', { ref: `welcome:${user.id}`, note: 'First audit, on the house' });
    },
  },
});
