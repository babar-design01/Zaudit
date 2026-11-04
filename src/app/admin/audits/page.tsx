import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminShell } from '@/components/admin/AdminShell';
import { AuditsTable } from '@/components/admin/AuditsTable';
import { filterQuery, filterRuns, one, readFilters, type Asked } from '@/components/admin/filters';
import { SignIn } from '@/components/admin/SignIn';
import { adminEnabled, isAdmin } from '@/lib/admin';
import { listRuns } from '@/lib/usage';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

/** Every audit, searchable. `person` comes from the Visitors page and narrows it to one person. */
export default async function AuditsPage({ searchParams }: { searchParams: Promise<Asked> }) {
  if (!adminEnabled()) notFound();
  if (!(await isAdmin())) return <SignIn />;

  const asked = await searchParams;
  const filters = readFilters(asked);
  const runs = filterRuns(await listRuns(), filters);

  const pages = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(one(asked.page)) || 1));
  const shown = runs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const linkTo = (n: number) => `/admin/audits${filterQuery(filters, { page: String(n) })}`;

  return (
    <AdminShell active="audits" title="Audits" actions={<a href={`/admin/export${filterQuery(filters)}`} className="admin-link">Download CSV</a>}>
      <AdminFilters filters={filters} path="/admin/audits" />
      {filters.person && (
        <p className="admin-filtered">
          Showing one person&apos;s audits. <Link href={`/admin/audits${filterQuery({ ...filters, person: '' })}`}>Show everyone</Link>
        </p>
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
