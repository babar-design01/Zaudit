import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button, Card, Container, Heading, Row, Section, Spacer, Stack, Text } from '@/components/ui';
import { color, hairline, radius, t } from '@/design/tokens';
import { adminEnabled, isAdmin, signIn, signOut } from '@/lib/admin';
import { hostOf, listRuns, summarize, type RunRecord, type Tally } from '@/lib/usage';
import './admin.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin | Audix',
  robots: { index: false, follow: false },
};

/** Days and times are read in the team's own zone, not the server's. */
const ZONE = process.env.ADMIN_TIME_ZONE || 'Asia/Karachi';
const DAY = 86_400_000;
const CHART_DAYS = 30;
/** The table stops here; the download has every row. */
const TABLE_MAX = 200;

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All time' },
] as const;
type RangeId = (typeof RANGES)[number]['id'];

const dayKey = (at: number) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
const dayLabel = (at: number) => new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short' }).format(at);
const whenLabel = (at: number) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(at);

function inRange(runs: RunRecord[], range: RangeId): RunRecord[] {
  if (range === 'all') return runs;
  if (range === 'today') {
    const today = dayKey(Date.now());
    return runs.filter((r) => dayKey(r.at) === today);
  }
  const since = Date.now() - (range === '7d' ? 7 : 30) * DAY;
  return runs.filter((r) => r.at >= since);
}

async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get('x-forwarded-for')?.split(',')[0] || list.get('x-real-ip') || 'local';
}

async function submitPassword(form: FormData) {
  'use server';
  const outcome = await signIn(String(form.get('password') ?? ''), await clientIp());
  redirect(outcome === 'ok' ? '/admin' : `/admin?error=${outcome}`);
}

async function leave() {
  'use server';
  await signOut();
  redirect('/admin');
}

/**
 * The owner's view of the product: how much it is used, by how many, on what,
 * and how often it fails. Not linked from anywhere on the site.
 */
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ range?: string; error?: string }> }) {
  if (!adminEnabled()) notFound();
  const { range: asked, error } = await searchParams;
  if (!(await isAdmin())) return <SignIn error={error} />;

  const range: RangeId = RANGES.find((r) => r.id === asked)?.id ?? '30d';
  const all = await listRuns();
  const runs = inRange(all, range);
  const s = summarize(runs);

  return (
    <Section style={{ background: color.muted, minHeight: '100vh' }}>
      <Container style={{ padding: '40px 24px 64px', maxWidth: 1120 }}>
        <Stack gap={24}>
          <Row gap={12} align="center" wrap>
            <Heading level={1} variant="cardTitle">
              Audix admin
            </Heading>
            <Spacer />
            <a href="/admin/export" style={{ font: t(600, 13, 20), color: color.accentFg }}>
              Download CSV
            </a>
            <form action={leave}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </Row>

          <nav aria-label="Time range">
            <Row gap={8} wrap>
              {RANGES.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin?range=${r.id}`}
                  aria-current={r.id === range ? 'page' : undefined}
                  style={{
                    padding: '6px 12px',
                    font: t(600, 13, 20),
                    borderRadius: radius.sm,
                    color: r.id === range ? color.onAction : color.ink,
                    background: r.id === range ? color.action : color.surface,
                    border: hairline(),
                  }}
                >
                  {r.label}
                </Link>
              ))}
            </Row>
          </nav>

          <div style={tiles}>
            <Tile label="Audits" value={s.audits} note={s.cached ? `${s.cached} answered from cache` : 'Every run counted'} />
            <Tile label="Different visitors" value={s.visitors} note="Counted by network, so an office counts as one" />
            <Tile label="Sites audited" value={s.sites} />
            <Tile label="Average score" value={s.averageScore == null ? '–' : Math.round(s.averageScore)} note={`Across ${s.scored} scored`} />
            <Tile
              label="Got a score"
              value={s.finished ? `${Math.round((s.scored / s.finished) * 100)}%` : '–'}
              note={`${s.notScored} did not, ${s.cancelled} cancelled`}
            />
            <Tile label="Average time" value={s.averageMs == null ? '–' : `${Math.round(s.averageMs / 1000)}s`} />
            <Tile label="From the extension" value={s.extension} />
            <Tile label="Expert reviews" value={s.expert} note="Each one spends Claude credit" />
          </div>

          <PerDay runs={all} />

          <div style={grid(300)}>
            <Breakdown title="Scores" rows={s.bands} />
            <Breakdown title="Goals" rows={s.goals} />
            <Breakdown title="Where audits start" rows={s.sources} />
            <Breakdown title="Countries" rows={s.countries} />
            <Breakdown title="Top sites" rows={s.topSites} />
            <Breakdown title="Why audits got no score" rows={s.reasons} empty="None in this period." />
          </div>

          <Card radius={radius.md} pad={0} gap={0} clip>
            <Row align="baseline" gap={12} wrap style={{ padding: '16px 16px 12px' }}>
              <Heading level={2} variant="cardTitle">
                Audits
              </Heading>
              <Text variant="bodyXs" tone="muted">
                {runs.length > TABLE_MAX ? `Latest ${TABLE_MAX} of ${runs.length}. The CSV has them all.` : `${runs.length} in this period. Times in ${ZONE}.`}
              </Text>
            </Row>
            <div style={{ overflowX: 'auto' }}>
              <RunsTable runs={runs.slice(0, TABLE_MAX)} />
            </div>
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}

const grid = (min: number) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`, gap: 12 });
/** Four across on a desktop, two on a phone, so the figures stay on one screen. */
const tiles = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 45%), 1fr))', gap: 12 };

