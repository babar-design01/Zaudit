'use client';

/* Ported from design/Main.dc.html — values transcribed by script, not by hand. */

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const STEPS = [
  {
    title: 'Enter your website',
    body: 'Paste any public URL. Audix loads it in a real browser, at desktop and mobile sizes, the way your visitors see it.',
  },
  {
    title: 'We analyse the experience',
    body: "Every page is checked against 120+ UX laws, Nielsen's heuristics, visual design principles and WCAG 2.2 accessibility rules.",
  },
  {
    title: "See what's getting in the way",
    body: 'Findings are ranked by impact on your goal, each tied to the exact element, with a screenshot, the principle it breaks and a plain-English fix.',
  },
  {
    title: 'Know what to work on next',
    body: 'Share the report with your team, export the fix list, and re-run after every release to confirm the score moved.',
  },
];

/** Where the pinned row sits under the nav, matching `top: 96px` below. */
const PIN_TOP = 96;

/**
 * Scroll-driven: a 2100px track whose inner row is sticky, so the page scrolls
 * through the four steps while the row stays put. Before the reader scrolls at
 * all, the steps rotate on a five-second timer; clicking a step scrolls to it.
 */
export function HowItWorks(_props: { onRunAudit?: () => void }) {
  const [cur, setCur] = useState(0);
  const scrolled = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const auto = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (scrolled.current) return;
    timer.current = setInterval(() => setCur((c) => (c + 1) % STEPS.length), 5000);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) auto();

    const onScroll = () => {
      const track = document.getElementById('how-track');
      if (!track) return;
      if (!scrolled.current && window.scrollY > 0) {
        scrolled.current = true;
        if (timer.current) clearInterval(timer.current);
      }
      if (!scrolled.current) return;
      const r = track.getBoundingClientRect();
      const pinned = (track.firstElementChild as HTMLElement | null)?.offsetHeight ?? 560;
      const p = Math.min(1, Math.max(0, (PIN_TOP - r.top) / Math.max(1, r.height - pinned)));
      setCur(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer.current) clearInterval(timer.current);
    };
  }, [auto]);

  const goTo = (i: number) => {
    const track = document.getElementById('how-track');
    if (scrolled.current && track) {
      const pinned = (track.firstElementChild as HTMLElement | null)?.offsetHeight ?? 560;
      const span = track.offsetHeight - pinned;
      const top = track.getBoundingClientRect().top + window.scrollY - PIN_TOP;
      window.scrollTo({ top: top + (span * (i + 0.5)) / STEPS.length, behavior: 'smooth' });
    } else {
      setCur(i);
      auto();
    }
  };

  const steps = STEPS.map((st, i) => {
    const on = i === cur;
    return {
      ...st,
      num: '0' + (i + 1),
      active: on,
      pressed: on,
      bg: on ? '#FFFFFF' : 'transparent',
      shadow: on ? '0 24px 60px rgba(22, 24, 29, 0.08), 0 2px 6px rgba(22, 24, 29, 0.04)' : 'none',
      titleColor: on ? 'var(--ink)' : 'var(--ink-secondary)',
      pick: () => goTo(i),
    };
  });
  const [s1, s2, s3, s4] = [cur === 0, cur === 1, cur === 2, cur === 3];

  return (
    <>
      
      
      {/* how it works */}
      <section id="how" style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px clamp(16px, 5.56vw, 80px)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "24px 64px" }}>
            <div style={{ flex: "1 1 520px", maxWidth: "680px", minWidth: "0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ font: "600 11px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent-fg)" }}>How it works</span>
              <h2 style={{ margin: "0", font: "800 clamp(32px, 3.3vw, 44px)/1.08 var(--font-sans)", letterSpacing: "-0.03em", textWrap: "pretty" }}>From one URL to a fix list in four steps</h2>
            </div>
            <p style={{ margin: "0", flex: "0 1 440px", minWidth: "0", font: "400 16px/28px var(--font-sans)", color: "var(--ink-muted)", textWrap: "pretty" }}>No tracking script, no code snippet, no onboarding call. Enter your website and Audix does the rest.</p>
          </div>
      
          {/* the scroll track: the row below stays pinned while the page scrolls through it, one step per stretch */}
          <div id="how-track" style={{ marginTop: "56px", position: "relative", height: "2100px" }}>
          <div style={{ position: "sticky", top: "96px", display: "flex", flexWrap: "wrap", gap: "48px", alignItems: "flex-start" }}>
            {/* the steps */}
            <div data-steps="" style={{ flex: "1 1 440px", minWidth: "0", display: "flex", flexDirection: "column", gap: "4px" }}>
              {steps.map((st, $index) => (<Fragment key={$index}>
                <button type="button" onClick={st.pick} aria-pressed={st.pressed} style={{ display: "block", width: "100%", textAlign: "left", border: "none", cursor: "pointer", color: "var(--ink)", padding: "24px", borderRadius: "8px", background: st.bg, boxShadow: st.shadow }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                    <span style={{ font: "600 20px/28px var(--font-sans)", letterSpacing: "-0.02em", color: st.titleColor }}>{st.title}</span>
                    <span style={{ font: "500 12px/16px var(--font-sans)", color: "var(--ink)" }}>{st.num}</span>
                  </span>
                  {st.active && (<>
                    <span data-step-body="" style={{ display: "block", marginTop: "16px", font: "400 15px/26px var(--font-sans)", color: "var(--ink-secondary)", textWrap: "pretty" }}>{st.body}</span>
                  </>)}
                </button>
              </Fragment>))}
            </div>
      
            {/* the visual for the active step */}
            <div role="img" aria-label="Audix running a website UX audit from a single URL and listing ranked findings" style={{ flex: "999 1 560px", minWidth: "0", position: "relative", height: "560px", borderRadius: "8px", overflow: "hidden", background: "radial-gradient(circle at 64% 42%, rgba(232, 244, 255, 0.95) 0%, rgba(170, 206, 245, 0.7) 30%, rgba(120, 165, 225, 0) 60%), linear-gradient(135deg, #1B4F8F 0%, #5D93D0 48%, #CFE2F5 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
              <div data-orb="" aria-hidden="true" style={{ position: "absolute", right: "-80px", top: "-60px", width: "420px", height: "420px", borderRadius: "8px", background: "radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0) 60%)" }}></div>
      
              {s1 && (<>
                <div data-panel="" style={{ position: "relative", width: "100%", maxWidth: "420px", background: "#FFFFFF", borderRadius: "8px", boxShadow: "0 30px 70px rgba(14, 40, 80, 0.25)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ font: "700 14px/20px var(--font-sans)" }}>New audit</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", font: "500 11px/16px var(--font-sans)", color: "var(--accent-fg)" }}><span data-live="" style={{ width: "7px", height: "7px", borderRadius: "8px", background: "var(--blue)" }}></span>Ready</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ font: "500 11px/16px var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-muted)" }}>Website address</span>
                    <span style={{ display: "flex", alignItems: "center", border: "1px solid var(--blue)", borderRadius: "8px", padding: "12px 14px", font: "500 14px/20px var(--font-sans)", color: "var(--ink)" }}>https://example.com<span data-caret="" style={{ width: "1px", height: "18px", marginLeft: "2px", background: "var(--ink)" }}></span></span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ font: "500 11px/16px var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-muted)" }}>Goal</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      <span style={{ background: "var(--blue-tint)", border: "1px solid var(--blue)", color: "var(--accent-fg)", font: "600 12px/16px var(--font-sans)", padding: "6px 10px", borderRadius: "8px" }}>General health check</span>
                      <span style={{ border: "1px solid var(--border)", color: "var(--ink-muted)", font: "600 12px/16px var(--font-sans)", padding: "6px 10px", borderRadius: "8px" }}>Accessibility</span>
                      <span style={{ border: "1px solid var(--border)", color: "var(--ink-muted)", font: "600 12px/16px var(--font-sans)", padding: "6px 10px", borderRadius: "8px" }}>Conversion</span>
                    </div>
                  </div>
                  <span style={{ alignSelf: "flex-start", background: "var(--blue)", color: "#FFFFFF", font: "600 13px/18px var(--font-sans)", padding: "10px 16px", borderRadius: "8px" }}>Run the audit</span>
                </div>
              </>)}
      
              {s2 && (<>
                <div data-panel="" style={{ position: "relative", width: "100%", maxWidth: "420px", background: "#FFFFFF", borderRadius: "8px", boxShadow: "0 30px 70px rgba(14, 40, 80, 0.25)", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ font: "700 14px/20px var(--font-sans)" }}>Auditing example.com…</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", font: "500 11px/16px var(--font-sans)", color: "var(--accent-fg)" }}><span data-live="" style={{ width: "7px", height: "7px", borderRadius: "8px", background: "var(--blue)" }}></span>Live</span>
                  </div>
                  <div style={{ height: "6px", background: "#EEF0F3", borderRadius: "8px", overflow: "hidden" }}><span data-fill="" style={{ display: "block", width: "58%", height: "100%", borderRadius: "8px", background: "var(--blue)" }}></span></div>
                  <div style={{ height: "1px", background: "#EEF0F3" }}></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--blue)", boxShadow: "inset 0 0 0 0px var(--border-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"></path></svg></span><span style={{ font: "500 13px/18px var(--font-sans)", color: "var(--ink)" }}>Loading pages</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--blue)", boxShadow: "inset 0 0 0 0px var(--border-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"></path></svg></span><span style={{ font: "500 13px/18px var(--font-sans)", color: "var(--ink)" }}>Checking usability</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#FFFFFF", boxShadow: "inset 0 0 0 2px var(--border-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}></span><span style={{ font: "500 13px/18px var(--font-sans)", color: "var(--ink)" }}>Checking accessibility</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#FFFFFF", boxShadow: "inset 0 0 0 2px var(--border-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}></span><span style={{ font: "500 13px/18px var(--font-sans)", color: "var(--ink-muted)" }}>Scoring findings</span></div>
                  </div>
                  <span style={{ alignSelf: "flex-start", background: "var(--blue-tint)", color: "var(--accent-fg)", font: "600 12px/16px var(--font-sans)", padding: "5px 10px", borderRadius: "4px" }}>24 findings · 6 high impact</span>
                </div>
              </>)}
      
              {s3 && (<>
                <div data-panel="" style={{ position: "relative", width: "100%", maxWidth: "440px", background: "#FFFFFF", borderRadius: "8px", boxShadow: "0 30px 70px rgba(14, 40, 80, 0.25)", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ background: "var(--major)", color: "#FFFFFF", font: "600 10px/14px var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px", borderRadius: "4px" }}>S2 · Major</span>
                    <span style={{ font: "500 11px/16px var(--font-sans)", color: "var(--ink-muted)" }}>Finding 01 / 05 · IA-01</span>
                  </div>
                  <span style={{ font: "700 18px/24px var(--font-sans)", letterSpacing: "-0.02em" }}>No navigation region on the page</span>
                  <div style={{ position: "relative", height: "150px", background: "#F5F6F8", border: "1px solid #EEF0F3", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ font: "500 11px/16px var(--font-sans)", color: "var(--ink-muted)" }}>[ ANNOTATED CROP ]</span>
                    <span style={{ position: "absolute", left: "24%", top: "36%", width: "48%", height: "38px", border: "2px dashed var(--critical)", borderRadius: "6px" }}></span>
                    <span style={{ position: "absolute", left: "15%", top: "29%", width: "24px", height: "24px", borderRadius: "8px", background: "var(--critical)", color: "#FFFFFF", font: "600 11px/24px var(--font-sans)", textAlign: "center" }}>1</span>
                  </div>
                  <div style={{ background: "var(--blue-tint)", borderRadius: "8px", padding: "12px 14px" }}>
                    <span style={{ font: "500 11px/16px var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-fg)" }}>Solution</span>
                    <p style={{ margin: "6px 0 0", font: "500 13px/20px var(--font-sans)", color: "var(--ink)" }}>Wrap the primary destinations in &lt;nav aria-label="Main"&gt;.</p>
                  </div>
                </div>
              </>)}
      
              {s4 && (<>
                <div data-panel="" style={{ position: "relative", width: "100%", maxWidth: "440px", background: "#FFFFFF", borderRadius: "8px", boxShadow: "0 30px 70px rgba(14, 40, 80, 0.25)", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ font: "700 14px/20px var(--font-sans)" }}>What to fix next</span>
                    <span style={{ font: "800 20px/24px var(--font-sans)", letterSpacing: "-0.03em" }}>84<span style={{ font: "600 12px/16px var(--font-sans)", color: "var(--ink-muted)" }}>/100</span></span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div data-row="" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 0", borderBottom: "1px solid #EEF0F3" }}>
                      <span style={{ width: "28px", font: "500 11px/16px var(--font-sans)", color: "var(--ink-muted)" }}>01</span>
                      <span style={{ flexGrow: "1", font: "600 13px/18px var(--font-sans)" }}>No navigation region on the page</span>
                      <span style={{ font: "500 11px/16px var(--font-sans)", color: "var(--ink-muted)" }}>small · major</span>
                    </div>
                    <div data-row="" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 0", borderBottom: "1px solid #EEF0F3" }}>
                      <span style={{ width: "28px", font: "500 11px/16px var(--font-sans)", color: "var(--ink-muted)" }}>02</span>
                      <span style={{ flexGrow: "1", font: "600 13px/18px var(--font-sans)" }}>Missing or duplicate h1</span>
                      <span style={{ font: "500 11px/16px var(--font-sans)", color: "var(--ink-muted)" }}>trivial · minor</span>
                    </div>
                    <div data-row="" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 0", borderBottom: "1px solid #EEF0F3" }}>
                      <span style={{ width: "28px", font: "500 11px/16px var(--font-sans)", color: "var(--ink-muted)" }}>03</span>
                      <span style={{ flexGrow: "1", font: "600 13px/18px var(--font-sans)" }}>Landmark regions missing</span>
                      <span style={{ font: "500 11px/16px var(--font-sans)", color: "var(--ink-muted)" }}>trivial · minor</span>
                    </div>
                    <div data-row="" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 0" }}>
                      <span style={{ width: "28px", font: "500 11px/16px var(--font-sans)", color: "var(--ink-muted)" }}>04</span>
                      <span style={{ flexGrow: "1", font: "600 13px/18px var(--font-sans)" }}>Page describes itself poorly to search and social</span>
                      <span style={{ font: "500 11px/16px var(--font-sans)", color: "var(--ink-muted)" }}>trivial · minor</span>
                    </div>
                  </div>
                  <span style={{ alignSelf: "flex-start", border: "1px solid var(--border)", color: "var(--ink)", font: "600 13px/18px var(--font-sans)", padding: "9px 14px", borderRadius: "8px" }}>Re-audit after the release</span>
                </div>
              </>)}
            </div>
          </div>
          </div>
        </div>
      </section>
    </>
  );
}
