import { isAdmin } from '@/lib/admin';
import { listRuns, peopleFrom, peopleToCsv, runsToCsv } from '@/lib/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /admin/export — every recorded audit as a spreadsheet, or everyone with `?view=visitors`. */
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response('Not found', { status: 404 });
  const visitors = new URL(request.url).searchParams.get('view') === 'visitors';
  const runs = await listRuns();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(visitors ? peopleToCsv(peopleFrom(runs)) : runsToCsv(runs), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="procurveux-${visitors ? 'visitors' : 'audits'}-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
