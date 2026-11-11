import { cleanEvent, recordPluginEvent } from '@/lib/plugin-usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/plugin/events: anonymous usage from the ProCurveUX Figma plugin.
 *
 * A Figma plugin's window has the origin "null", so this answers any origin.
 * The plugin sends its JSON as text/plain, a "simple" request that needs no
 * preflight; OPTIONS is answered anyway for clients that ask.
 *
 * Nothing here can identify a person: see lib/plugin-usage.ts for what an
 * event may hold. Bad input is dropped quietly, so the plugin never shows an
 * error for it.
 */

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' };

const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 60) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0] || 'local';
  if (limited(ip)) return new Response(null, { status: 429, headers: CORS });
  const text = await request.text().catch(() => '');
  if (text.length > 8_000) return new Response(null, { status: 413, headers: CORS });
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  const event = cleanEvent(body, request.headers.get('x-vercel-ip-country'));
  if (event) await recordPluginEvent(event);
  return new Response(null, { status: event ? 204 : 400, headers: CORS });
}
