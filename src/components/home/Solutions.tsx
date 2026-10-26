'use client';

/* Ported from design/Main.dc.html — values transcribed by script, not by hand. */

import { Fragment, type MouseEvent } from 'react';

export function Solutions({ onRunAudit }: { onRunAudit: () => void }) {
  const run = (e: MouseEvent) => {
    e.preventDefault();
    onRunAudit();
  };
  return (
    <>
      
      
      {/* who it's for */}
      <section id="solutions" style={{ borderTop: "1px solid var(--border)", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px clamp(16px, 5.56vw, 80px)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "24px 64px" }}>
            <div style={{ flex: "1 1 520px", maxWidth: "680px", minWidth: "0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ font: "600 11px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent-fg)" }}>Who it’s for</span>
              <h2 style={{ margin: "0", font: "800 clamp(32px, 3.3vw, 44px)/1.08 var(--font-sans)", letterSpacing: "-0.03em", textWrap: "pretty" }}>Built for people who care about better experiences</h2>
            </div>
            <p style={{ margin: "0", flex: "0 1 440px", minWidth: "0", font: "400 16px/28px var(--font-sans)", color: "var(--ink-muted)", textWrap: "pretty" }}>Whether you're launching your first product or shipping your fortieth release, Audix gives you the senior-designer second opinion you'd otherwise wait weeks for.</p>
          </div>
      
          <div style={{ marginTop: "48px", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "20px", alignItems: "stretch" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "320px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm2.6 5.6h3a.8.8 0 0 1 .8.8v3a.8.8 0 0 1-1.6 0V10.3l-4.2 4.2a.8.8 0 0 1-1.1 0L9.6 12.6l-3.1 3.1a.8.8 0 1 1-1.1-1.1l3.6-3.7a.8.8 0 0 1 1.1 0l1.9 1.9 3.6-3.6h-1a.8.8 0 0 1 0-1.6Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)", textWrap: "pretty" }}>Founders</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Unblock your growth. Find out why visitors aren't converting before you spend more on ads, and get a fix list you can hand to any developer.</p>
                <a href="/?audit=1" onClick={run} data-cta="secondary" style={{ marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255, 255, 255, 0.18)", color: "var(--ink)", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px", boxShadow: "inset 0 0 0 1px rgba(20, 60, 140, 0.35)", whiteSpace: "nowrap", width: "100%", alignSelf: "stretch" }}>For founders</a>
              </div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "320px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path d="M14.6 2.6a1.5 1.5 0 0 1 2.1 0l4.7 4.7a1.5 1.5 0 0 1 0 2.1l-1.9 1.9-6.8-6.8Z"></path><path d="M11.3 5.9l6.8 6.8-1.6 5.3a1.5 1.5 0 0 1-1 1L4.9 21.6l5.2-5.2a1.8 1.8 0 1 0-1.1-1.1l-5.2 5.2 2.6-10.6a1.5 1.5 0 0 1 1-1Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)", textWrap: "pretty" }}>Designers</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Validate every design decision. Check your work against UX laws and WCAG before review, and bring evidence to stakeholder conversations instead of opinions.</p>
                <a href="/?audit=1" onClick={run} data-cta="secondary" style={{ marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255, 255, 255, 0.18)", color: "var(--ink)", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px", boxShadow: "inset 0 0 0 1px rgba(20, 60, 140, 0.35)", whiteSpace: "nowrap", width: "100%", alignSelf: "stretch" }}>For designers</a>
              </div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "320px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path fillRule="evenodd" d="M9 3.5h6a2 2 0 0 1 2 2V7h2.5A2.5 2.5 0 0 1 22 9.5v3.2l-8.6 2.2a5.5 5.5 0 0 1-2.8 0L2 12.7V9.5A2.5 2.5 0 0 1 4.5 7H7V5.5a2 2 0 0 1 2-2Zm0 2V7h6V5.5Z"></path><path d="M2 14.8l8.1 2.1a7.5 7.5 0 0 0 3.8 0l8.1-2.1v3.7A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)", textWrap: "pretty" }}>Agencies</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Scale client audits. Produce a branded, professional UX audit in minutes for every prospect and every project, and win the retainer with it.</p>
                <a href="/?audit=1" onClick={run} data-cta="secondary" style={{ marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255, 255, 255, 0.18)", color: "var(--ink)", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px", boxShadow: "inset 0 0 0 1px rgba(20, 60, 140, 0.35)", whiteSpace: "nowrap", width: "100%", alignSelf: "stretch" }}>For agencies</a>
              </div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "320px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><circle cx="9" cy="7.5" r="3.5"></circle><path d="M2 19.5A6.5 6.5 0 0 1 8.5 13h1a6.5 6.5 0 0 1 6.5 6.5v.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z"></path><circle cx="17" cy="8.5" r="2.8"></circle><path d="M17.5 13.2a5.5 5.5 0 0 1 4.5 5.4V20a1 1 0 0 1-1 1h-3.3c.2-.3.3-.6.3-1v-.5a7.9 7.9 0 0 0-2.2-5.5c.5-.4 1.1-.6 1.7-.8Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)", textWrap: "pretty" }}>Product teams</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Prioritise UX fixes with confidence. Turn "the site feels off" into a ranked backlog with effort and impact already estimated.</p>
                <a href="/?audit=1" onClick={run} data-cta="secondary" style={{ marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255, 255, 255, 0.18)", color: "var(--ink)", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px", boxShadow: "inset 0 0 0 1px rgba(20, 60, 140, 0.35)", whiteSpace: "nowrap", width: "100%", alignSelf: "stretch" }}>For teams</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
