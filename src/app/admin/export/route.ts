import { filterPeople, filterRuns, readFilters } from '@/components/admin/filters';
import { isAdmin } from '@/lib/admin';
import { listRuns, peopleToCsv, runsToCsv } from '@/lib/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /admin/export — the audits the page is showing, or the people with `?view=visitors`. */
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response('Not found', { status: 404 });
  const asked = new URL(request.url).searchParams;
  const visitors = asked.get('view') === 'visitors';
  const filters = readFilters(Object.fromEntries(asked));
  const runs = await listRuns();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(visitors ? peopleToCsv(filterPeople(runs, filters)) : runsToCsv(filterRuns(runs, filters)), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="procurveux-${visitors ? 'visitors' : 'audits'}-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
