'use client';

/* Ported from design/Main.dc.html — values transcribed by script, not by hand. */

import { Fragment, type MouseEvent } from 'react';

export function ClosingCta({ onRunAudit }: { onRunAudit: () => void }) {
  const run = (e: MouseEvent) => {
    e.preventDefault();
    onRunAudit();
  };
  return (
    <>
      
      
      {/* closing cta: a soft moving colour field behind one statement */}
      <section id="cta" style={{ position: "relative", overflow: "hidden", background: "var(--bg-mist)" }}>
        <div aria-hidden="true" style={{ position: "absolute", inset: "0", overflow: "hidden" }}>
          <span data-blob="a" style={{ position: "absolute", left: "-10%", top: "-30%", width: "60%", height: "120%", borderRadius: "50%", background: "#A8F3FF", filter: "blur(90px)", opacity: "0.9" }}></span>
          <span data-blob="b" style={{ position: "absolute", right: "-15%", top: "-20%", width: "55%", height: "90%", borderRadius: "50%", background: "#5E9BFF", filter: "blur(100px)", opacity: "0.85" }}></span>
          <span data-blob="c" style={{ position: "absolute", left: "30%", bottom: "-45%", width: "60%", height: "90%", borderRadius: "50%", background: "#FFFFFF", filter: "blur(90px)", opacity: "0.95" }}></span>
          <span data-blob="d" style={{ position: "absolute", right: "10%", bottom: "-30%", width: "35%", height: "70%", borderRadius: "50%", background: "#7FB2FF", filter: "blur(80px)", opacity: "0.8" }}></span>
        </div>
        <div style={{ position: "relative", maxWidth: "1440px", margin: "0 auto", padding: "160px clamp(16px, 5.56vw, 80px)", display: "flex", flexDirection: "column", alignItems: "center", gap: "28px", textAlign: "center" }}>
          <h2 style={{ margin: "0", font: "500 clamp(44px, 5vw, 72px)/1.1 var(--font-sans)", letterSpacing: "-0.035em", color: "var(--ink)", textWrap: "balance" }}>Paste one URL.<br />Get findings in 60 seconds.</h2>
          <p style={{ margin: "0", font: "400 18px/30px var(--font-sans)", color: "var(--ink-secondary)" }}>Your first audit is free. See exactly what's holding your site back before your next release.</p>
          <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
            <a href="/?audit=1" onClick={run} data-cta="primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--ink)", color: "#FFFFFF", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px" }}>Run free audit</a>
            <a href="/report/sample" data-cta="secondary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(255, 255, 255, 0.18)", color: "var(--ink)", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px", boxShadow: "inset 0 0 0 1px rgba(20, 60, 140, 0.35)" }}>View sample report</a>
          </div>
          <p style={{ margin: "0", font: "400 13px/18px var(--font-sans)", color: "var(--ink-secondary)" }}>No credit card · No install · Cancel anytime</p>
        </div>
      </section>
    </>
  );
}
