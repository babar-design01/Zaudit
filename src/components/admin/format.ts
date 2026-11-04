import type { RunRecord } from '@/lib/usage';

/** Days and times are read in the team's own zone, not the server's. */
export const ZONE = process.env.ADMIN_TIME_ZONE || 'Asia/Karachi';
const DAY = 86_400_000;

export const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
] as const;
export type RangeId = (typeof RANGES)[number]['id'];

export const rangeOf = (asked: string | undefined, fallback: RangeId): RangeId => RANGES.find((r) => r.id === asked)?.id ?? fallback;

export const dayKey = (at: number) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
export const dayLabel = (at: number) => new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short' }).format(at);
export const whenLabel = (at: number) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(at);

export function inRange<T extends RunRecord>(runs: T[], range: RangeId): T[] {
  if (range === 'all') return runs;
  if (range === 'today') {
    const today = dayKey(Date.now());
    return runs.filter((r) => dayKey(r.at) === today);
  }
  const since = Date.now() - (range === '7d' ? 7 : 30) * DAY;
  return runs.filter((r) => r.at >= since);
}

export const days = (count: number) =>
  Array.from({ length: count }, (_, i) => Date.now() - (count - 1 - i) * DAY);

export const place = (city: string | null, country: string | null) => [city, country].filter(Boolean).join(', ') || '–';
export const deviceLabel = (r: { browser: string | null; os: string | null; device: string | null }) =>
  [r.browser, r.os, r.device].filter(Boolean).join(' · ') || '–';
export const sourceLabel = (source: RunRecord['source']) => (source === 'extension' ? 'Extension' : source === 'site' ? 'Website' : '–');
