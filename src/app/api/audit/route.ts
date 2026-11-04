import { auth } from '@/auth';
import { audit, AuditError } from '@/lib/audit/engine';
import { OutOfCredits, attachRun, balance, refund, spend } from '@/lib/credits';
import { accountsEnabled } from '@/lib/db';
import { failRun, finishRun, newRunId, startRun } from '@/lib/runs';
import { assertPublicUrl } from '@/lib/audit/net';
import { combineGoals } from '@/lib/audit/framework';
import { normalizeEmail } from '@/lib/email';
import { putReport } from '@/lib/report/store';
import type { AuditEvent, AuditResult } from '@/lib/audit/types';
import { recordRun, requester, runFromResult, runThatStopped } from '@/lib/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// A cold serverless instance has to unpack a browser before it can load the
// page, and a heavy site then takes a minute of probing and cropping on top.
// 300s is the ceiling a function is allowed on Vercel's free plan; a
// long-running server never reaches this at all.
export const maxDuration = 300;

/* ------------------------------------------------------------------ limits */

/**
 * An audit costs a Claude call, a PageSpeed call and somebody else's bandwidth,
 * so the endpoint is not free to hammer. Both guards are per-process and in
 * memory, which is the right size for one server; a deployment behind several
 * instances wants Redis here instead.
 */
const RATE_LIMIT = { windowMs: 60_000, max: 10 };
const CACHE_TTL_MS = 10 * 60_000;
// A cached result carries its annotation crops, so the cache is capped by weight
// rather than by count alone.

const hits = new Map<string, number[]>();
const cache = new Map<string, { at: number; result: AuditResult }>();

function rateLimited(ip: string): number | null {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    return Math.ceil((RATE_LIMIT.windowMs - (now - recent[0])) / 1000);
  }
  recent.push(now);
  hits.set(ip, recent);
  // Keep the map from growing without bound on a long-lived process.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < RATE_LIMIT.windowMs)) hits.delete(k);
  }
  return null;
}

function cached(key: string): AuditResult | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.result;
}

async function remember(key: string, result: AuditResult): Promise<void> {
  // A run that could not be scored is usually a slow load or a crashed browser.
  // Caching it would hand the same failure to whoever presses "try again".
  if (result.overall != null) cache.set(key, { at: Date.now(), result });
  // The report page asks for this by id — from another instance, and possibly
  // tomorrow — so it goes to the report store rather than only to this map.
  await putReport(result);
  if (cache.size > 20) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0] : '') || request.headers.get('x-real-ip') || 'local';
}

/* ------------------------------------------------------------------- route */

/**
 * POST /api/audit  { url: string, email: string, goals?: GoalId[] }
 *
 * `goal`, a single id, is still read: extensions installed before goals could be
 * combined keep sending it.
 *
 * Responds with a newline-delimited JSON stream so the dialog's progress list
 * reflects the real stage the engine is on rather than a timer:
 *
 *   {"type":"stage","index":0}
 *   {"type":"stage","index":1}
 *   {"type":"result","result":{...}}     — or
 *   {"type":"error","message":"...","quota":false}
 *
 * Closing the connection aborts the run: the engine checks the signal between
 * stages, so a cancelled audit stops rather than finishing unwatched.
 */
