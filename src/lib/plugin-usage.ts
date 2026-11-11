/**
 * Anonymous usage from the ProCurveUX Figma plugin, for the admin's "Figma plugin" page.
 *
 * The plugin sends one small event when it opens, runs an audit, applies fixes or
 * sets up a design system. An event holds counts only: a random install id made
 * by the plugin, the plugin version, scores, how many findings and which checks
 * failed. Never a design, a layer or file name, or any text from the file. People
 * can turn it off in the plugin's Settings.
 *
 * Stored like the website's audit log (lib/usage.ts): with Vercel Blob the event
 * is written into the object's name, so one `list` reads a thousand of them; on
 * a machine of its own it is a line in a file.
 */

export const PLUGIN_EVENTS = ['open', 'audit', 'fix', 'setup'] as const;
export type PluginEventName = (typeof PLUGIN_EVENTS)[number];

export type PluginEvent = {
  id: string;
  at: number;
  /** Random id the plugin made on first run. Counts installs; identifies no one. */
  install: string;
  event: PluginEventName;
  version: string | null;
  /** From the request's edge location, two letters. */
  country: string | null;
  scope?: 'page' | 'selection' | null;
  frames?: number;
  layers?: number;
  findings?: number;
  score?: number | null;
  /** critical, major, minor, suggestion */
  counts?: [number, number, number, number];
  /** Failing checks by name, with how many findings each. At most 12. */
  checks?: Record<string, number>;
  durationMs?: number;
  /** fix: findings fixed and fixes that could not be applied. */
  fixed?: number;
  failed?: number;
  /** setup: what was created. */
  variables?: number;
  styles?: number;
};

const DISK_FILE = '.data/plugin-events.jsonl';
const PREFIX = 'plugin/';
const PATHNAME_MAX = 950;
const LIST_TTL_MS = 60_000;
const LIST_PAGES_MAX = 20;
const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const serverless = () => !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const int = (v: unknown, max = 1_000_000) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : undefined);

/** What a request may say, cleaned: unknown fields dropped, numbers clamped, strings bounded. Null when it is not an event. */
export function cleanEvent(body: unknown, country: string | null): PluginEvent | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const install = typeof b.install === 'string' && /^[a-z0-9]{8,40}$/i.test(b.install) ? b.install.toLowerCase() : null;
  const event = PLUGIN_EVENTS.find((e) => e === b.event);
  if (!install || !event) return null;
  const out: PluginEvent = {
    id: Math.random().toString(36).slice(2, 10),
    at: Date.now(),
    install,
    event,
    version: typeof b.version === 'string' && /^[0-9a-z.\-]{1,16}$/i.test(b.version) ? b.version : null,
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
  };
  if (event === 'audit') {
    out.scope = b.scope === 'page' || b.scope === 'selection' ? b.scope : null;
    out.frames = int(b.frames, 10_000);
    out.layers = int(b.layers);
    out.findings = int(b.findings, 100_000);
    out.score = int(b.score, 100) ?? null;
    out.durationMs = int(b.durationMs, 3_600_000);
    if (Array.isArray(b.counts) && b.counts.length === 4) out.counts = b.counts.map((n) => int(n, 100_000) ?? 0) as PluginEvent['counts'];
    if (b.checks && typeof b.checks === 'object') {
      const checks: Record<string, number> = {};
      Object.entries(b.checks as Record<string, unknown>)
        .filter(([k]) => /^[A-Za-z][A-Za-z ]{1,39}$/.test(k))
        .slice(0, 12)
        .forEach(([k, v]) => {
          const n = int(v, 100_000);
          if (n) checks[k] = n;
        });
      out.checks = checks;
    }
  }
  if (event === 'fix') {
    out.fixed = int(b.fixed, 100_000);
    out.failed = int(b.failed, 100_000);
  }
  if (event === 'setup') {
    out.variables = int(b.variables, 10_000);
    out.styles = int(b.styles, 10_000);
  }
  return out;
}

function encodeName(e: PluginEvent): string {
  const name = (x: PluginEvent) => `${PREFIX}${x.at}-${x.id}-${Buffer.from(JSON.stringify(x)).toString('base64url')}`;
  const full = name(e);
  if (full.length <= PATHNAME_MAX) return full;
  // Too long: keep the 5 biggest checks.
  const top = Object.fromEntries(Object.entries(e.checks || {}).sort((a, b) => b[1] - a[1]).slice(0, 5));
  return name({ ...e, checks: top });
}

