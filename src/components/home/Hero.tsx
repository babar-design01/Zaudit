'use client';

/* Ported from design/Main.dc.html — values transcribed by script, not by hand. */

import { Fragment, type MouseEvent } from 'react';

/**
 * The hero. Items fade up in sequence on load (`data-hero`, in globals.css),
 * and the URL field is the product's real entry point: Enter or the button opens
 * the goal dialog with whatever was typed.
 */
export function Hero({ onRunAudit, url, setUrl }: { onRunAudit: () => void; url: string; setUrl: (v: string) => void }) {
  const run = (e: MouseEvent) => {
    e.preventDefault();
    onRunAudit();
  };
  return (
    <>
      
      
      {/* hero */}
      <section id="hero">
        <div data-hero style={{ maxWidth: "1440px", margin: "0 auto", padding: "96px clamp(16px, 5.56vw, 80px) 104px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", textAlign: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", background: "#E8F0FE", color: "var(--accent-fg)", font: "600 11px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "8px" }}>AI-powered UX audit</span>
      
          <h1 style={{ margin: "0", maxWidth: "820px", font: "800 clamp(46px, 4.8vw, 70px)/1.04 var(--font-sans)", letterSpacing: "-0.035em", textWrap: "pretty" }}>Find what's hurting your user experience</h1>
      
          <p style={{ margin: "0", maxWidth: "560px", font: "400 17px/29px var(--font-sans)", color: "var(--ink-muted)", textWrap: "pretty" }}>Paste a URL. Audix tests your site in a real browser and scores it against 120+ UX laws, design principles and accessibility rules, then tells you exactly which element to fix first and why it matters.</p>
      
          <div style={{ marginTop: "20px", width: "100%", maxWidth: "620px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <label htmlFor="hero-url" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>Enter your website URL</label>
      
            {/* the gradient frame is a 2px padded wrapper, not a border */}
            <div data-urlframe="" style={{ width: "100%", padding: "2px", borderRadius: "2px", background: "linear-gradient(100deg, var(--blue), #5C7CFF 55%, #9E5CFF)", boxShadow: "0 10px 30px rgba(20, 40, 90, 0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFFFFF", borderRadius: "0", padding: "8px 8px 8px 22px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"></path></svg>
                <input id="hero-url" type="text" inputMode="url" autoComplete="url" placeholder="https://yourwebsite.com" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onRunAudit(); }} style={{ flexGrow: "1", minWidth: "0", border: "none", outline: "none", background: "transparent", color: "var(--ink)", font: "400 16px/24px var(--font-sans)" }} />
                <a href="/?audit=1" onClick={run} data-cta="primary" style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", whiteSpace: "nowrap", justifyContent: "center", background: "var(--ink)", color: "#FFFFFF", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px" }}>Run free audit</a>
              </div>
            </div>
      
            <p style={{ margin: "0", font: "400 13px/18px var(--font-sans)", color: "var(--ink-muted)" }}>No sign-up. No credit card. First audit is free.</p>
          </div>
        </div>
      </section>
    </>
  );
}
