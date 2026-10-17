import { getReport } from '@/lib/report/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/audit/:id — one finished report, by the id its run was given.
 *
 * Where the report comes from depends on the deployment: the running process on
 * one server, a private object in Vercel Blob when the token is configured.
 * Either way a miss is not fatal — the report page falls back to the copy the
 * reader's own browser kept, so a reload inside the session still works.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getReport(id);
  if (!result) {
    return Response.json(
      { error: 'That report is no longer on the server. Run the audit again to produce a fresh one.' },
      { status: 404 },
    );
  }
  return Response.json(result, { headers: { 'Cache-Control': 'private, max-age=600' } });
}