function decodeName(pathname: string): PluginEvent | null {
  const match = /^plugin\/\d+-[a-z0-9]+-([A-Za-z0-9_-]+)$/i.exec(pathname);
  if (!match) return null;
  try {
    return JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8')) as PluginEvent;
  } catch {
    return null;
  }
}

let listed: { at: number; events: PluginEvent[] } | null = null;

export async function recordPluginEvent(e: PluginEvent): Promise<void> {
  try {
    if (blobEnabled()) {
      const { put } = await import('@vercel/blob');
      await put(encodeName(e), '1', { access: 'private', contentType: 'text/plain', addRandomSuffix: false, allowOverwrite: true });
    } else if (!serverless()) {
      const { appendFile, mkdir } = await import('node:fs/promises');
      await mkdir('.data', { recursive: true });
      await appendFile(DISK_FILE, JSON.stringify(e) + '\n');
    }
    listed = null;
  } catch (err) {
    console.warn('plugin-usage: could not record an event —', err instanceof Error ? err.message : err);
  }
}

/** Every event, newest first. */
export async function listPluginEvents(): Promise<PluginEvent[]> {
  if (listed && Date.now() - listed.at < LIST_TTL_MS) return listed.events;
  let events: PluginEvent[] = [];
  if (blobEnabled()) {
    const { list } = await import('@vercel/blob');
    let cursor: string | undefined;
    for (let page = 0; page < LIST_PAGES_MAX; page += 1) {
      const found = await list({ prefix: PREFIX, limit: 1000, cursor });
      for (const blob of found.blobs) {
        const e = decodeName(blob.pathname);
        if (e) events.push(e);
      }
      if (!found.hasMore || !found.cursor) break;
      cursor = found.cursor;
    }
  } else if (!serverless()) {
    const { readFile } = await import('node:fs/promises');
    const text = await readFile(DISK_FILE, 'utf8').catch(() => '');
    events = text
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as PluginEvent;
        } catch {
          return null;
        }
      })
      .filter((e): e is PluginEvent => !!e);
  }
  events.sort((a, b) => b.at - a.at);
  listed = { at: Date.now(), events };
  return events;
}

/* ------------------------------------------------------------------ summary */

export type Tally = { label: string; count: number };
const DAY = 86_400_000;

function tally(entries: [string, number][], limit = 10): Tally[] {
  const m = new Map<string, number>();
  entries.forEach(([k, n]) => m.set(k, (m.get(k) || 0) + n));
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

export function summarizePlugin(events: PluginEvent[], now = Date.now()) {
  const installs = new Set(events.map((e) => e.install));
  const activeIn = (days: number) => new Set(events.filter((e) => now - e.at < days * DAY).map((e) => e.install)).size;
  const audits = events.filter((e) => e.event === 'audit');
  const scored = audits.filter((e) => typeof e.score === 'number');
  const firstSeen = new Map<string, number>();
  events.forEach((e) => firstSeen.set(e.install, Math.min(firstSeen.get(e.install) ?? Infinity, e.at)));
  const newIn = (days: number) => [...firstSeen.values()].filter((t) => now - t < days * DAY).length;

  // Audits per day, the last 14 days, oldest first.
  const days = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(now - (13 - i) * DAY);
    start.setUTCHours(0, 0, 0, 0);
    const from = start.getTime();
    return { day: start.toISOString().slice(0, 10), audits: audits.filter((e) => e.at >= from && e.at < from + DAY).length };
  });

  return {
    installs: installs.size,
    newThisWeek: newIn(7),
    active7: activeIn(7),
    active30: activeIn(30),
    opens: events.filter((e) => e.event === 'open').length,
    audits: audits.length,
    fixesApplied: events.filter((e) => e.event === 'fix').reduce((n, e) => n + (e.fixed || 0), 0),
    setups: events.filter((e) => e.event === 'setup').length,
    avgScore: scored.length ? Math.round(scored.reduce((n, e) => n + (e.score as number), 0) / scored.length) : null,
    avgFindings: audits.length ? Math.round(audits.reduce((n, e) => n + (e.findings || 0), 0) / audits.length) : null,
    topChecks: tally(audits.flatMap((e) => Object.entries(e.checks || {})), 12),
    versions: tally(events.map((e) => [e.version || 'unknown', 1])),
    countries: tally(events.map((e) => [e.country || 'unknown', 1])),
    days,
  };
}
