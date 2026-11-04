import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { AuditsTable } from '@/components/admin/AuditsTable';
import { RANGES, inRange, rangeOf } from '@/components/admin/format';
import { SignIn } from '@/components/admin/SignIn';
import { adminEnabled, isAdmin } from '@/lib/admin';
import { countryName, listRuns, personKey, type RunRecord } from '@/lib/usage';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;
const STATUSES: { id: RunRecord['status']; label: string }[] = [
  { id: 'scored', label: 'Scored' },
  { id: 'unscored', label: 'No score' },
  { id: 'failed', label: 'Failed' },
  { id: 'cancelled', label: 'Cancelled' },
];

type Params = { q?: string; person?: string; status?: string; source?: string; range?: string; page?: string };

function matches(run: RunRecord, q: string): boolean {
  return [run.email, run.url, run.visitor, run.city, countryName(run.country), run.goal].some((field) => field?.toLowerCase().includes(q));
}

/** Every audit, searchable. `person` comes from the Visitors page and narrows it to one person. */
export default async function AuditsPage({ searchParams }: { searchParams: Promise<Params> }) {
  if (!adminEnabled()) notFound();
  if (!(await isAdmin())) return <SignIn />;

  const params = await searchParams;
  const q = (params.q ?? '').trim().toLowerCase();
  const range = rangeOf(params.range, 'all');
  const runs = inRange(await listRuns(), range).filter(
    (r) =>
      (!q || matches(r, q)) &&
      (!params.person || personKey(r) === params.person) &&
      (!params.status || r.status === params.status) &&
      (!params.source || r.source === params.source),
  );

  const pages = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  const shown = runs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const linkTo = (n: number) => {
    const next = new URLSearchParams(Object.entries({ ...params, page: String(n) }).filter((e): e is [string, string] => !!e[1]));
    return `/admin/audits?${next}`;
  };

  return (
    <AdminShell active="audits" title="Audits" actions={<a href="/admin/export" className="admin-link">Download CSV</a>}>
      {params.person ? (
        <p className="admin-filtered">
          Showing one person&apos;s audits. <Link href="/admin/audits">Show everyone</Link>
        </p>
      ) : (
        <form method="get" className="admin-filters">
          <label>
            Search
            <input type="search" name="q" defaultValue={params.q ?? ''} placeholder="Email, site, city or country" />
          </label>
          <label>
            Result
            <select name="status" defaultValue={params.status ?? ''}>
              <option value="">All results</option>
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <select name="source" defaultValue={params.source ?? ''}>
              <option value="">Anywhere</option>
              <option value="site">Website</option>
              <option value="extension">Extension</option>
            </select>
          </label>
          <label>
            Period
            <select name="range" defaultValue={range}>
              {RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Apply</button>
        </form>
      )}

      <section className="admin-card admin-flush">
        <div className="admin-card-head">
          <h2>
            {runs.length} audit{runs.length === 1 ? '' : 's'}
          </h2>
        </div>
        <AuditsTable runs={shown} />
      </section>

      {pages > 1 && (
        <nav aria-label="Pages" className="admin-pages">
          {page > 1 ? <Link href={linkTo(page - 1)}>Previous</Link> : <span />}
          <small>
            Page {page} of {pages}
          </small>
          {page < pages ? <Link href={linkTo(page + 1)}>Next</Link> : <span />}
        </nav>
      )}
    </AdminShell>
  );
}
