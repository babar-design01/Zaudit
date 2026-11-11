import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { whenLabel } from '@/components/admin/format';
import { SignIn } from '@/components/admin/SignIn';
import { adminEnabled, isAdmin } from '@/lib/admin';
import { countryName } from '@/lib/usage';
import { listPluginEvents, summarizePlugin, type PluginEvent, type Tally } from '@/lib/plugin-usage';

export const dynamic = 'force-dynamic';

const RECENT_MAX = 200;

/**
 * `/admin/plugin`: how the ProCurveUX Figma plugin is used, from the anonymous
 * events it sends (lib/plugin-usage.ts). Installs are random ids the plugin
 * makes for itself, not people.
 */
export default async function PluginAdminPage() {
  if (!adminEnabled()) notFound();
  if (!(await isAdmin())) return <SignIn />;

  const events = await listPluginEvents();
  const s = summarizePlugin(events);
  const busiest = Math.max(1, ...s.days.map((d) => d.audits));

  return (
    <AdminShell active="plugin" title="Figma plugin">
      <div className="admin-tiles">
        <div className="admin-card admin-tile">
          <span>Installs</span>
          <strong>{s.installs}</strong>
          <small>{s.newThisWeek} new this week</small>
        </div>
        <div className="admin-card admin-tile">
          <span>Active</span>
          <strong>{s.active7}</strong>
          <small>Last 7 days ({s.active30} in 30)</small>
        </div>
        <div className="admin-card admin-tile">
          <span>Audits run</span>
          <strong>{s.audits}</strong>
          <small>{s.opens} plugin opens</small>
        </div>
        <div className="admin-card admin-tile">
          <span>Fixes applied</span>
          <strong>{s.fixesApplied}</strong>
          <small>{s.setups} design systems set up</small>
        </div>
        <div className="admin-card admin-tile">
          <span>Average score</span>
          <strong>{s.avgScore ?? '–'}</strong>
          <small>{s.avgFindings == null ? 'No audits yet' : `${s.avgFindings} findings per audit`}</small>
        </div>
      </div>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Plugin audits per day</h2>
          <small>Last 14 days.</small>
        </div>
        <div role="img" aria-label="Plugin audits per day over the last 14 days" className="admin-chart">
          {s.days.map((d) => (
            <div key={d.day} className="admin-bar">
              {d.audits > 0 && <i style={{ height: `${Math.max(4, (d.audits / busiest) * 100)}%` }} />}
              <span>
                {d.day}: {d.audits} audit{d.audits === 1 ? '' : 's'}
              </span>
            </div>
          ))}
        </div>
        <div className="admin-axis">
          <small>{s.days[0].day}</small>
          <small>Today</small>
        </div>
      </section>

      <div className="admin-panels">
        <Breakdown title="Most common problems" rows={s.topChecks} empty="No audits yet." />
        <Breakdown title="Versions" rows={s.versions} />
        <Breakdown title="Countries" rows={s.countries.map((c) => ({ label: c.label === 'unknown' ? 'Unknown' : countryName(c.label) || c.label, count: c.count }))} />
      </div>

      <section className="admin-card admin-flush">
        <div className="admin-card-head">
          <h2>Recent activity</h2>
          <small>Anonymous: an install is a random id the plugin made for itself. No designs, file names or text are sent.</small>
        </div>
        {events.length === 0 ? (
          <p className="admin-empty">Nothing yet. Events appear here once people run the plugin with usage sharing on.</p>
        ) : (
          <div className="admin-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Install</th>
                  <th scope="col">Event</th>
                  <th scope="col">Details</th>
                  <th scope="col">Version</th>
                  <th scope="col">Country</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, RECENT_MAX).map((e) => (
                  <tr key={e.id + e.at}>
                    <td>{whenLabel(e.at)}</td>
                    <td>
                      <code>{e.install.slice(0, 8)}</code>
                    </td>
                    <td>{EVENT_LABEL[e.event]}</td>
                    <td>{details(e)}</td>
                    <td>{e.version ?? '–'}</td>
                    <td>{e.country ? countryName(e.country) || e.country : '–'}</td>
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

const EVENT_LABEL: Record<PluginEvent['event'], string> = { open: 'Opened', audit: 'Audit', fix: 'Fixes', setup: 'Design system' };

function details(e: PluginEvent): string {
  if (e.event === 'audit') {
    const parts = [e.score != null ? `score ${e.score}` : null, `${e.findings ?? 0} findings`, e.frames ? `${e.frames} frame${e.frames === 1 ? '' : 's'}` : null, e.scope === 'page' ? 'whole page' : null];
    if (e.counts && e.counts[0]) parts.push(`${e.counts[0]} critical`);
    return parts.filter(Boolean).join(', ');
  }
  if (e.event === 'fix') return `${e.fixed ?? 0} fixed${e.failed ? `, ${e.failed} could not` : ''}`;
  if (e.event === 'setup') return [e.variables ? `${e.variables} color variables` : null, e.styles ? `${e.styles} text styles` : null].filter(Boolean).join(', ') || 'Nothing new';
  return '';
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
