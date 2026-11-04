import { countryName, peopleFrom, personKey, type Person, type RunRecord, type RunStatus } from '@/lib/usage';
import { inRange, rangeOf, type RangeId } from './format';

export const STATUSES: { id: RunStatus; label: string }[] = [
  { id: 'scored', label: 'Scored' },
  { id: 'unscored', label: 'No score' },
  { id: 'failed', label: 'Failed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const SOURCES: { id: NonNullable<RunRecord['source']>; label: string }[] = [
  { id: 'site', label: 'Website' },
  { id: 'extension', label: 'Extension' },
];

export type Filters = {
  q: string;
  status: RunStatus | '';
  source: NonNullable<RunRecord['source']> | '';
  range: RangeId;
  /** One person's audits, from a Visitors row. */
  person: string;
  /** Whether anything differs from what the page opens with. */
  active: boolean;
};

export type Asked = Record<string, string | string[] | undefined>;

/** A repeated parameter arrives as a list, and nothing here offers one. */
export const one = (value: string | string[] | undefined) => (typeof value === 'string' ? value : '');

export function readFilters(asked: Asked, fallback: RangeId = 'all'): Filters {
  const q = one(asked.q).trim();
  const status = STATUSES.find((s) => s.id === one(asked.status))?.id ?? '';
  const source = SOURCES.find((s) => s.id === one(asked.source))?.id ?? '';
  const range = rangeOf(one(asked.range), fallback);
  const person = one(asked.person);
  return { q, status, source, range, person, active: !!(q || status || source || person) || range !== fallback };
}

/** The filters as a query string, so a link or a download shows what the page is showing. */
export function filterQuery(filters: Filters, extra: Record<string, string> = {}): string {
  const { q, status, source, range, person } = filters;
  const query = new URLSearchParams(Object.entries({ q, status, source, range: range === 'all' ? '' : range, person, ...extra }).filter(([, value]) => value));
  const text = query.toString();
  return text ? `?${text}` : '';
}

function found(run: RunRecord, q: string): boolean {
  return [run.email, run.url, run.visitor, run.city, countryName(run.country), run.goal].some((field) => field?.toLowerCase().includes(q));
}

/** Everything but the period, for the chart, which always shows its own 30 days. */
export function matching(runs: RunRecord[], filters: Filters): RunRecord[] {
  const q = filters.q.toLowerCase();
  return runs.filter(
    (run) =>
      (!q || found(run, q)) &&
      (!filters.person || personKey(run) === filters.person) &&
      (!filters.status || run.status === filters.status) &&
      (!filters.source || run.source === filters.source),
  );
}

export const filterRuns = (runs: RunRecord[], filters: Filters) => inRange(matching(runs, filters), filters.range);

/**
 * Everyone with at least one matching audit. Their counts cover only those audits,
 * but first and last seen stay true to all of them: someone who first came a year
 * ago is not new because the period is this week.
 */
export function filterPeople(runs: RunRecord[], filters: Filters): Person[] {
  const everyone = new Map(peopleFrom(runs).map((person) => [person.key, person]));
  return peopleFrom(filterRuns(runs, filters))
    .map((person) => {
      const whole = everyone.get(person.key);
      return whole ? { ...person, firstSeen: whole.firstSeen, lastSeen: whole.lastSeen } : person;
    })
    .sort((a, b) => b.lastSeen - a.lastSeen);
}
