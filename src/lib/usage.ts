import { createHmac } from 'node:crypto';
import type { AuditResult } from '@/lib/audit/types';
import { getReport } from '@/lib/report/store';

/**
 * One line per audit, for the admin page: what ran, how it ended, who asked.
 *
 * This is separate from the `audit_runs` table in `lib/runs.ts`, which only
 * exists with a database, and a database also turns on accounts. A deployment
 * without one still wants to know how it is being used.
 *
 * With Vercel Blob, the record is written into the object's name rather than
 * its body. Reading a body costs one operation per audit on every page view,
 * while one `list` returns a thousand names, so this keeps the page inside the
 * free plan however long the log grows. On a machine of its own the log is a
 * file instead.
 *
 * Nothing here may ever fail an audit: writes log a warning and move on.
 */

export type RunStatus = 'scored' | 'unscored' | 'failed' | 'cancelled';

export type RunRecord = {
  id: string;
  at: number;
  url: string;
  goal: string;
  status: RunStatus;
  /** Answered from the ten-minute cache, so the engine did not run. */
  cached: boolean;
  overall: number | null;
  band: string | null;
  tookMs: number | null;
  findings: number;
  critical: number;
  major: number;
  minor: number;
  /** Whether the model reviewed the page, which is the part that costs money. */
  expert: boolean;
  /** A keyed hash of the network address. Null on reports from before the log. */
  visitor: string | null;
  source: 'site' | 'extension' | null;
  country: string | null;
  note: string | null;
};

export type Requester = Pick<RunRecord, 'visitor' | 'source' | 'country'>;

const DISK_FILE = '.data/runs.jsonl';
const PREFIX = 'runs/';
/** Written once every older report has a record, so the check stops costing an operation. */
const BACKFILLED = 'runs/backfilled';
const BACKFILL_PER_VIEW = 25;
/** How long a listing is reused: each one counts against the store's monthly allowance. */
const LIST_TTL_MS = 60_000;
const LIST_PAGES_MAX = 10;
/** The store refuses a longer name. */
const PATHNAME_MAX = 950;

const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const serverless = () => !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 120);
  }
}

/**
 * Enough to count different visitors without keeping anyone's address. People
 * sharing an office network count as one, so this reads low rather than high.
 */
export function requester(request: Request, ip: string): Requester {
  const key = process.env.BLOB_READ_WRITE_TOKEN || 'local';
  return {
    visitor: createHmac('sha256', key).update(ip).digest('hex').slice(0, 10),
    source: (request.headers.get('origin') || '').startsWith('chrome-extension://') ? 'extension' : 'site',
    country: request.headers.get('x-vercel-ip-country'),
  };
}

/** The browser's own error sits in brackets inside the sentence written for the report. */
function shortReason(note: string | null | undefined): string | null {
  if (!note) return null;
  const inner = /\((.+?)\), so /.exec(note);
  return (inner ? inner[1] : note).slice(0, 80);
}

export function runFromResult(result: AuditResult, who: Requester, cached: boolean): RunRecord {
  return {
    id: result.id,
    at: cached ? Date.now() : new Date(result.fetchedAt).getTime() || Date.now(),
    url: result.url.slice(0, 200),
    goal: result.goal.name,
    status: result.overall == null ? 'unscored' : 'scored',
    cached,
    overall: result.overall,
    band: result.band,
    tookMs: cached ? null : result.tookMs,
    findings: result.findings.length,
    critical: result.counts[4] ?? 0,
    major: result.counts[3] ?? 0,
    minor: result.counts[2] ?? 0,
    expert: !!result.expert?.ran,
    ...who,
    note: result.overall == null ? shortReason(result.captureNote ?? result.fetchNote) : null,
  };
}

export function runThatStopped(
  input: { id: string; url: string; goal: string; startedAt: number; cancelled: boolean; error: string },
  who: Requester,
): RunRecord {
  return {
    id: input.id,
    at: input.startedAt,
    url: input.url.slice(0, 200),
    goal: input.goal,
    status: input.cancelled ? 'cancelled' : 'failed',
    cached: false,
    overall: null,
    band: null,
    tookMs: Date.now() - input.startedAt,
    findings: 0,
    critical: 0,
    major: 0,
    minor: 0,
    expert: false,
    ...who,
    note: input.cancelled ? null : shortReason(input.error),
  };
}

function encodeName(run: RunRecord): string {
  const name = (r: RunRecord) => `${PREFIX}${r.at}-${r.id}-${Buffer.from(JSON.stringify(r)).toString('base64url')}`;
  const full = name(run);
  return full.length <= PATHNAME_MAX ? full : name({ ...run, note: null, url: run.url.slice(0, 120) });
}

function decodeName(pathname: string): RunRecord | null {
  const match = /^runs\/\d+-[a-z0-9-]+?-([A-Za-z0-9_-]+)$/i.exec(pathname);
  if (!match) return null;
  try {
    return JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8')) as RunRecord;
  } catch {
    return null;
  }
}

let listed: { at: number; runs: RunRecord[] } | null = null;

export async function recordRun(run: RunRecord): Promise<void> {
  try {
    if (blobEnabled()) {
      const { put } = await import('@vercel/blob');
      await put(encodeName(run), '1', { access: 'private', contentType: 'text/plain', addRandomSuffix: false, allowOverwrite: true });
    } else if (!serverless()) {
      const { appendFile, mkdir } = await import('node:fs/promises');
      await mkdir('.data', { recursive: true });
      await appendFile(DISK_FILE, JSON.stringify(run) + '\n');
    }
    listed = null;
  } catch (err) {
    console.warn('usage: could not record a run —', err instanceof Error ? err.message : err);
  }
}

