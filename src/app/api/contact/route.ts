import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contact — the report's "Submit inquiry".
 *
 * Emails the team when the deployment has a mail key and somewhere to send it
 * (`CONTACT_RESEND_KEY` or `AUTH_RESEND_KEY`, and `CONTACT_TO`). Without them it
 * answers 503, which the form reads as "open the reader's own mail app instead",
 * so a deployment with no mail set up still gets the message — just by a
 * different road.
 */

const MAX = { name: 80, email: 200, phone: 40, country: 80, message: 4000 };

const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 5) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : '');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function POST(request: Request) {
  const key = process.env.CONTACT_RESEND_KEY || process.env.AUTH_RESEND_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM || process.env.AUTH_EMAIL_FROM || 'Audix <hello@audix.com>';
  if (!key || !to) return Response.json({ error: 'Mail is not set up on this deployment.' }, { status: 503 });

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0] || 'local';
  if (limited(ip)) return Response.json({ error: 'That is a lot of messages. Try again in a few minutes.' }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const firstName = clean(body.firstName, MAX.name);
  const lastName = clean(body.lastName, MAX.name);
  const email = clean(body.email, MAX.email);
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX.message) : '';
  if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return Response.json({ error: 'First name, last name, a valid email and a message are all needed.' }, { status: 400 });
  }

  const phone = clean(body.phone, MAX.phone);
  const phoneCode = clean(body.phoneCode, 6);
  const country = clean(body.country, MAX.country);
  const reportUrl = clean(body.reportUrl, 400);
  const host = clean(body.host, 200);
  const score = typeof body.score === 'number' ? body.score : null;
  const findings = typeof body.findings === 'number' ? body.findings : null;

  const lines: [string, string][] = [
    ['Name', `${firstName} ${lastName}`],
    ['Email', email],
    ...(phone ? ([['Phone', `${phoneCode} ${phone}`]] as [string, string][]) : []),
    ...(country ? ([['Country', country]] as [string, string][]) : []),
    ['Site', host],
    ['Score', score == null ? 'not scored' : `${score}/100`],
    ['Issues', findings == null ? '—' : String(findings)],
    ['Report', reportUrl],
  ];

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `UX audit fixes — ${host || 'a report'} — ${firstName} ${lastName}`,
    text: `${lines.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${message}`,
    html: `<table>${lines.map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table><p style="white-space:pre-wrap">${esc(message)}</p>`,
  });
  if (error) return Response.json({ error: 'That did not send. Try again, or email hello@audix.com.' }, { status: 502 });

  return Response.json({ ok: true });
}
