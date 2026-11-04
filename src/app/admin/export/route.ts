import { isAdmin } from '@/lib/admin';
import { listRuns, runsToCsv } from '@/lib/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /admin/export — every recorded audit as a spreadsheet. */
export async function GET() {
  if (!(await isAdmin())) return new Response('Not found', { status: 404 });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(runsToCsv(await listRuns()), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="audix-audits-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
