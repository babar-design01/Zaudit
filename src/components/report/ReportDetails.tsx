'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { AuditResult, Finding, Takeaways } from '@/lib/audit/types';
import { color, layout, radius, t, tracking } from '@/design/tokens';

/**
 * What sits between the cover and the issue slides: the auditor's four-way
 * read of the page, then the fix order — the top fixes in the order the
 * slides run, each linking to its slide.
 *
 * TODO(design): neither section is drawn in the handoff.
 */

const frame: CSSProperties = { maxWidth: layout.frame, margin: '0 auto', padding: `80px ${layout.gutter}` };

const SEV_NAME: Record<number, string> = { 4: 'Critical', 3: 'Major', 2: 'Minor', 1: 'Cosmetic', 0: 'Cosmetic' };
const SEV_TONE: Record<number, string> = { 4: 'var(--critical)', 3: 'var(--major)', 2: 'var(--blue)', 1: 'var(--ink-muted)', 0: 'var(--ink-muted)' };
const EFFORT: Record<string, string> = { trivial: 'Minutes', small: 'Under an hour', medium: 'A few hours', large: 'A day or more' };

function Intro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px 64px' }}>
      <div style={{ flex: '1 1 520px', maxWidth: 680, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ font: t(600, 11, 16), letterSpacing: tracking.eyebrow, textTransform: 'uppercase', color: color.accentFg }}>{eyebrow}</span>
        <h2 style={{ margin: 0, font: t(800, 'clamp(32px, 3.3vw, 44px)', 1.08), letterSpacing: tracking.tight, color: color.ink }}>{title}</h2>
      </div>
      {children && <p style={{ margin: 0, flex: '0 1 440px', minWidth: 0, font: t(400, 16, 28), color: color.inkMuted }}>{children}</p>}
    </div>
  );
}

/* ------------------------------------------------------------ takeaways */

// The swatch is decoration beside a written heading, so the green needs no
// token of its own.
const BUCKETS: { key: keyof Takeaways; name: string; tone: string }[] = [
  { key: 'good', name: 'Good', tone: '#15803D' },
  { key: 'improve', name: 'Needs improvement', tone: 'var(--blue)' },
  { key: 'fix', name: 'Needs to be fixed', tone: 'var(--major)' },
  { key: 'ideas', name: 'Ideas', tone: 'var(--ink-muted)' },
];

/** The auditor's read of the page, in the four columns an audit opens with. */
export function ReportTakeaways({ result }: { result: AuditResult }) {
  const t4 = result.expert?.takeaways;
  if (!t4 || !BUCKETS.some((b) => t4[b.key]?.length)) return null;
  return (
    <section id="takeaways" style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div style={frame}>
        <Intro eyebrow="Key takeaways" title="What works, and what to change">
          {result.expert?.summary ?? undefined}
        </Intro>
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {BUCKETS.filter((b) => t4[b.key]?.length).map((b) => (
            <div key={b.key} style={{ minWidth: 0, padding: 24, borderRadius: radius.lg, background: color.bgSubtle, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8, font: t(700, 15, 20), color: color.ink }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: radius.button, background: b.tone }} />
                {b.name}
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10, font: t(400, 15, 24), color: color.inkSecondary }}>
                {t4[b.key].map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- fix these first */

const FIRST = 5;

/**
 * The fix order: the first five slides that are not ideas. The slides are
 * already ranked, so the list and the slides never disagree.
 */
export function ReportPriorities({ result, findings }: { result: AuditResult; findings: Finding[] }) {
  const pillars = new Map(result.pillars.map((p) => [p.id, p.name]));
  const top = findings
    .map((f, i) => ({ f, slide: i + 1 }))
    .filter(({ f }) => f.expert?.bucket !== 'idea')
    .slice(0, FIRST);
  if (!top.length) return null;
  return (
    <section id="priorities" style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div style={frame}>
        <Intro eyebrow="Fix these first" title={`${top.length === 1 ? 'One fix' : `${top.length} fixes`}, in the order they are worth doing`}>
          Ranked by how serious each one is, whether a visitor would notice it, and how much your goal cares about its area.
        </Intro>

        <ol style={{ margin: '48px 0 0', padding: 0, listStyle: 'none', border: `1px solid ${color.border}`, borderRadius: radius.lg, overflow: 'hidden' }}>
          {top.map(({ f, slide }, i) => {
            const sub = f.expert
              ? `Expert review · ${f.expert.area}`
              : `${pillars.get(f.pillar) ?? f.familyName}${f.evidence.length > 1 ? ` · ${f.evidence.length} places` : ''}`;
            return (
              <li
                key={f.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '12px 20px',
                  padding: '20px 24px',
                  borderTop: i ? `1px solid ${color.border}` : 'none',
                  background: color.surface,
                }}
              >
                <span style={{ font: t(800, 20, 1), letterSpacing: tracking.snug, color: color.ink, width: 32 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <a href={`#issue-${slide}`} style={{ font: t(700, 17, 24), letterSpacing: tracking.snug, color: color.ink }}>
                    {f.checkName}
                  </a>
                  <span style={{ font: t(400, 14, 22), color: color.inkMuted }}>{sub}</span>
                </span>
                {!f.expert && (
                  <span style={{ font: t(500, 13, 18), color: color.inkSecondary, padding: '4px 10px', borderRadius: radius.sm, boxShadow: `inset 0 0 0 1px ${color.border}` }}>
                    {EFFORT[f.effort] ?? f.effort}
                  </span>
                )}
                <span style={{ background: SEV_TONE[f.nielsen], color: '#FFFFFF', font: t(700, 11, 16), letterSpacing: tracking.badge, textTransform: 'uppercase', padding: '4px 8px', borderRadius: radius.button }}>
                  {SEV_NAME[f.nielsen]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
