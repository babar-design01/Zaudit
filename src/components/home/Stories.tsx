'use client';

/* Ported from design/Main.dc.html — values transcribed by script, not by hand. */

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { STORIES } from '@/content/stories';

/** How long each story stays up before the next one, matching the tab's fill. */
const DWELL_MS = 7000;

/**
 * Five logo tabs over one story card. The active tab is white with a progress
 * bar that fills over seven seconds, then the next story shows; a click
 * switches and restarts the clock.
 */
export function Stories(_props: { onRunAudit?: () => void }) {
  const [sc, setSc] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const restart = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer.current = setInterval(() => setSc((c) => (c + 1) % STORIES.length), DWELL_MS);
  }, []);

  useEffect(() => {
    restart();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [restart]);

  const stories = STORIES.map((c, i) => ({
    ...c,
    logoCase: c.logoCase as CSSProperties['textTransform'],
    active: i === sc,
    selected: i === sc,
    tabBg: i === sc ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
    tabColor: i === sc ? 'var(--ink)' : 'var(--ink-secondary)',
    pick: () => {
      setSc(i);
      restart();
    },
  }));

  return (
    <>
      
      
      {/* testimonials: logo tabs over one story card */}
      <section id="stories" style={{ position: "relative", overflow: "hidden", background: "var(--bg-mist)" }}>
        <div aria-hidden="true" style={{ position: "absolute", inset: "0", overflow: "hidden" }}>
          <span data-blob="a" style={{ position: "absolute", left: "-10%", top: "-30%", width: "60%", height: "120%", borderRadius: "50%", background: "#A8F3FF", filter: "blur(90px)", opacity: "0.9" }}></span>
          <span data-blob="b" style={{ position: "absolute", right: "-15%", top: "-20%", width: "55%", height: "90%", borderRadius: "50%", background: "#5E9BFF", filter: "blur(100px)", opacity: "0.85" }}></span>
          <span data-blob="c" style={{ position: "absolute", left: "30%", bottom: "-45%", width: "60%", height: "90%", borderRadius: "50%", background: "#FFFFFF", filter: "blur(90px)", opacity: "0.95" }}></span>
          <span data-blob="d" style={{ position: "absolute", right: "10%", bottom: "-30%", width: "35%", height: "70%", borderRadius: "50%", background: "#7FB2FF", filter: "blur(80px)", opacity: "0.8" }}></span>
        </div>
        <div style={{ position: "relative", maxWidth: "1440px", margin: "0 auto", padding: "96px clamp(16px, 5.56vw, 80px)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "720px", marginBottom: "32px" }}>
            <span style={{ font: "600 11px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent-fg)" }}>Results</span>
            <h2 style={{ margin: "0", font: "800 clamp(32px, 3.3vw, 44px)/1.08 var(--font-sans)", letterSpacing: "-0.03em", color: "var(--ink)", textWrap: "balance" }}>Teams ship better experiences with Audix</h2>
          </div>
          <span style={{ font: "600 12px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-secondary)" }}>Used by product teams at</span>
          <div role="tablist" aria-label="Customer stories" style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {stories.map((c, $index) => (<Fragment key={$index}>
              <button type="button" role="tab" aria-selected={c.selected} onClick={c.pick} style={{ flex: "1 1 160px", position: "relative", overflow: "hidden", height: "84px", border: "none", cursor: "pointer", borderRadius: "4px", background: c.tabBg, display: "flex", alignItems: "center", justifyContent: "center", font: c.logoFont, letterSpacing: c.logoTrack, textTransform: c.logoCase, color: c.tabColor }}>{c.company}
                {c.active && (<>
                  <span data-tab-progress="" style={{ position: "absolute", left: "0", bottom: "0", height: "4px", width: "100%", background: "var(--ink)" }}></span>
                </>)}
              </button>
            </Fragment>))}
          </div>
      
          {stories.map((s, $index) => (<Fragment key={$index}>
            {s.active && (<>
            <figure data-story="" style={{ margin: "0", background: "#FFFFFF", borderRadius: "4px", display: "flex", flexWrap: "wrap", overflow: "hidden" }}>
              {/* the person: a compact panel instead of a large portrait */}
              <div style={{ flex: "0 1 380px", minWidth: "0", background: "var(--blue-tint)", padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "48px" }}>
                <span aria-hidden="true" style={{ font: "800 120px/0.8 var(--font-sans)", color: "var(--blue)" }}>“</span>
                <figcaption style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span aria-hidden="true" style={{ width: "52px", height: "52px", flexShrink: "0", borderRadius: "8px", background: "var(--blue)", color: "#FFFFFF", display: "inline-flex", alignItems: "center", justifyContent: "center", font: "700 17px/1 var(--font-sans)" }}>{s.initials}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ font: "700 14px/20px var(--font-sans)", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink)" }}>{s.name}</span>
                    <span style={{ font: "500 13px/18px var(--font-sans)", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-secondary)" }}>{s.role}, {s.company}</span>
                  </span>
                </figcaption>
              </div>
      
              <div style={{ flex: "999 1 520px", minWidth: "0", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "48px 56px 40px", display: "flex", flexDirection: "column", gap: "28px" }}>
                  <span style={{ font: s.logoFont, letterSpacing: s.logoTrack, textTransform: s.logoCase, color: "var(--ink)" }}>{s.company}</span>
                  <blockquote style={{ margin: "0", font: "500 clamp(19px, 1.8vw, 24px)/1.45 var(--font-sans)", letterSpacing: "-0.02em", color: "var(--ink)", textWrap: "pretty" }}>“{s.quote}”</blockquote>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", padding: "32px 56px", display: "flex", flexWrap: "wrap", gap: "0" }}>
                  <div style={{ paddingRight: "48px", marginRight: "48px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ font: "600 42px/1 var(--font-sans)", letterSpacing: "-0.03em", color: "var(--blue)" }}>{s.stat1}</span>
                    <span style={{ maxWidth: "180px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)" }}>{s.stat1Label}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ font: "600 42px/1 var(--font-sans)", letterSpacing: "-0.03em", color: "var(--blue)" }}>{s.stat2}</span>
                    <span style={{ maxWidth: "180px", font: "400 15px/22px var(--font-sans)", color: "var(--ink)" }}>{s.stat2Label}</span>
                  </div>
                </div>
              </div>
            </figure>
            </>)}
          </Fragment>))}
        </div>
      </section>
    </>
  );
}
