import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminShell } from '@/components/admin/AdminShell';
import { AuditsTable } from '@/components/admin/AuditsTable';
import { filterQuery, filterRuns, matching, one, readFilters, type Asked } from '@/components/admin/filters';
import { dayKey, dayLabel, days } from '@/components/admin/format';
import { SignIn } from '@/components/admin/SignIn';
import { adminEnabled, isAdmin } from '@/lib/admin';
import { listRuns, summarize, type RunRecord, type Tally } from '@/lib/usage';

export const dynamic = 'force-dynamic';

const CHART_DAYS = 30;
const LATEST = 8;

/** The owner's view of the product: how much it is used, by how many, and how often it fails. */
export default async function OverviewPage({ searchParams }: { searchParams: Promise<Asked> }) {
  if (!adminEnabled()) notFound();
  const asked = await searchParams;
  if (!(await isAdmin())) return <SignIn error={one(asked.error)} />;

  const filters = readFilters(asked, '30d');
  const all = await listRuns();
  const runs = filterRuns(all, filters);
  const s = summarize(runs);

  return (
    <AdminShell active="overview" title="Overview">
      <AdminFilters filters={filters} path="/admin" />

      <div className="admin-tiles">
        <Tile label="Audits" value={s.audits} note={s.cached ? `${s.cached} answered from cache` : undefined} />
        <Tile label="People" value={s.people} note={`${s.emails} with an email`} />
        <Tile label="Sites audited" value={s.sites} />
        <Tile label="Average score" value={s.averageScore == null ? '–' : Math.round(s.averageScore)} />
        <Tile label="Got a score" value={s.finished ? `${Math.round((s.scored / s.finished) * 100)}%` : '–'} note={`${s.notScored} did not, ${s.cancelled} cancelled`} />
        <Tile label="Average time" value={s.averageMs == null ? '–' : `${Math.round(s.averageMs / 1000)}s`} />
        <Tile label="From the extension" value={s.extension} />
        <Tile label="Expert reviews" value={s.expert} note="Each one spends Claude credit" />
      </div>

      <PerDay runs={matching(all, filters)} />

      <div className="admin-panels">
        <Breakdown title="Countries" rows={s.countries} />
        <Breakdown title="Top sites" rows={s.topSites} />
        <Breakdown title="Scores" rows={s.bands} />
        <Breakdown title="Goals" rows={s.goals} />
        <Breakdown title="Where audits start" rows={s.sources} />
        <Breakdown title="Why audits got no score" rows={s.reasons} empty="None in this period." />
      </div>

      <section className="admin-card admin-flush">
        <div className="admin-card-head">
          <h2>Latest audits</h2>
          <Link href={`/admin/audits${filterQuery(filters)}`}>See all</Link>
        </div>
        <AuditsTable runs={runs.slice(0, LATEST)} />
      </section>
    </AdminShell>
  );
}

function Tile({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="admin-card admin-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

/** Always the last 30 days whatever period is chosen: its job is the trend, which a one-day period would erase. */
function PerDay({ runs }: { runs: RunRecord[] }) {
  const counts = new Map<string, number>();
  for (const run of runs) counts.set(dayKey(run.at), (counts.get(dayKey(run.at)) ?? 0) + 1);
  const series = days(CHART_DAYS).map((at) => ({ at, count: counts.get(dayKey(at)) ?? 0 }));
  const busiest = Math.max(0, ...series.map((d) => d.count));

  return (
    <section className="admin-card">
      <div className="admin-card-head">
        <h2>Audits per day</h2>
        <small>
          Last {CHART_DAYS} days. Busiest day: {busiest}.
        </small>
      </div>
      <div role="img" aria-label={`Audits per day over the last ${CHART_DAYS} days. The Audits page lists every one.`} className="admin-chart">
        {series.map((d) => (
          <div key={d.at} className="admin-bar">
            {d.count > 0 && <i style={{ height: `${Math.max(4, (d.count / busiest) * 100)}%` }} />}
            <span>
              {dayLabel(d.at)}: {d.count} audit{d.count === 1 ? '' : 's'}
            </span>
          </div>
        ))}
      </div>
      <div className="admin-axis">
        <small>{dayLabel(series[0].at)}</small>
        <small>Today</small>
      </div>
    </section>
  );
}

function Breakdown({ title, rows, empty = 'Nothing yet.' }: { title: string; rows: Tally[]; empty?: string }) {
  const top = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="admin-card">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="admin-muted">{empty}</p>
      ) : (
        <div className="admin-rows">
          {rows.map((row) => (
            <div key={row.label}>
              <p>
                <span>{row.label}</span>
                <b>{row.count}</b>
              </p>
              <i style={{ width: `${Math.max(2, (row.count / top) * 100)}%` }} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
