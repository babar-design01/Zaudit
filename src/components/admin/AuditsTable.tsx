import { countryName, hostOf, type RunRecord } from '@/lib/usage';
import { deviceLabel, place, sourceLabel, whenLabel } from './format';

const RESULT: Record<Exclude<RunRecord['status'], 'scored'>, string> = {
  unscored: 'No score',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

function resultOf(run: RunRecord): string {
  return run.status === 'scored' ? `${run.overall} ${run.band ?? ''}` : RESULT[run.status];
}

export function Who({ email, visitor }: { email: string | null; visitor: string | null }) {
  if (email) return <a href={`mailto:${email}`}>{email}</a>;
  return <span className="admin-muted">{visitor ? `Anonymous · ${visitor.slice(0, 6)}` : 'Before tracking'}</span>;
}

/** Where and how, stacked into one column so the table fits without sideways scrolling on a laptop. */
export function Where(props: { city: string | null; country: string | null; browser: string | null; os: string | null; device: string | null; source: RunRecord['source'] }) {
  return (
    <>
      {place(props.city, countryName(props.country))}
      <small>
        {deviceLabel(props)} · {sourceLabel(props.source)}
      </small>
    </>
  );
}

export function AuditsTable({ runs }: { runs: RunRecord[] }) {
  if (!runs.length) return <p className="admin-empty">No audits match.</p>;
  return (
    <div className="admin-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Who</th>
            <th scope="col">Site</th>
            <th scope="col">Result</th>
            <th scope="col" className="num" title="Critical, major and minor issues">Issues</th>
            <th scope="col" className="num">Time</th>
            <th scope="col">Location and device</th>
            <th scope="col">Report</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={`${r.at}-${r.id}`}>
              <td className="nowrap">{whenLabel(r.at)}</td>
              <td className="admin-who">
                <Who email={r.email} visitor={r.visitor} />
              </td>
              <td title={r.url}>
                {hostOf(r.url)}
                <small>{r.goal}</small>
              </td>
              <td className="admin-result">
                {resultOf(r)}
                {r.note && <small>{r.note}</small>}
              </td>
              <td className="num" title={`${r.critical} critical, ${r.major} major, ${r.minor} minor`}>
                {r.critical + r.major + r.minor}
                <small>
                  {r.critical} critical, {r.major} major
                </small>
              </td>
              <td className="num">{r.cached ? 'Cache' : r.tookMs == null ? '–' : `${Math.round(r.tookMs / 1000)}s`}</td>
              <td>
                <Where {...r} />
              </td>
              <td>{r.status === 'scored' || r.status === 'unscored' ? <a href={`/report/${encodeURIComponent(r.id)}`}>Open</a> : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
