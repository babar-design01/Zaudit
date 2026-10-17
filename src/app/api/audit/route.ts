import { audit, AuditError } from '@/lib/audit/engine';
import { assertPublicUrl } from '@/lib/audit/net';
import { DEFAULT_GOAL, GOALS, type GoalId } from '@/lib/audit/framework';
import type { AuditEvent, AuditResult } from '@/lib/audit/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

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
// Reports are read back by id from their own page, which is a different key
// from the url+goal the audit is cached under.
export const reports = new Map<string, { at: number; result: AuditResult }>();

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

function remember(key: string, result: AuditResult): void {
  cache.set(key, { at: Date.now(), result });
  reports.set(result.id, { at: Date.now(), result });
  if (reports.size > 40) {
    const oldest = [...reports.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) reports.delete(oldest[0]);
  }
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
 * POST /api/audit  { url: string, goal?: GoalId }
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
  let goal: GoalId = DEFAULT_GOAL;
  try {
    const body = (await request.json()) as { url?: unknown; goal?: unknown };
    url = typeof body.url === 'string' ? body.url : '';
    if (typeof body.goal === 'string' && GOALS.some((g) => g.id === body.goal)) goal = body.goal as GoalId;
  } catch {
    url = '';
  }

  const encoder = new TextEncoder();
  const ip = clientIp(request);

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

      try {
        if (!url.trim()) throw new AuditError('Enter a website address first.');

        // The goal changes the weighting, so it is part of what is cached.
        const key = url.trim().toLowerCase() + '|' + goal;
        const hit = cached(key);
        if (hit) {
          // Still walk the stages, so a cached result does not flash past as a
          // single frame the reader has no chance to follow.
          for (let i = 0; i < 4; i += 1) send({ type: 'stage', index: i });
          send({ type: 'result', result: hit });
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

        const result = await audit(url, {
          goal,
          onStage: (index) => send({ type: 'stage', index }),
          signal: request.signal,
        });
        remember(key, result);
        send({ type: 'result', result });
      } catch (err) {
        // The reader closed the dialog; there is nobody left to tell.
        if (request.signal.aborted) return;
        send({
          type: 'error',
          message: err instanceof Error ? err.message : String(err),
          quota: err instanceof AuditError ? err.quota : false,
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
