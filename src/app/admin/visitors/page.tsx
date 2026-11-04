import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { Where, Who } from '@/components/admin/AuditsTable';
import { whenLabel } from '@/components/admin/format';
import { SignIn } from '@/components/admin/SignIn';
import { adminEnabled, isAdmin } from '@/lib/admin';
import { countryName, listRuns, peopleFrom } from '@/lib/usage';

export const dynamic = 'force-dynamic';

const TABLE_MAX = 500;

/** Everyone who has run an audit. Someone who only looked at the site is not recorded. */
export default async function VisitorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!adminEnabled()) notFound();
  if (!(await isAdmin())) return <SignIn />;

  const { q: asked } = await searchParams;
  const q = (asked ?? '').trim().toLowerCase();
  const everyone = peopleFrom(await listRuns());
  const people = q
    ? everyone.filter((p) => [p.email, p.visitor, p.city, countryName(p.country)].some((field) => field?.toLowerCase().includes(q)))
    : everyone;
  const withEmail = everyone.filter((p) => p.email).length;
  const returning = everyone.filter((p) => p.audits > 1).length;

  return (
    <AdminShell active="visitors" title="Visitors" actions={<a href="/admin/export?view=visitors" className="admin-link">Download CSV</a>}>
      <div className="admin-tiles">
        <div className="admin-card admin-tile">
          <span>People</span>
          <strong>{everyone.length}</strong>
        </div>
        <div className="admin-card admin-tile">
          <span>With an email</span>
          <strong>{withEmail}</strong>
        </div>
        <div className="admin-card admin-tile">
          <span>Anonymous</span>
          <strong>{everyone.length - withEmail}</strong>
          <small>From before emails were required</small>
        </div>
        <div className="admin-card admin-tile">
          <span>Came back</span>
          <strong>{returning}</strong>
          <small>Ran more than one audit</small>
        </div>
      </div>

      <form method="get" className="admin-filters">
        <label>
          Search
          <input type="search" name="q" defaultValue={asked ?? ''} placeholder="Email, city or country" />
        </label>
        <button type="submit">Search</button>
      </form>

      <section className="admin-card admin-flush">
        <div className="admin-card-head">
          <h2>
            {people.length} {people.length === 1 ? 'person' : 'people'}
          </h2>
          <small>Emails are as typed, and are not verified.</small>
        </div>
        {people.length === 0 ? (
          <p className="admin-empty">No one matches.</p>
        ) : (
          <div className="admin-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Who</th>
                  <th scope="col">Location and device</th>
                  <th scope="col" className="num">Audits</th>
                  <th scope="col" className="num">Sites</th>
                  <th scope="col" className="num">Avg score</th>
                  <th scope="col">First seen</th>
                  <th scope="col">Last seen</th>
                  <th scope="col">Audits</th>
                </tr>
              </thead>
              <tbody>
                {people.slice(0, TABLE_MAX).map((p) => (
                  <tr key={p.key}>
                    <td className="admin-who">
                      <Who email={p.email} visitor={p.visitor} />
                    </td>
                    <td>
                      <Where {...p} />
                    </td>
                    <td className="num">{p.audits}</td>
                    <td className="num">{p.sites}</td>
                    <td className="num">{p.averageScore == null ? '–' : Math.round(p.averageScore)}</td>
                    <td className="nowrap">{whenLabel(p.firstSeen)}</td>
                    <td className="nowrap">{whenLabel(p.lastSeen)}</td>
                    <td>
                      <Link href={`/admin/audits?person=${encodeURIComponent(p.key)}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
