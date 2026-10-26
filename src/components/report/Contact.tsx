'use client';

/* Ported from design/Report.dc.html — values transcribed by script, not by hand. */

import { useState, type FormEvent } from 'react';
import type { AuditResult } from '@/lib/audit/types';

/**
 * "Talk to our team about these fixes": copy and the trust-badge strip on a
 * quiet panel, the form on white between two dotted glow strips.
 *
 * Submitting posts to /api/contact, which emails the team when the deployment
 * has a mail key. Without one it answers 503 and the browser opens the
 * reader's own mail app with the same message, so the form never dead-ends.
 *
 * TODO(design): confirm the trust badges are Audix's own, or label them.
 */
export function Contact({ result }: { result: AuditResult }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const payload = { ...data, reportId: result.id, reportUrl: window.location.href, host: hostOf(result.finalUrl), score: result.overall, findings: result.findings.length };
    setBusy(true);
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setSent('Thanks — we have your message and a person will reply within a working day.');
        form.reset();
        return;
      }
      if (res.status === 503) {
        window.location.href = mailtoFor(payload);
        setSent('Your mail app should have opened with the message ready to send.');
        return;
      }
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setSent(err.error ?? 'That did not send. Try again, or email hello@audix.com.');
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
              <h2 style={{ margin: "0", font: "600 clamp(40px, 4vw, 60px)/1.08 var(--font-sans)", letterSpacing: "-0.035em", background: "linear-gradient(100deg, #2BC8E8 0%, var(--blue) 45%, #7F8CFF 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", textWrap: "balance" }}>Talk to our team about these fixes</h2>
              <p style={{ margin: "0", font: "400 18px/30px var(--font-sans)", color: "var(--ink)", textWrap: "pretty" }}>Send us this report and we'll come back with what each fix takes, in hours, not a proposal.</p>
              <p style={{ margin: "0", font: "400 18px/30px var(--font-sans)", color: "var(--ink)", textWrap: "pretty" }}>Prefer to fix it yourself? Every issue above shows exactly what to change.</p>
            </div>
            <div style={{ paddingTop: "28px", borderTop: "1px solid #E3E7EF" }}>
              <img src="/trust-badges.png" alt="ISO 9001:2015 certified, Clutch top IT services company, GoodFirms, 2025 winner for custom software development" style={{ display: "block", width: "100%", maxWidth: "440px", height: "auto", opacity: "0.85" }} />
            </div>
          </div>
          <div data-contact-form style={{ flex: "1 1 560px", minWidth: "0", position: "relative", padding: "72px 96px", display: "flex", justifyContent: "center" }}>
            <div aria-hidden="true" data-dots="" style={{ position: "absolute", top: "0", bottom: "0", left: "0", width: "72px", backgroundImage: "radial-gradient(circle, rgba(10, 11, 13, 0.0) 0, rgba(10, 11, 13, 0) 100%), radial-gradient(circle, #5E9BFF 1.2px, transparent 1.6px), linear-gradient(180deg, rgba(168, 243, 255, 0) 0%, rgba(168, 243, 255, 0.55) 25%, rgba(94, 155, 255, 0.45) 55%, rgba(127, 178, 255, 0.35) 80%, rgba(127, 178, 255, 0) 100%)", backgroundSize: "auto, 9px 9px, auto", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)", maskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)" }}></div>
            <div aria-hidden="true" data-dots="" style={{ position: "absolute", top: "0", bottom: "0", right: "0", width: "72px", backgroundImage: "radial-gradient(circle, rgba(10, 11, 13, 0.0) 0, rgba(10, 11, 13, 0) 100%), radial-gradient(circle, #5E9BFF 1.2px, transparent 1.6px), linear-gradient(180deg, rgba(168, 243, 255, 0) 0%, rgba(168, 243, 255, 0.55) 25%, rgba(94, 155, 255, 0.45) 55%, rgba(127, 178, 255, 0.35) 80%, rgba(127, 178, 255, 0) 100%)", backgroundSize: "auto, 9px 9px, auto", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)", maskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)" }}></div>
            <form aria-label="Ask us to fix these findings" onSubmit={submit} noValidate={false} style={{ position: "relative", width: "100%", maxWidth: "520px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "24px 16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="c-first" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>First name<span style={{ color: "var(--critical)" }}>*</span></label>
                <input id="c-first" name="firstName" type="text" autoComplete="given-name" required placeholder="For example, Jerry" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#FFFFFF", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="c-last" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Last name<span style={{ color: "var(--critical)" }}>*</span></label>
                <input id="c-last" name="lastName" type="text" autoComplete="family-name" required placeholder="For example, Liu" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#FFFFFF", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="c-email" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Email address<span style={{ color: "var(--critical)" }}>*</span></label>
                <input id="c-email" name="email" type="email" autoComplete="email" required placeholder="For example, jane@company.com" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#FFFFFF", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="c-phone" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Phone number</label>
                <div style={{ display: "flex", gap: "8px" }}><span style={{ position: "relative", flex: "0 0 116px" }}><label htmlFor="c-code" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)" }}>Country code</label><select id="c-code" name="phoneCode" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#F3F4F6", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none", appearance: "none", cursor: "pointer", paddingRight: "32px", borderColor: "#F3F4F6" }}><option value="+1">US +1</option><option value="+44">UK +44</option><option value="+61">AU +61</option><option value="+49">DE +49</option><option value="+33">FR +33</option><option value="+91">IN +91</option><option value="+92">PK +92</option><option value="+971">AE +971</option><option value="+966">SA +966</option><option value="+65">SG +65</option></select><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A3D44" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: "absolute", right: "14px", top: "50%", translate: "0 -50%", pointerEvents: "none" }}><path d="m6 9 6 6 6-6"></path></svg></span><input id="c-phone" name="phone" type="tel" autoComplete="tel-national" placeholder="(201) 555-0123" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#FFFFFF", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none" }} /></div>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="c-country" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Country (optional)</label>
                <span style={{ position: "relative", display: "block" }}><select id="c-country" name="country" autoComplete="country-name" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#F3F4F6", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none", appearance: "none", cursor: "pointer", paddingRight: "36px", borderColor: "#F3F4F6" }}><option value="">Please select</option><option>United States</option><option>United Kingdom</option><option>Canada</option><option>Australia</option><option>Germany</option><option>France</option><option>India</option><option>Pakistan</option><option>United Arab Emirates</option><option>Saudi Arabia</option><option>Singapore</option><option>Other</option></select><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A3D44" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: "absolute", right: "14px", top: "50%", translate: "0 -50%", pointerEvents: "none" }}><path d="m6 9 6 6 6-6"></path></svg></span>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="c-message" style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Message<span style={{ color: "var(--critical)" }}>*</span></label>
                <textarea id="c-message" name="message" rows={4} required placeholder="Tell us about your project, goals, timeline, or requirements" style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "2px", background: "#FFFFFF", padding: "12px 14px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)", outline: "none", resize: "vertical" }}></textarea>
              </div>
              {sent ? (<p role="status" style={{ gridColumn: "1 / -1", margin: 0, padding: "14px 16px", background: "var(--blue-tint)", borderRadius: "8px", font: "500 15px/22px var(--font-sans)", color: "var(--ink)" }}>{sent}</p>) : (<button type="submit" disabled={busy} data-cta="primary" style={{ gridColumn: "1 / -1", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink)", color: "#FFFFFF", border: "none", cursor: "pointer", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "18px 24px", borderRadius: "2px" }}>{busy ? "Sending…" : "Submit inquiry"}</button>)}
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
  const subject = `UX audit fixes — ${p.host}`;
  const body = [
    `Name: ${p.firstName ?? ''} ${p.lastName ?? ''}`,
    `Email: ${p.email ?? ''}`,
    p.phone ? `Phone: ${p.phoneCode ?? ''} ${p.phone}` : '',
    p.country ? `Country: ${p.country}` : '',
    '',
    String(p.message ?? ''),
    '',
    `Report: ${p.reportUrl} (score ${p.score ?? 'n/a'}, ${p.findings} issues)`,
  ].join('\n');
  return `mailto:hello@audix.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
