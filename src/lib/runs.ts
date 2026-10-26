import { createHash, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { auditRuns, db } from '@/lib/db';
import type { AuditResult } from '@/lib/audit/types';

/**
 * The record of a run, kept apart from the report itself.
 *
 * The report is a large object in blob storage; this is the row that says it
 * happened: who asked, what it cost, how it ended, and the pillar scores, so
 * "is this better than last month" is one query rather than two downloads.
 */

/**
 * The id for a run, chosen before the engine starts because the credit is
 * spent first and the two have to agree. Same shape as the engine's own: short
 * enough to read out, long enough not to collide.
 */
export function newRunId(url: string, goal: string): string {
  return createHash('sha1').update(url + '|' + goal + '|' + Date.now() + '|' + randomUUID()).digest('hex').slice(0, 10);
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 120);
  }
};

export async function startRun(input: {
  id: string;
  userId: string | null;
  url: string;
  goal: string;
  charged: boolean;
}): Promise<void> {
  const on = db();
  if (!on) return;
  await on
    .insert(auditRuns)
    .values({
      id: input.id,
      userId: input.userId,
      url: input.url,
      host: hostOf(input.url),
      goal: input.goal,
      status: 'running',
      charged: input.charged,
    })
    .onConflictDoNothing();
}

export async function finishRun(result: AuditResult): Promise<void> {
  const on = db();
  if (!on) return;
  await on
    .update(auditRuns)
    .set({
      status: 'done',
      overall: result.overall,
      band: result.band,
      findings: result.findings.length,
      pillars: result.pillars.map((p) => ({ id: p.id, score: p.score })),
      tookMs: result.tookMs,
      finishedAt: new Date(),
      url: result.finalUrl,
      host: hostOf(result.finalUrl),
    })
    .where(eq(auditRuns.id, result.id));
}

export async function failRun(id: string, error: string): Promise<void> {
  const on = db();
  if (!on) return;
  await on
    .update(auditRuns)
    .set({ status: 'failed', error: error.slice(0, 500), finishedAt: new Date() })
    .where(eq(auditRuns.id, id));
}
