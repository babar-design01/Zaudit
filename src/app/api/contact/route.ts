import { Resend } from 'resend';
import { verifyCaptcha } from '@/lib/captcha';
import { PLAN_CHOICES } from '@/lib/plan-request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contact — "Send message", from the homepage and from a report.
 *
 * Emails the team when the deployment has a mail key and somewhere to send it
 * (`CONTACT_RESEND_KEY` or `AUTH_RESEND_KEY`, and `CONTACT_TO`). Without them it
 * answers 503, which the form reads as "open the reader's own mail app instead",
 * so a deployment with no mail set up still gets the message — just by a
 * different road.
 */

const MAX = { name: 120, email: 200, website: 300, phone: 40, country: 80, message: 4000 };

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
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0] || 'local';
  if (limited(ip)) return Response.json({ error: 'That is a lot of messages. Try again in a few minutes.' }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  // Before anything else is looked at, so a robot learns nothing from the answers.
  if (!(await verifyCaptcha(body.captcha, ip))) {
    return Response.json({ error: 'The check did not pass. Please try it again.' }, { status: 400 });
  }

  const key = process.env.CONTACT_RESEND_KEY || process.env.AUTH_RESEND_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM || process.env.AUTH_EMAIL_FROM || 'Audix <hello@audix.com>';
  if (!key || !to) return Response.json({ error: 'Mail is not set up on this deployment.' }, { status: 503 });

  // A page opened before this was one field can still send the old two.
  const name = clean(body.name, MAX.name) || clean(`${clean(body.firstName, MAX.name)} ${clean(body.lastName, MAX.name)}`, MAX.name);
  const email = clean(body.email, MAX.email);
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX.message) : '';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return Response.json({ error: 'Your name, a valid email and a message are all needed.' }, { status: 400 });
  }

  const website = clean(body.website, MAX.website);
  // Sent as the label the form shows ("Pro", "Not sure yet"); anything else is dropped.
  const planText = clean(body.plan, 40);
  const plan = PLAN_CHOICES.find((c) => c.label === planText)?.label ?? '';
  // The form no longer asks for these, but a page opened before it changed can still send them.
  const phone = clean(body.phone, MAX.phone);
  const phoneCode = clean(body.phoneCode, 6);
  const country = clean(body.country, MAX.country);
  const reportUrl = clean(body.reportUrl, 400);
  const host = clean(body.host, 200);
  const score = typeof body.score === 'number' ? body.score : null;
  const findings = typeof body.findings === 'number' ? body.findings : null;

  const lines: [string, string][] = [
    ['Name', name],
    ['Email', email],
    ...(website ? ([['Website', website]] as [string, string][]) : []),
    ...(plan ? ([['Plan', plan]] as [string, string][]) : []),
    ...(phone ? ([['Phone', `${phoneCode} ${phone}`]] as [string, string][]) : []),
    ...(country ? ([['Country', country]] as [string, string][]) : []),
    // Only a message sent from a report has any of this to say.
    ...(reportUrl
      ? ([
          ['Site', host],
          ['Score', score == null ? 'not scored' : `${score}/100`],
          ['Issues', findings == null ? '—' : String(findings)],
          ['Report', reportUrl],
        ] as [string, string][])
      : []),
  ];

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: reportUrl ? `UX audit fixes — ${host || 'a report'} — ${name}` : plan ? `Plan request: ${plan}` : `ProCurveUX enquiry — ${name}`,
    text: `${lines.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${message}`,
    html: `<table>${lines.map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table><p style="white-space:pre-wrap">${esc(message)}</p>`,
  });
  if (error) return Response.json({ error: 'That did not send. Try again, or email sales@zeeframes.com.' }, { status: 502 });

  return Response.json({ ok: true });
}
