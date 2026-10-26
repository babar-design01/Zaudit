'use client';

/* Ported from design/Main.dc.html — values transcribed by script, not by hand. */

import { Fragment, type MouseEvent } from 'react';

export function Pricing({ onRunAudit }: { onRunAudit: () => void }) {
  const run = (e: MouseEvent) => {
    e.preventDefault();
    onRunAudit();
  };
  return (
    <>
      
      
      {/* pricing */}
      <section id="plans" style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px clamp(16px, 5.56vw, 80px)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "24px 64px" }}>
            <div style={{ flex: "1 1 520px", maxWidth: "680px", minWidth: "0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ font: "600 11px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent-fg)" }}>Pricing</span>
              <h2 style={{ margin: "0", font: "800 clamp(32px, 3.3vw, 44px)/1.08 var(--font-sans)", letterSpacing: "-0.03em", textWrap: "pretty" }}>Start free. Go deeper when you need to.</h2>
            </div>
            <p style={{ margin: "0", flex: "0 1 440px", minWidth: "0", font: "400 16px/28px var(--font-sans)", color: "var(--ink-muted)", textWrap: "pretty" }}>Your first audit costs nothing and shows everything. Upgrade when you want to track every release, audit more sites, or share with your team.</p>
          </div>
      
          <div style={{ marginTop: "48px", background: "#EEF1F7", border: "1px solid #E3E7EF", borderRadius: "8px", padding: "8px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "stretch" }}>
            <div style={{ flex: "1 1 280px", minWidth: "0", padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#FFFFFF", boxShadow: "0 1px 2px rgba(22, 24, 29, 0.06), inset 0 0 0 1px var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path d="M12 2.5l2.2 6.2 6.3 2.3-6.3 2.3L12 19.5l-2.2-6.2L3.5 11l6.3-2.3Z"></path><path d="M19 15.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9Z"></path></svg></span>
                <span style={{ font: "600 18px/24px var(--font-sans)", letterSpacing: "-0.015em" }}>Free</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ font: "600 44px/1 var(--font-sans)", letterSpacing: "-0.04em", color: "var(--ink)" }}>$0</span>
                  
                </div>
                <p style={{ margin: "0", font: "400 14px/22px var(--font-sans)", color: "var(--ink-muted)", textWrap: "pretty" }}>Try it on one site</p>
              </div>
              <ul style={{ margin: "0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>1 audit per month</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>1 website</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>Top 10 findings</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>Goal scoring</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>PDF sample report</li>
              </ul>
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                <a href="/?audit=1" onClick={run} data-cta="primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink)", color: "#FFFFFF", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px" }}>Get started free</a>
                <span style={{ textAlign: "center", font: "400 12px/16px var(--font-sans)", color: "var(--ink-muted)" }}>No card required</span>
              </div>
            </div>
            <div style={{ flex: "2 1 580px", minWidth: "0", background: "#FFFFFF", borderRadius: "8px", boxShadow: "0 1px 2px rgba(22, 24, 29, 0.04), 0 18px 40px rgba(20, 40, 90, 0.08)", display: "flex", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 280px", minWidth: "0", padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#FFFFFF", boxShadow: "0 1px 2px rgba(22, 24, 29, 0.06), inset 0 0 0 1px var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path d="M7 3h10l4.5 6L12 21 2.5 9Z"></path></svg></span>
                <span style={{ font: "600 18px/24px var(--font-sans)", letterSpacing: "-0.015em" }}>Standard</span><span style={{ marginLeft: "auto", background: "#E8F0FE", color: "var(--accent-fg)", font: "600 11px/16px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "4px" }}>Most popular</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ font: "600 44px/1 var(--font-sans)", letterSpacing: "-0.04em", color: "var(--ink)" }}>$10</span>
                  <span style={{ font: "500 14px/20px var(--font-sans)", color: "var(--ink-secondary)" }}>/ month</span>
                </div>
                <p style={{ margin: "0", font: "400 14px/22px var(--font-sans)", color: "var(--ink-muted)", textWrap: "pretty" }}>For founders and designers shipping regularly</p>
              </div>
              <ul style={{ margin: "0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>Unlimited audits</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>3 websites</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>All findings with fixes</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>Release-to-release comparison</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>Full PDF export</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>Priority support</li>
              </ul>
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                <a href="/?audit=1" onClick={run} data-cta="secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255, 255, 255, 0.18)", color: "var(--ink)", boxShadow: "inset 0 0 0 1px rgba(20, 60, 140, 0.35)", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px" }}>Buy your first credits</a>
                <span style={{ textAlign: "center", font: "400 12px/16px var(--font-sans)", color: "var(--ink-muted)" }}>Cancel anytime</span>
              </div>
            </div>
            <div style={{ flex: "1 1 280px", minWidth: "0", padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#FFFFFF", boxShadow: "0 1px 2px rgba(22, 24, 29, 0.06), inset 0 0 0 1px var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#16181D" aria-hidden="true"><path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.6 2.2a14 14 0 0 0-2.3 6.8H4.1a8 8 0 0 1 6.3-6.8Zm3.2 0a8 8 0 0 1 6.3 6.8h-4a14 14 0 0 0-2.3-6.8ZM12 4.5a12 12 0 0 1 2 6.5h-4a12 12 0 0 1 2-6.5ZM4.1 13h4a14 14 0 0 0 2.3 6.8A8 8 0 0 1 4.1 13Zm5.9 0h4a12 12 0 0 1-2 6.5 12 12 0 0 1-2-6.5Zm6 0h4a8 8 0 0 1-6.3 6.8A14 14 0 0 0 16 13Z"></path></svg></span>
                <span style={{ font: "600 18px/24px var(--font-sans)", letterSpacing: "-0.015em" }}>Ultimate</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ font: "600 44px/1 var(--font-sans)", letterSpacing: "-0.04em", color: "var(--ink)" }}>$30</span>
                  <span style={{ font: "500 14px/20px var(--font-sans)", color: "var(--ink-secondary)" }}>/ month</span>
                </div>
                <p style={{ margin: "0", font: "400 14px/22px var(--font-sans)", color: "var(--ink-muted)", textWrap: "pretty" }}>For agencies and teams auditing many sites</p>
              </div>
              <ul style={{ margin: "0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>Everything in Standard</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>Unlimited websites</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>White-label reports</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>Team seats</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>API and CSV export</li>
                <li style={{ display: "flex", gap: "12px", alignItems: "flex-start", font: "400 14px/22px var(--font-sans)", color: "var(--ink)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", marginTop: "6px", flexShrink: "0", borderRadius: "3px", background: "#B9CDF0", boxShadow: "0 0 0 3px #E3ECFB" }}></span>Dedicated support</li>
              </ul>
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                <a href="/?audit=1" onClick={run} data-cta="secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255, 255, 255, 0.18)", color: "var(--ink)", boxShadow: "inset 0 0 0 1px rgba(20, 60, 140, 0.35)", font: "600 14px/20px var(--font-sans)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 24px", borderRadius: "2px" }}>Buy your first credits</a>
                <span style={{ textAlign: "center", font: "400 12px/16px var(--font-sans)", color: "var(--ink-muted)" }}>Cancel anytime</span>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