export async function POST(request: Request) {
  let url = '';
  let goal = combineGoals([]);
  let email: string | null = null;
  try {
    const body = (await request.json()) as { url?: unknown; goal?: unknown; goals?: unknown; email?: unknown };
    email = normalizeEmail(body.email);
    url = typeof body.url === 'string' ? body.url : '';
    goal = combineGoals(Array.isArray(body.goals) ? body.goals : [body.goal]);
  } catch {
    url = '';
  }

  const encoder = new TextEncoder();
  const ip = clientIp(request);
  const who = requester(request, ip, email);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: AuditEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        } catch {
          open = false;
        }
      };

      // A stage can run for half a minute. Without a byte on the wire in that
      // time, an intermediary is entitled to assume the response has stalled.
      const heartbeat = setInterval(() => send({ type: 'ping' }), 10_000);
      /** Named once the credit is spent, so a failure can give it back. */
      let runId = '';
      const startedAt = Date.now();

      try {
        if (!url.trim()) throw new AuditError('Enter a website address first.');
        // Names the extension too, because a copy installed before this field
        // has no way to send one.
        if (!email) throw new AuditError('An email is needed to run an audit. If you are using the Chrome extension, please update it.');

        // The goal changes the weighting, so it is part of what is cached.
        const key = url.trim().toLowerCase() + '|' + goal.id;
        const hit = cached(key);
        if (hit) {
          // Still walk the stages, so a cached result does not flash past as a
          // single frame the reader has no chance to follow.
          for (let i = 0; i < 4; i += 1) send({ type: 'stage', index: i });
          send({ type: 'result', result: hit });
          await recordRun(runFromResult(hit, who, true));
          return;
        }

        // Validate before metering, so a mistyped address does not spend the
        // reader's budget — only a run that is actually going to cost something
        // counts against the limit.
        await assertPublicUrl(url);

        const wait = rateLimited(ip);
        if (wait != null) {
          throw new AuditError(
            `That is a lot of audits at once. Try again in ${wait} second${wait === 1 ? '' : 's'}.`,
          );
        }

        // With no database there are no accounts and no credits, and the audit
        // runs for whoever asks — the product as it was before either existed.
        let userId: string | null = null;
        let entryId = '';
        if (accountsEnabled()) {
          const session = await auth();
          userId = session?.user?.id ?? null;
          if (!userId) throw new AuditError('Sign in to run an audit. The first one is free.', false, 'signin');
          const taken = await spend(userId).catch((err) => {
            if (err instanceof OutOfCredits) throw new AuditError(err.message, false, 'buy');
            throw err;
          });
          entryId = taken.entryId;
          send({ type: 'credits', left: taken.left });
        }

        // The run is named here rather than inside the engine, because the
        // credit was spent before the engine started and the two have to point
        // at each other.
        runId = newRunId(url, goal.id);
        await startRun({ id: runId, userId, url, goal: goal.id, charged: !!entryId });
        if (entryId) await attachRun(entryId, runId);

        const result = await audit(url, {
          goals: goal.ids,
          id: runId,
          onStage: (index) => send({ type: 'stage', index }),
          onCheck: (check) => send({ type: 'check', ...check }),
          onPreview: (image) => send({ type: 'preview', image }),
          signal: request.signal,
        });
        await remember(key, result);
        await finishRun(result);

        // A run that could not be scored is a run the reader did not get: the
        // site refused us, or too little could be measured to say anything.
        // They keep the report and get the credit back.
        if (result.overall == null && entryId) {
          const given = await refund(runId, 'The audit could not be scored, so the credit was returned.');
          if (given) send({ type: 'credits', left: await balance(userId!), refunded: true });
        }

        send({ type: 'result', result });
        // Awaited because a serverless function can freeze once the stream ends.
        await recordRun(runFromResult(result, who, false));
      } catch (err) {
        // A run that was paid for and then broke is on us, not the reader.
        if (runId) {
          await recordRun(
            runThatStopped(
              { id: runId, url, goal: goal.name, startedAt, cancelled: request.signal.aborted, error: err instanceof Error ? err.message : String(err) },
              who,
            ),
          );
          await failRun(runId, err instanceof Error ? err.message : String(err)).catch(() => {});
          const given = await refund(runId, 'The audit did not finish, so the credit was returned.').catch(() => false);
          if (given) send({ type: 'credits', left: null, refunded: true });
        }
        // The reader closed the dialog; there is nobody left to tell.
        if (request.signal.aborted) return;
        send({
          type: 'error',
          message: err instanceof Error ? err.message : String(err),
          quota: err instanceof AuditError ? err.quota : false,
          ...(err instanceof AuditError && err.action ? { action: err.action } : {}),
        });
      } finally {
        clearInterval(heartbeat);
        open = false;
        try {
          controller.close();
        } catch {
          /* already closed by the disconnect */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      // Nginx buffers proxied responses by default, which would hold the whole
      // stream until the audit finished and defeat the point of streaming it.
      'X-Accel-Buffering': 'no',
    },
  });
}