async function listBlobRuns(): Promise<{ runs: RunRecord[]; backfilled: boolean }> {
  const { list } = await import('@vercel/blob');
  const runs: RunRecord[] = [];
  let backfilled = false;
  let cursor: string | undefined;
  for (let page = 0; page < LIST_PAGES_MAX; page += 1) {
    const found = await list({ prefix: PREFIX, limit: 1000, cursor });
    for (const blob of found.blobs) {
      if (blob.pathname === BACKFILLED) backfilled = true;
      const run = decodeName(blob.pathname);
      if (run) runs.push(run);
    }
    if (!found.hasMore || !found.cursor) break;
    cursor = found.cursor;
  }
  return { runs, backfilled };
}

/**
 * Audits from before this log have a report but no record. Each is read once and
 * given one, a few per view, so the first visit to the page does not have to pay
 * for all of them at the same moment. They have no visitor or source to show.
 */
async function backfill(runs: RunRecord[]): Promise<RunRecord[]> {
  const { list, put } = await import('@vercel/blob');
  const known = new Set(runs.map((r) => r.id));
  const missing: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < LIST_PAGES_MAX; page += 1) {
    const found = await list({ prefix: 'reports/', limit: 1000, cursor });
    for (const blob of found.blobs) {
      const id = /^reports\/(.+)\.json$/.exec(blob.pathname)?.[1];
      if (id && !known.has(id)) missing.push(id);
    }
    if (!found.hasMore || !found.cursor) break;
    cursor = found.cursor;
  }

  const added: RunRecord[] = [];
  for (const id of missing.slice(0, BACKFILL_PER_VIEW)) {
    const result = await getReport(id);
    if (!result) continue;
    const run = runFromResult(result, { visitor: null, source: null, country: null }, false);
    await recordRun(run);
    added.push(run);
  }
  if (missing.length <= BACKFILL_PER_VIEW) {
    await put(BACKFILLED, '1', { access: 'private', contentType: 'text/plain', addRandomSuffix: false, allowOverwrite: true });
  }
  return added;
}

/** Every recorded audit, newest first. */
export async function listRuns(): Promise<RunRecord[]> {
  if (listed && Date.now() - listed.at < LIST_TTL_MS) return listed.runs;

  let runs: RunRecord[] = [];
  if (blobEnabled()) {
    const found = await listBlobRuns();
    runs = found.runs;
    if (!found.backfilled) runs = runs.concat(await backfill(runs));
  } else if (!serverless()) {
    const { readFile } = await import('node:fs/promises');
    const text = await readFile(DISK_FILE, 'utf8').catch(() => '');
    runs = text.split('\n').filter(Boolean).map((line) => JSON.parse(line) as RunRecord);
  }

  runs.sort((a, b) => b.at - a.at);
  listed = { at: Date.now(), runs };
  return runs;
}

/* ------------------------------------------------------------------ summary */

export type Tally = { label: string; count: number };

function tally(values: (string | null)[], limit = 8): Tally[] {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

export function summarize(runs: RunRecord[]) {
  const finished = runs.filter((r) => r.status !== 'cancelled');
  const scored = runs.filter((r) => r.status === 'scored');
  // A cached answer took no time and repeats a score already counted.
  const engineRuns = runs.filter((r) => !r.cached);
  return {
    audits: runs.length,
    visitors: new Set(runs.map((r) => r.visitor).filter(Boolean)).size,
    sites: new Set(runs.map((r) => hostOf(r.url))).size,
    scored: scored.length,
    finished: finished.length,
    notScored: runs.filter((r) => r.status === 'unscored' || r.status === 'failed').length,
    cancelled: runs.filter((r) => r.status === 'cancelled').length,
    cached: runs.filter((r) => r.cached).length,
    expert: engineRuns.filter((r) => r.expert).length,
    extension: runs.filter((r) => r.source === 'extension').length,
    averageScore: average(scored.filter((r) => !r.cached).map((r) => r.overall as number)),
    averageMs: average(engineRuns.filter((r) => r.status === 'scored' || r.status === 'unscored').map((r) => r.tookMs as number)),
    bands: tally(scored.map((r) => r.band)),
    goals: tally(runs.map((r) => r.goal)),
    sources: tally(runs.map((r) => (r.source === 'extension' ? 'Chrome extension' : r.source === 'site' ? 'Website' : null))),
    countries: tally(runs.map((r) => r.country)),
    topSites: tally(runs.map((r) => hostOf(r.url))),
    reasons: tally(runs.filter((r) => r.status === 'unscored' || r.status === 'failed').map((r) => r.note ?? 'No reason recorded')),
  };
}

const CSV_COLUMNS = [
  'date', 'site', 'url', 'goal', 'status', 'score', 'band', 'critical', 'major', 'minor', 'findings', 'seconds',
  'cached', 'expert_review', 'source', 'country', 'visitor', 'report_id', 'note',
] as const;

/** A spreadsheet runs a cell starting with one of these as a formula, and URLs and errors come from outside. */
function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function runsToCsv(runs: RunRecord[]): string {
  const rows = runs.map((r) =>
    [
      new Date(r.at).toISOString(), hostOf(r.url), r.url, r.goal, r.status, r.overall, r.band, r.critical, r.major, r.minor, r.findings,
      r.tookMs == null ? '' : Math.round(r.tookMs / 1000), r.cached, r.expert, r.source, r.country, r.visitor, r.id, r.note,
    ]
      .map(csvCell)
      .join(','),
  );
  return [CSV_COLUMNS.join(','), ...rows].join('\r\n') + '\r\n';
}
