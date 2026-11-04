import Link from 'next/link';
import { RANGES } from './format';
import { SOURCES, STATUSES, type Filters } from './filters';

/** The same four filters on every admin page. `path` is the page itself, which is where Clear goes. */
export function AdminFilters({ filters, path }: { filters: Filters; path: string }) {
  return (
    <form method="get" className="admin-filters">
      <label>
        Search
        <input type="search" name="q" defaultValue={filters.q} placeholder="Email, site, city or country" />
      </label>
      <label>
        Result
        <select name="status" defaultValue={filters.status}>
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
        <select name="source" defaultValue={filters.source}>
          <option value="">Anywhere</option>
          {SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Period
        <select name="range" defaultValue={filters.range}>
          {RANGES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      {filters.person && <input type="hidden" name="person" value={filters.person} />}
      <button type="submit">Apply</button>
      {filters.active && (
        <Link href={path} className="admin-clear">
          Clear
        </Link>
      )}
    </form>
  );
}
