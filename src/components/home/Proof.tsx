'use client';

/* Ported from design/Main.dc.html — values transcribed by script, not by hand. */

import { Fragment, type MouseEvent } from 'react';

export function Proof({ onRunAudit }: { onRunAudit: () => void }) {
  const run = (e: MouseEvent) => {
    e.preventDefault();
    onRunAudit();
  };
  return (
    <>
      
      
      {/* what a finding looks like */}
      <section id="proof" style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px clamp(16px, 5.56vw, 80px)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "24px 64px" }}>
            <div style={{ flex: "1 1 520px", maxWidth: "680px", minWidth: "0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ font: "600 11px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent-fg)" }}>What you get</span>
              <h2 style={{ margin: "0", font: "800 clamp(32px, 3.3vw, 44px)/1.08 var(--font-sans)", letterSpacing: "-0.03em", textWrap: "pretty" }}>See exactly what's getting in the way</h2>
            </div>
            <p style={{ margin: "0", flex: "0 1 440px", minWidth: "0", font: "400 16px/28px var(--font-sans)", color: "var(--ink-muted)", textWrap: "pretty" }}>Every finding names the element, the UX principle it breaks, the people it affects and the fix. No vague "improve your hierarchy" advice, just a list you can hand to a developer today.</p>
          </div>
      
          <div style={{ marginTop: "48px", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", background: "#FFFFFF", boxShadow: "0 8px 24px rgba(20, 40, 90, 0.07)" }}>
            {/* finding header */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-muted)" }}>Finding #014</span>
                <span style={{ font: "700 20px/26px var(--font-sans)", letterSpacing: "-0.4px", textWrap: "pretty" }}>Primary CTA lacks clear visual prominence</span>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "var(--critical)", color: "#FFFFFF", font: "600 12px/16px var(--font-sans)", padding: "4px 10px", borderRadius: "4px" }}>High impact</span>
                  <span style={{ font: "500 12px/16px var(--font-sans)", color: "var(--ink-secondary)", padding: "4px 10px", borderRadius: "4px", boxShadow: "inset 0 0 0 1px var(--border)" }}>Conversion</span>
                  <span style={{ font: "500 12px/16px var(--font-sans)", color: "var(--ink-secondary)", padding: "4px 10px", borderRadius: "4px", boxShadow: "inset 0 0 0 1px var(--border)" }}>Fitts's Law</span>
                  <span style={{ font: "500 12px/16px var(--font-sans)", color: "var(--ink-secondary)", padding: "4px 10px", borderRadius: "4px", boxShadow: "inset 0 0 0 1px var(--border)" }}>Visual hierarchy</span>
                </div>
              </div>
            </div>
      
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)" }}>
              {/* annotated capture */}
              <div style={{ background: "#FFFFFF", borderRight: "1px solid var(--border)", padding: "24px" }}>
                <div role="img" aria-label="Audix UX audit report showing a high-impact finding on a primary call-to-action button" style={{ position: "relative", height: "520px", border: "1px dashed var(--border-strong)", borderRadius: "8px", background: "#F3F3F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ font: "400 13px/18px var(--font-sans)", color: "var(--ink-muted)" }}>Drop the annotated page capture</span>
                  <span style={{ position: "absolute", left: "20px", bottom: "20px", width: "26px", height: "26px", borderRadius: "8px", background: "var(--critical)", color: "#FFFFFF", font: "500 13px/26px var(--font-sans)", textAlign: "center" }}>1</span>
                </div>
              </div>
      
              {/* reasoning */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ font: "500 12px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-muted)" }}>What’s happening?</span>
                  <p style={{ margin: "0", font: "400 14px/22px var(--font-sans)", textWrap: "pretty" }}>The "Start free trial" button shares the same weight, colour and size as the secondary "Learn more" link. First-time visitors have no single obvious next step.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ font: "500 12px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-muted)" }}>Why it matters</span>
                  <p style={{ margin: "0", font: "400 14px/22px var(--font-sans)", textWrap: "pretty" }}>Hick's Law: when two actions look equally important, decision time rises and more visitors leave without choosing either.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ font: "500 12px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-muted)" }}>What to change</span>
                  <p style={{ margin: "0", font: "400 14px/22px var(--font-sans)", textWrap: "pretty" }}>Give the primary button a filled, high-contrast style and 24px of clear space around it. Reduce "Learn more" to a text link.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ font: "500 12px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-muted)" }}>Evidence</span>
                  <p style={{ margin: "0", font: "400 14px/22px var(--font-sans)", textWrap: "pretty" }}>Screenshot with the element highlighted · Element: button.hero-cta · Found on 3 pages</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 24px", background: "#F3F3F3", flexGrow: "1" }}>
                  <a href="/report/sample" data-cta="primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--ink)", color: "#FFFFFF", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px" }}>Explore a sample report</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