function SignIn({ error }: { error?: string }) {
  const message = error === 'limited' ? 'Too many attempts. Wait 15 minutes and try again.' : error ? 'That password is not right.' : null;
  return (
    <Section style={{ background: color.muted, minHeight: '100vh' }}>
      <Container style={{ padding: '96px 24px', maxWidth: 400 }}>
        <Card radius={radius.md} pad={24} gap={16}>
          <Heading level={1} variant="cardTitle">
            Audix admin
          </Heading>
          <form action={submitPassword}>
            <Stack gap={12}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, font: t(600, 13, 20), color: color.ink }}>
                Password
                <input
                  type="password"
                  name="password"
                  required
                  autoFocus
                  autoComplete="current-password"
                  style={{ height: 44, padding: '0 12px', font: t(400, 15, 20), color: color.ink, background: color.bg, border: hairline(color.input), borderRadius: radius.sm }}
                />
              </label>
              {message && (
                <p role="alert" style={{ margin: 0, font: t(400, 14, 20), color: color.critical }}>
                  {message}
                </p>
              )}
              <Button type="submit" fullWidth>
                Sign in
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </Section>
  );
}

function Tile({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <Card radius={radius.md} pad={16} gap={4}>
      <Text variant="bodyXs" tone="muted">
        {label}
      </Text>
      <span style={{ font: t(700, 32, 40), letterSpacing: '-0.02em', color: color.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {note && (
        <Text variant="bodyXs" tone="muted" wrap="pretty">
          {note}
        </Text>
      )}
    </Card>
  );
}

/** Always the last 30 days whatever range is chosen: its job is the trend, which a one-day range would erase. */
function PerDay({ runs }: { runs: RunRecord[] }) {
  const counts = new Map<string, number>();
  for (const run of runs) counts.set(dayKey(run.at), (counts.get(dayKey(run.at)) ?? 0) + 1);
  const days = Array.from({ length: CHART_DAYS }, (_, i) => {
    const at = Date.now() - (CHART_DAYS - 1 - i) * DAY;
    return { at, count: counts.get(dayKey(at)) ?? 0 };
  });
  const peak = Math.max(1, ...days.map((d) => d.count));

  return (
    <Card radius={radius.md} pad={16} gap={12}>
      <Row align="baseline" gap={12} wrap>
        <Heading level={2} variant="cardTitle">
          Audits per day
        </Heading>
        <Text variant="bodyXs" tone="muted">
          Last {CHART_DAYS} days. Busiest day: {peak === 1 && !days.some((d) => d.count) ? 0 : peak}.
        </Text>
      </Row>
      <div role="img" aria-label={`Audits per day over the last ${CHART_DAYS} days. The table below has every audit.`} style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, borderBottom: hairline() }}>
        {days.map((d) => (
          <div key={d.at} className="admin-bar">
            {d.count > 0 && <i style={{ height: `${Math.max(4, (d.count / peak) * 100)}%` }} />}
            <span>
              {dayLabel(d.at)}: {d.count} audit{d.count === 1 ? '' : 's'}
            </span>
          </div>
        ))}
      </div>
      <Row>
        <Text variant="bodyXs" tone="muted">
          {dayLabel(days[0].at)}
        </Text>
        <Spacer />
        <Text variant="bodyXs" tone="muted">
          Today
        </Text>
      </Row>
    </Card>
  );
}

