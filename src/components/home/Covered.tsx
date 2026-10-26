'use client';

/* Ported from design/Main.dc.html — values transcribed by script, not by hand. */

import { Fragment, type MouseEvent } from 'react';

export function Covered({ onRunAudit }: { onRunAudit: () => void }) {
  const run = (e: MouseEvent) => {
    e.preventDefault();
    onRunAudit();
  };
  return (
    <>
      
      
      {/* what we analyze */}
      <section style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px clamp(16px, 5.56vw, 80px)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "24px 64px" }}>
            <div style={{ flex: "1 1 520px", maxWidth: "680px", minWidth: "0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ font: "600 11px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent-fg)" }}>What's covered</span>
              <h2 style={{ margin: "0", font: "800 clamp(32px, 3.3vw, 44px)/1.08 var(--font-sans)", letterSpacing: "-0.03em", textWrap: "pretty" }}>Your experience is more than how it looks</h2>
            </div>
            <p style={{ margin: "0", flex: "0 1 440px", minWidth: "0", font: "400 16px/28px var(--font-sans)", color: "var(--ink-muted)", textWrap: "pretty" }}>Audix checks six dimensions of your site, each against the principles that research has shown move real behaviour. Every finding tells you which one it belongs to.</p>
          </div>
      
          <div style={{ marginTop: "48px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "20px" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.9 5.2-2 5.6a1.5 1.5 0 0 1-.9.9l-5.6 2a.4.4 0 0 1-.5-.5l2-5.6a1.5 1.5 0 0 1 .9-.9l5.6-2a.4.4 0 0 1 .5.5ZM12 10.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)" }}>Usability</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Can visitors find and finish what they came for? Navigation clarity, form friction, error handling, task flow, Nielsen's 10 heuristics.</p>
              </div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.5 2 2 6.2 2 11.5 2 16.2 5.6 20 10 20h1.4c1.1 0 1.8-1.2 1.3-2.2l-.3-.6c-.5-1 .2-2.2 1.3-2.2H17c2.8 0 5-2.2 5-5C22 5.6 17.5 2 12 2ZM7.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)" }}>UI &amp; visual design</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Does the design guide the eye or fight it? Visual hierarchy, contrast, spacing consistency, typography scale, alignment, affordance of interactive elements.</p>
              </div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3.6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Zm4.6 4.6-3 .6v2.6l1.6 4.2a.9.9 0 0 1-1.7.7L12 14.3l-1.5 3.5a.9.9 0 0 1-1.7-.7l1.6-4.2v-2.6l-3-.6a.85.85 0 0 1 .3-1.7l2.9.5h2.8l2.9-.5a.85.85 0 0 1 .3 1.7Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)" }}>Accessibility</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Can everyone use it, including with a screen reader or keyboard? Colour contrast, focus states, alt text, labels, tap target size, WCAG 2.2 AA.</p>
              </div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path d="M3.5 4h17a1 1 0 0 1 .8 1.6L15 13.5V19a1 1 0 0 1-.6.9l-3 1.4a1 1 0 0 1-1.4-.9v-6.9L2.7 5.6A1 1 0 0 1 3.5 4Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)" }}>Conversion &amp; friction</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>What stands between a visitor and your goal? CTA prominence, trust signals, pricing clarity, form length, distraction, choice overload.</p>
              </div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path d="M12 2a7 7 0 0 0-4.2 12.6c.7.5 1.2 1.3 1.2 2.2V17h6v-.2c0-.9.5-1.7 1.2-2.2A7 7 0 0 0 12 2Z"></path><path d="M9 18.6h6v.9a2.5 2.5 0 0 1-2.5 2.5h-1A2.5 2.5 0 0 1 9 19.5Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)" }}>UX laws &amp; principles</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Does your layout work with human behaviour or against it? Fitts's Law, Hick's Law, Jakob's Law, Miller's Law, Gestalt grouping, progressive disclosure, 40+ more.</p>
              </div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#F3F5F8", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path fillRule="evenodd" d="M8 2h8a2.5 2.5 0 0 1 2.5 2.5v15A2.5 2.5 0 0 1 16 22H8a2.5 2.5 0 0 1-2.5-2.5v-15A2.5 2.5 0 0 1 8 2Zm2.5 16a.9.9 0 0 0 0 1.8h3a.9.9 0 0 0 0-1.8Z"></path></svg>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ margin: "0", font: "700 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)" }}>Mobile experience</h3>
                <p style={{ margin: "0", font: "400 15px/24px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>Does it hold up on a phone? Touch targets, thumb reach, layout shift, sticky elements, viewport bugs, tested at real mobile sizes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
