'use client';

/* Ported from design/Main.dc.html — values transcribed by script, not by hand. */

import { Fragment, useState, type MouseEvent } from 'react';
import { FAQS } from '@/content/faqs';

export function Faq({ onRunAudit }: { onRunAudit: () => void }) {
  const run = (e: MouseEvent) => {
    e.preventDefault();
    onRunAudit();
  };
  // One open at a time, the first by default; a second click closes it.
  const [open, setOpen] = useState(0);
  const faqs = FAQS.map((f, i) => ({
    ...f,
    open: i === open,
    expanded: i === open,
    rot: i === open ? '45deg' : '0deg',
    toggle: () => setOpen(i === open ? -1 : i),
  }));
  return (
    <>
      
      
      {/* faq */}
      <section id="faq" style={{ borderTop: "1px solid var(--border)", background: "#F3F3F3" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px clamp(16px, 5.56vw, 80px)", display: "grid", gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.15fr)", gap: "56px", alignItems: "start" }}>
          <div style={{ position: "sticky", top: "96px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "24px" }}>
            <span style={{ font: "500 14px/20px var(--font-sans)", color: "var(--ink-muted)", letterSpacing: "0.04em" }}>FAQ</span>
            <h2 style={{ margin: "0", font: "800 clamp(32px, 3.1vw, 42px)/1.12 var(--font-sans)", letterSpacing: "-0.03em", textWrap: "pretty" }}>Everything you need to know before your first audit</h2>
      
            <div style={{ background: "var(--blue)", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "18px", color: "#FFFFFF", width: "100%" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <span style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.16)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"></path></svg>
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "0" }}>
                  <span style={{ font: "700 16px/22px var(--font-sans)", letterSpacing: "-0.015em" }}>Still have questions?</span>
                  <span style={{ font: "400 13px/19px var(--font-sans)", color: "rgba(255, 255, 255, 0.82)" }}>Run a free audit and see the answers in your own report, or email us and a real person will reply within a day.</span>
                </span>
              </div>
              <a href="/?audit=1" onClick={run} data-cta="primary" style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", justifyContent: "center", background: "#FFFFFF", color: "var(--ink)", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px" }}>Run free audit</a>
            </div>
          </div>
      
          <div data-faq="" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {faqs.map((f, $index) => (<Fragment key={$index}>
              <div style={{ background: "#FFFFFF", borderRadius: "8px", overflow: "hidden" }}>
                <button type="button" onClick={f.toggle} aria-expanded={f.expanded} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: "22px 24px 22px 32px", color: "var(--ink)" }}>
                  <span style={{ font: "500 18px/26px var(--font-sans)", letterSpacing: "-0.015em" }}>{f.q}</span>
                  <span aria-hidden="true" style={{ width: "34px", height: "34px", flexShrink: "0", border: "1px solid #DCDDE0", borderRadius: "8px", background: "#FFFFFF", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <svg data-faq-icon="" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16181D" strokeWidth="2" strokeLinecap="round" style={{ transform: `rotate(${f.rot})` }}><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                  </span>
                </button>
                {f.open && (<>
                  <p data-faq-a="" style={{ margin: "0", padding: "0 96px 28px 32px", font: "400 16px/27px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>{f.a}</p>
                </>)}
              </div>
            </Fragment>))}
          </div>
        </div>
      </section>
    </>
  );
}