function Breakdown({ title, rows, empty = 'Nothing yet.' }: { title: string; rows: Tally[]; empty?: string }) {
  const top = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card radius={radius.md} pad={16} gap={12}>
      <Heading level={2} variant="cardTitle">
        {title}
      </Heading>
      {rows.length === 0 ? (
        <Text variant="bodySm" tone="muted">
          {empty}
        </Text>
      ) : (
        <Stack gap={10}>
          {rows.map((row) => (
            <Stack key={row.label} gap={4}>
              <Row gap={12} align="baseline">
                <Text variant="bodySm" style={{ overflowWrap: 'anywhere' }}>
                  {row.label}
                </Text>
                <Spacer />
                <span style={{ font: t(600, 14, 20), color: color.ink, fontVariantNumeric: 'tabular-nums' }}>{row.count}</span>
              </Row>
              <div style={{ height: 4, borderRadius: 2, background: color.blue, width: `${Math.max(2, (row.count / top) * 100)}%` }} />
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
}

const RESULT: Record<Exclude<RunRecord['status'], 'scored'>, string> = {
  unscored: 'No score',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

function RunsTable({ runs }: { runs: RunRecord[] }) {
  if (!runs.length) {
    return (
      <p style={{ margin: 0, padding: '0 16px 16px', font: t(400, 14, 20), color: color.inkMuted }}>No audits in this period.</p>
    );
  }
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th scope="col">When</th>
          <th scope="col">Site</th>
          <th scope="col">Goal</th>
          <th scope="col">Result</th>
          <th scope="col" className="num">Critical</th>
          <th scope="col" className="num">Major</th>
          <th scope="col" className="num">Minor</th>
          <th scope="col" className="num">Time</th>
          <th scope="col">From</th>
          <th scope="col">Visitor</th>
          <th scope="col">Report</th>
        </tr>
      </thead>
      <tbody>
        {runs.map((r) => (
          <tr key={`${r.at}-${r.id}`}>
            <td style={{ whiteSpace: 'nowrap' }}>{whenLabel(r.at)}</td>
            <td style={{ whiteSpace: 'nowrap' }} title={r.url}>
              {hostOf(r.url)}
            </td>
            <td style={{ whiteSpace: 'nowrap' }}>{r.goal}</td>
            <td title={r.note ?? undefined}>
              {r.status === 'scored' ? `${r.overall} ${r.band ?? ''}` : RESULT[r.status]}
              {r.note && <div style={{ color: color.inkMuted, fontSize: 12, lineHeight: '16px', overflowWrap: 'anywhere' }}>{r.note}</div>}
            </td>
            <td className="num">{r.critical}</td>
            <td className="num">{r.major}</td>
            <td className="num">{r.minor}</td>
            <td className="num">{r.cached ? 'Cache' : r.tookMs == null ? '–' : `${Math.round(r.tookMs / 1000)}s`}</td>
            <td>{r.source === 'extension' ? 'Extension' : r.source === 'site' ? 'Website' : '–'}</td>
            <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>{r.visitor ? r.visitor.slice(0, 6) : '–'}</td>
            <td>{r.status === 'scored' || r.status === 'unscored' ? <a href={`/report/${encodeURIComponent(r.id)}`}>Open</a> : '–'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
