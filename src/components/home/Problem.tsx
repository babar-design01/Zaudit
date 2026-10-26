'use client';

/* Ported from design/Main.dc.html — values transcribed by script, not by hand. */

import { Fragment, type MouseEvent } from 'react';

export function Problem({ onRunAudit }: { onRunAudit: () => void }) {
  const run = (e: MouseEvent) => {
    e.preventDefault();
    onRunAudit();
  };
  return (
    <>
      
      
      {/* the problem */}
      <section style={{ borderTop: "1px solid var(--border)", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px clamp(16px, 5.56vw, 80px)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "24px 64px" }}>
            <div style={{ flex: "1 1 520px", maxWidth: "680px", minWidth: "0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ font: "600 11px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent-fg)" }}>The problem</span>
              <h2 style={{ margin: "0", font: "800 clamp(32px, 3.3vw, 44px)/1.14 var(--font-sans)", letterSpacing: "-0.03em", textWrap: "pretty" }}>You know something isn't working. Finding out why is the hard part.</h2>
            </div>
            <p style={{ margin: "0", flex: "0 1 440px", minWidth: "0", font: "400 16px/28px var(--font-sans)", color: "var(--ink-muted)", textWrap: "pretty" }}>Analytics tells you where people leave. Heatmaps show where they hover. Neither tells you why the button got ignored, the form got abandoned or the pricing page felt confusing. Until now, the only way to get that answer was a UX consultant and a four-week wait.</p>
          </div>
      
          <div style={{ marginTop: "48px", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "20px" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path d="M4 20h16v1.6H4z"></path><rect x="5" y="12" width="3.4" height="6.4" rx="1"></rect><rect x="10.3" y="7.5" width="3.4" height="10.9" rx="1"></rect><rect x="15.6" y="3.5" width="3.4" height="14.9" rx="1"></rect></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)" }}>Analytics</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Shows you the drop-off, not the reason. A 68% exit rate on checkout tells you something broke. It doesn't tell you it was the greyed-out coupon field.</p>
              </div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path d="M5.2 3.3a.9.9 0 0 1 1.2-.9l13.3 5.6a.9.9 0 0 1-.1 1.7l-5.6 1.6-2.4 5.6a.9.9 0 0 1-1.7-.1Z"></path><path d="m14.6 14.2 1.4-1.4 4.4 4.4a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 1-1.4 0Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)" }}>Behaviour insights</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Heatmaps and session recordings take weeks of traffic to mean anything, and hours to watch. You still have to interpret every rage-click yourself.</p>
              </div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-.1 5.2c-1.6 0-2.8.9-3.1 2.3a.9.9 0 0 0 1.8.4c.1-.6.6-.9 1.3-.9.8 0 1.4.5 1.4 1.2 0 .5-.3.8-1 1.3-.9.6-1.4 1.2-1.4 2.3v.3a.9.9 0 0 0 1.8 0v-.2c0-.4.2-.6.8-1 .9-.6 1.6-1.3 1.6-2.6 0-1.7-1.4-3.1-3.2-3.1Zm.1 8.6a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)" }}>Manual UX review</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Expert, but expensive and slow. Most teams can afford one a year, so the other 11 months ship blind.</p>
              </div>
            </div>
            <div style={{ background: "var(--ink)", borderRadius: "8px", padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path fillRule="evenodd" d="M10.6 2.6a2 2 0 0 1 2.8 0l1.2 1.1 1.6-.2a2 2 0 0 1 2.2 1.7l.3 1.6 1.4.8a2 2 0 0 1 .9 2.6l-.7 1.5.7 1.5a2 2 0 0 1-.9 2.6l-1.4.8-.3 1.6a2 2 0 0 1-2.2 1.7l-1.6-.2-1.2 1.1a2 2 0 0 1-2.8 0l-1.2-1.1-1.6.2a2 2 0 0 1-2.2-1.7l-.3-1.6-1.4-.8a2 2 0 0 1-.9-2.6l.7-1.5-.7-1.5a2 2 0 0 1 .9-2.6l1.4-.8.3-1.6a2 2 0 0 1 2.2-1.7l1.6.2Zm4.9 7.1a.9.9 0 0 0-1.3-1.3l-3.3 3.4-1.5-1.5a.9.9 0 1 0-1.3 1.3l2.1 2.1a.9.9 0 0 0 1.3 0Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "#FFFFFF" }}>Audix UX audit</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "#C9CDD4", textWrap: "pretty" }}>Reads your live site like a senior designer would, scores every page against proven UX laws and accessibility standards, and hands you a ranked fix list in about a minute. Every release, not once a year.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
