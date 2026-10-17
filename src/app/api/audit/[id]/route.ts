import { reports } from '../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/audit/:id — one finished report, by the id its run was given.
 *
 * Reports live in the same in-memory store as the result cache, which is the
 * right size for one server and lasts as long as the process. A report page
 * opened later falls back to the copy the browser kept, so a reload inside the
 * session still works even when this misses.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hit = reports.get(id);
  if (!hit) {
    return Response.json({ error: 'That report is no longer on the server. Run the audit again to produce a fresh one.' }, { status: 404 });
  }
  return Response.json(hit.result, { headers: { 'Cache-Control': 'private, max-age=600' } });
}
