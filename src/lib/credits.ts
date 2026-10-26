import { and, desc, eq, sql } from 'drizzle-orm';
import { auditRuns, creditLedger, db, type Db, type LedgerReason } from '@/lib/db';

/**
 * Credits.
 *
 * One credit is one audit run. It is taken before the browser opens, because
 * that is where the cost is, and it is given back when the run fails for a
 * reason that is ours or the site's rather than the reader's — a refused visit,
 * a timeout, an audit too thin to score. A reader who spends a credit and gets
 * nothing has been charged for a blank page.
 *
 * Everything here is a row in `credit_ledger`. The balance is the sum of the
 * rows, so there is no counter to drift, and every change says why it happened
 * and what caused it.
 */

/** What a new account starts with, matching what the pricing page promises. */
export const WELCOME_CREDITS = 1;

export class OutOfCredits extends Error {
  constructor() {
    super('That used your last credit. Top up to run another audit.');
    this.name = 'OutOfCredits';
  }
}

export async function balance(userId: string, on: Db | null = db()): Promise<number> {
  if (!on) return 0;
  const [row] = await on
    .select({ total: sql<number>`coalesce(sum(${creditLedger.delta}), 0)::int` })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId));
  return row?.total ?? 0;
}

/**
 * Adds credits. `ref` is what caused it — a Stripe event id, say — and the
 * unique index on it means replaying the same event is a no-op rather than a
 * second grant.
 */
export async function grant(
  userId: string,
  amount: number,
  reason: LedgerReason,
  { ref, note }: { ref?: string; note?: string } = {},
): Promise<void> {
  const on = db();
  if (!on || amount <= 0) return;
  await on
    .insert(creditLedger)
    .values({ userId, delta: amount, reason, ref: ref ?? null, note: note ?? null })
    .onConflictDoNothing();
}

/**
 * Takes one credit for a run, or throws.
 *
 * The advisory lock is per user and lasts the transaction: two audits started
 * at once queue rather than both reading the same balance and both spending the
 * last credit. It locks a hash of the user id, not a row, so nothing else
 * touching that user blocks on it.
 */
export async function spend(userId: string): Promise<{ left: number; entryId: string }> {
  const on = db();
  if (!on) return { left: 0, entryId: '' };
  return on.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const left = await balance(userId, tx as unknown as Db);
    if (left < 1) throw new OutOfCredits();
    const [row] = await tx
      .insert(creditLedger)
      .values({ userId, delta: -1, reason: 'audit' })
      .returning({ id: creditLedger.id });
    return { left: left - 1, entryId: row.id };
  });
}

/**
 * Ties the spend to the run it paid for, once the engine has named it: the run
 * id does not exist until the audit starts, and the credit is taken before it.
 */
export async function attachRun(entryId: string, runId: string): Promise<void> {
  const on = db();
  if (!on || !entryId) return;
  await on.update(creditLedger).set({ runId }).where(eq(creditLedger.id, entryId));
}

/**
 * Gives a credit back for a run that produced nothing worth having.
 *
 * Keyed on the run, so a retry of the same refund cannot pay twice, and only
 * for a run that was actually charged.
 */
export async function refund(runId: string, note: string): Promise<boolean> {
  const on = db();
  if (!on) return false;
  const [run] = await on.select().from(auditRuns).where(eq(auditRuns.id, runId)).limit(1);
  if (!run?.userId || !run.charged) return false;
  const res = await on
    .insert(creditLedger)
    .values({ userId: run.userId, delta: 1, reason: 'refund', runId, ref: `refund:${runId}`, note })
    .onConflictDoNothing()
    .returning({ id: creditLedger.id });
  return res.length > 0;
}

export type LedgerEntry = {
  id: string;
  delta: number;
  reason: LedgerReason;
  note: string | null;
  runId: string | null;
  createdAt: Date;
};

/** The account page's statement: what was granted, spent and given back. */
export async function history(userId: string, limit = 50): Promise<LedgerEntry[]> {
  const on = db();
  if (!on) return [];
  return on
    .select({
      id: creditLedger.id,
      delta: creditLedger.delta,
      reason: creditLedger.reason,
      note: creditLedger.note,
      runId: creditLedger.runId,
      createdAt: creditLedger.createdAt,
    })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(limit);
}

/** Runs this account has paid for, newest first. */
export async function runsFor(userId: string, limit = 20) {
  const on = db();
  if (!on) return [];
  return on
    .select()
    .from(auditRuns)
    .where(and(eq(auditRuns.userId, userId), eq(auditRuns.status, 'done')))
    .orderBy(desc(auditRuns.createdAt))
    .limit(limit);
}
