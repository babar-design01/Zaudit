'use client';

/* Ported from design/Report.dc.html — values transcribed by script, not by hand. */

import { useState, type FormEvent } from 'react';
import type { AuditResult } from '@/lib/audit/types';
import { PLAN_CHOICES, paidPlan, planLabel, planMessage, planSummary, type PlanChoice } from '@/lib/plan-request';
import { TURNSTILE_SITE_KEY, Turnstile } from './Turnstile';

/** Where a message goes when the server has no way to send mail. */
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'sales@zeeframes.com';

/**
 * "Talk to our team about these fixes": copy and the trust-badge strip on a
 * quiet panel, the form on white between two dotted glow strips.
 *
 * Submitting posts to /api/contact, which emails the team when the deployment
 * has a mail key. Without one it answers 503 and the browser opens the
 * reader's own mail app with the same message, so the form never dead-ends.
 *
 * The same form closes the homepage, where there is no report to talk about and
 * the copy and the message say so.
 *
 * On /contact it is the page itself (`page`), and a pricing card's button opens
 * it with a plan chosen (`plan`): the plan is shown above the form, preselected
 * in the Plan field and written into the message, and all of it stays editable.
 *
 * TODO(design): confirm the trust badges are ProCurveUX's own, or label them.
 */
export function Contact({ result, plan: initialPlan = null, page = false }: { result?: AuditResult; plan?: PlanChoice | null; page?: boolean }) {
  // A report's form is about fixing that report, so only the others ask about plans.
  const asksPlan = !result;
  const [plan, setPlan] = useState<PlanChoice | ''>(initialPlan ?? '');
  const chosen = paidPlan(plan || null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [captchaRound, setCaptchaRound] = useState(0);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    if (TURNSTILE_SITE_KEY && !captcha) {
      setProblem('Please complete the check above the button first.');
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const about = result ? { reportId: result.id, reportUrl: window.location.href, host: hostOf(result.finalUrl), score: result.overall, findings: result.findings.length } : {};
    // The plan goes as its label ("Pro", "Not sure yet"), which is what the email shows.
    const planSent = data.plan ? planLabel(data.plan as PlanChoice) : '';
    const payload = { ...data, plan: planSent, ...about, captcha };
    const requested = paidPlan((data.plan as PlanChoice) || null);
    setBusy(true);
    setProblem(null);
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setSent(requested ? `Thanks. We'll email you within one working day to set up your ${requested.name} plan.` : 'Thanks — we have your message and a person will reply within a working day.');
        form.reset();
        return;
      }
      if (res.status === 503) {
        window.location.href = mailtoFor(payload);
        setSent('Your mail app should have opened with the message ready to send.');
        return;
      }
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setProblem(err.error ?? `That did not send. Try again, or email ${CONTACT_EMAIL}.`);
      // A token works once, so another try needs a new one.
      setCaptcha(null);
      setCaptchaRound((n) => n + 1);
    } catch {
      window.location.href = mailtoFor(payload);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      
      
      {/* contact: copy on a quiet panel, the form on white between two dotted glow strips */}
      <section id="contact" style={{ background: "#FFFFFF", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch" }}>
          <div style={{ flex: "1 1 520px", minWidth: "0", background: "var(--bg-subtle)", padding: "96px clamp(16px, 5.56vw, 80px)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "56px" }}>
            <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {page ? (
                <h1 style={{ margin: "0", font: "500 clamp(40px, 4.4vw, 64px)/1.06 var(--font-sans)", letterSpacing: "-0.035em", color: "var(--ink)", textWrap: "balance" }}>{chosen ? `Start the ${chosen.name} plan` : 'Talk to the ProCurveUX team'}</h1>
              ) : (
              <h2 style={{ margin: "0", font: "500 clamp(40px, 4vw, 60px)/1.08 var(--font-sans)", letterSpacing: "-0.035em", color: "var(--ink)", textWrap: "balance" }}>{result ? 'Talk to our team about these fixes' : 'Need help fixing what ProCurveUX found?'}</h2>
              )}
              {page && <p style={{ margin: "0", font: "400 18px/30px var(--font-sans)", color: "var(--ink)", textWrap: "pretty" }}>Ask about a plan, a report or anything else. Paid plans are set up by hand: send the form, and we reply by email to switch your plan on. Nothing is charged on this site.</p>}
              <p style={{ margin: "0", font: "400 18px/30px var(--font-sans)", color: "var(--ink)", textWrap: "pretty" }}>{result ? "Send us this report and we'll come back with what each fix takes, in hours, not a proposal." : page ? <>Need the fixes built too? Our design team at <a href="https://zeeframes.com/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px", textDecorationThickness: "1px" }}>ZeeFrames</a> can design and build them.</> : <>Our design team at <a href="https://zeeframes.com/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px", textDecorationThickness: "1px" }}>ZeeFrames</a> can design and build the fixes for you. Tell us about your site.</>}</p>
              <p style={{ margin: "0", font: "400 18px/30px var(--font-sans)", color: "var(--ink)", textWrap: "pretty" }}>{result ? 'Prefer to fix it yourself? Every issue above shows exactly what to change.' : 'A person will reply within a working day.'}</p>
            </div>
            {result && <div style={{ paddingTop: "28px", borderTop: "1px solid #E3E7EF" }}>
              <img src="/trust-badges.png" alt="ISO 9001:2015 certified, Clutch top IT services company, GoodFirms, 2025 winner for custom software development" style={{ display: "block", width: "100%", maxWidth: "440px", height: "auto", opacity: "0.85" }} />
            </div>}
          </div>
          <div data-contact-form style={{ flex: "1 1 560px", minWidth: "0", position: "relative", padding: "72px 96px", display: "flex", justifyContent: "center" }}>
            <div aria-hidden="true" data-dots="" style={{ position: "absolute", top: "0", bottom: "0", left: "0", width: "72px", backgroundImage: "radial-gradient(circle, rgba(10, 11, 13, 0.0) 0, rgba(10, 11, 13, 0) 100%), radial-gradient(circle, #5E9BFF 1.2px, transparent 1.6px), linear-gradient(180deg, rgba(168, 243, 255, 0) 0%, rgba(168, 243, 255, 0.55) 25%, rgba(94, 155, 255, 0.45) 55%, rgba(127, 178, 255, 0.35) 80%, rgba(127, 178, 255, 0) 100%)", backgroundSize: "auto, 9px 9px, auto", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)", maskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)" }}></div>
            <div aria-hidden="true" data-dots="" style={{ position: "absolute", top: "0", bottom: "0", right: "0", width: "72px", backgroundImage: "radial-gradient(circle, rgba(10, 11, 13, 0.0) 0, rgba(10, 11, 13, 0) 100%), radial-gradient(circle, #5E9BFF 1.2px, transparent 1.6px), linear-gradient(180deg, rgba(168, 243, 255, 0) 0%, rgba(168, 243, 255, 0.55) 25%, rgba(94, 155, 255, 0.45) 55%, rgba(127, 178, 255, 0.35) 80%, rgba(127, 178, 255, 0) 100%)", backgroundSize: "auto, 9px 9px, auto", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)", maskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)" }}></div>
            <form aria-label={result ? 'Ask us to fix these findings' : 'Contact us'} onSubmit={submit} noValidate={false} style={{ position: "relative", width: "100%", maxWidth: "520px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "24px 16px" }}>
              {chosen && !sent && (
                <div data-plan-summary aria-live="polite" style={{ gridColumn: "1 / -1", padding: "18px 20px", background: "var(--blue-tint)", border: "1px solid #D6E4FB", borderRadius: "8px", display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "6px 16px" }}>
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ font: "600 11px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent-fg)" }}>Your plan</span>
                    <span style={{ font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.015em", color: "var(--ink)" }}>{planSummary(chosen).name}</span>
                  </span>
                  <span style={{ font: "500 15px/22px var(--font-sans)", color: "var(--ink-secondary)" }}>{planSummary(chosen).price} · {planSummary(chosen).audits}</span>
                </div>
              )}
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="c-name" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Full name<span style={{ color: "var(--critical)" }}>*</span></label>
                <input id="c-name" name="name" type="text" autoComplete="name" required placeholder="For example, Jerry Liu" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#FFFFFF", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none" }} />
              </div>
              <div style={{ minWidth: "0", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="c-email" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Email address<span style={{ color: "var(--critical)" }}>*</span></label>
                <input id="c-email" name="email" type="email" autoComplete="email" required placeholder="jane@company.com" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#FFFFFF", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none" }} />
              </div>
              <div style={{ minWidth: "0", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="c-website" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Website URL (optional)</label>
                <input id="c-website" name="website" type="text" inputMode="url" autoComplete="url" placeholder="https://yourwebsite.com" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#FFFFFF", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none" }} />
              </div>
              {asksPlan && (
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label htmlFor="c-plan" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Plan (optional)</label>
                  <select id="c-plan" name="plan" value={plan} onChange={(e) => setPlan(e.target.value as PlanChoice | '')} style={{ width: "100%", minHeight: "48px", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#FFFFFF", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)" }}>
                    <option value="">No plan, just a question</option>
                    {PLAN_CHOICES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="c-message" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Message<span style={{ color: "var(--critical)" }}>*</span></label>
                <textarea id="c-message" name="message" rows={4} required defaultValue={asksPlan ? planMessage(initialPlan) : undefined} placeholder="Tell us about your project, goals, timeline, or requirements" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#FFFFFF", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none", resize: "vertical" }}></textarea>
              </div>
              {!sent && TURNSTILE_SITE_KEY && (
                <Turnstile
                  resetKey={captchaRound}
                  onToken={(token) => {
                    setCaptcha(token);
                    if (token) setProblem(null);
                  }}
                  onFail={() => setCaptchaFailed(true)}
                />
              )}
              {!sent && captchaFailed && !captcha && <p role="alert" style={{ gridColumn: "1 / -1", margin: 0, font: "400 14px/20px var(--font-sans)", color: "var(--critical)" }}>The check could not load. Refresh the page, or email {CONTACT_EMAIL}.</p>}
              {!sent && problem && <p role="alert" style={{ gridColumn: "1 / -1", margin: 0, font: "400 14px/20px var(--font-sans)", color: "var(--critical)" }}>{problem}</p>}
              {!sent && <p style={{ gridColumn: "1 / -1", margin: "4px 0 -8px", font: "400 13px/20px var(--font-sans)", color: "var(--ink-muted)" }}>By sending this message you agree to our <a href="/terms" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: "3px" }}>Terms</a> and <a href="/privacy" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: "3px" }}>Privacy policy</a>.</p>}
              {sent ? (<p role="status" style={{ gridColumn: "1 / -1", margin: 0, padding: "14px 16px", background: "var(--blue-tint)", borderRadius: "8px", font: "500 15px/22px var(--font-sans)", color: "var(--ink)" }}>{sent}</p>) : (<button type="submit" disabled={busy} data-cta="primary" style={{ gridColumn: "1 / -1", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink)", color: "#FFFFFF", border: "none", cursor: "pointer", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "18px 24px", borderRadius: "2px" }}>{busy ? "Sending…" : "Send message"}</button>)}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/** The same message, addressed to the team, for when there is no mail backend. */
function mailtoFor(p: Record<string, unknown>): string {
  const subject = p.host ? `UX audit fixes — ${p.host}` : p.plan ? `Plan request: ${p.plan}` : `ProCurveUX enquiry — ${p.name ?? ''}`;
  const body = [
    `Name: ${p.name ?? ''}`,
    `Email: ${p.email ?? ''}`,
    p.website ? `Website: ${p.website}` : '',
    p.plan ? `Plan: ${p.plan}` : '',
    '',
    String(p.message ?? ''),
    '',
    p.reportUrl ? `Report: ${p.reportUrl} (score ${p.score ?? 'n/a'}, ${p.findings} issues)` : '',
  ].join('\n');
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
