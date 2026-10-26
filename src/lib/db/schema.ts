import { randomUUID } from 'node:crypto';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

/**
 * Everything that outlives one request.
 *
 * Four of these tables belong to Auth.js and have the shape its Drizzle adapter
 * expects — changing a column name here breaks sign-in, not just a query. The
 * other three are ours: what a run cost, what was bought, and what happened.
 *
 * Credits are a **ledger, not a counter**. A balance you decrement is a number
 * nobody can audit: when a customer says they were charged twice there is
 * nothing to look at. Here every change is a row with a reason and a reference,
 * the balance is their sum, and a refund is another row rather than an edit.
 */

const id = () => text('id').primaryKey().$defaultFn(() => randomUUID());
const now = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

/* ----------------------------------------------------------- Auth.js */

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  /** Set once the customer exists in Stripe, so a second purchase reuses it. */
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: now(),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable('session', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_token',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ------------------------------------------------------------ credits */

/** Why a row exists. Every balance change names one of these. */
export type LedgerReason = 'welcome' | 'purchase' | 'audit' | 'refund' | 'adjustment';

export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Positive grants, negative spends. The balance is the sum. */
    delta: integer('delta').notNull(),
    reason: text('reason').$type<LedgerReason>().notNull(),
    /** The run this paid for, where there is one. */
    runId: text('run_id'),
    /**
     * The outside event that caused this row — a Stripe event id, or the run id
     * for a refund. Unique, so replaying a webhook cannot grant twice.
     */
    ref: text('ref'),
    note: text('note'),
    createdAt: now(),
  },
  (t) => [
    index('credit_ledger_user_idx').on(t.userId, t.createdAt),
    uniqueIndex('credit_ledger_ref_idx').on(t.ref).where(sql`${t.ref} is not null`),
  ],
);

/* --------------------------------------------------------------- runs */

export type RunStatus = 'running' | 'done' | 'failed';

/**
 * One audit, kept so a report link survives, so a re-audit can be compared with
 * the last one, and so a refund can point at the run that failed.
 */
export const auditRuns = pgTable(
  'audit_run',
  {
    /** The engine's own report id, so `/report/<id>` and this row agree. */
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    url: text('url').notNull(),
    /** Host alone, so "every run against acme.com" is one index away. */
    host: text('host').notNull(),
    goal: text('goal').notNull(),
    status: text('status').$type<RunStatus>().notNull().default('running'),
    overall: integer('overall'),
    band: text('band'),
    findings: integer('findings'),
    /** Whether this run cost a credit, so a refund knows there is one to give back. */
    charged: boolean('charged').notNull().default(false),
    error: text('error'),
    /** The pillar scores, for a comparison that does not need the whole report. */
    pillars: jsonb('pillars').$type<{ id: string; score: number | null }[]>(),
    tookMs: integer('took_ms'),
    createdAt: now(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => [
    index('audit_run_user_idx').on(t.userId, t.createdAt),
    index('audit_run_host_idx').on(t.host, t.createdAt),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  ledger: many(creditLedger),
  runs: many(auditRuns),
}));

export const ledgerRelations = relations(creditLedger, ({ one }) => ({
  user: one(users, { fields: [creditLedger.userId], references: [users.id] }),
}));

export const runRelations = relations(auditRuns, ({ one }) => ({
  user: one(users, { fields: [auditRuns.userId], references: [users.id] }),
}));
