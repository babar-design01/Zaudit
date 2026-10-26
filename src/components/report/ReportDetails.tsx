'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { AuditResult } from '@/lib/audit/types';
import { color, layout, radius, t, tracking } from '@/design/tokens';

/**
 * The fix order, set between the cover and the issue slides as their contents:
 * the top fixes ranked by severity, how many places each appears and how much
 * the goal weights its area, each linking to its slide.
 *
 * TODO(design): this section is not drawn in the handoff.
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

/* -------------------------------------------------------- fix these first */

function Priorities({ result, order }: { result: AuditResult; order: Map<string, number> }) {
  if (!result.priorities.length) return null;
  return (
    <section id="priorities" style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div style={frame}>
        <Intro eyebrow="Fix these first" title={`${result.priorities.length === 1 ? 'One fix' : `${result.priorities.length} fixes`}, in the order they are worth doing`}>
          Ranked by how serious each one is, how many places it shows up, and how much your goal cares about its area.
        </Intro>

        <ol style={{ margin: '48px 0 0', padding: 0, listStyle: 'none', border: `1px solid ${color.border}`, borderRadius: radius.lg, overflow: 'hidden' }}>
          {result.priorities.map((p, i) => {
            const slide = order.get(p.findingId);
            return (
              <li
                key={p.findingId}
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
                  {slide ? (
                    <a href={`#issue-${slide}`} style={{ font: t(700, 17, 24), letterSpacing: tracking.snug, color: color.ink }}>
                      {p.problem}
                    </a>
                  ) : (
                    <span style={{ font: t(700, 17, 24), letterSpacing: tracking.snug, color: color.ink }}>{p.problem}</span>
                  )}
                  <span style={{ font: t(400, 14, 22), color: color.inkMuted }}>
                    {p.pillarName}
                    {p.instances > 1 ? ` · ${p.instances} places` : ''}
                  </span>
                </span>
                <span style={{ font: t(500, 13, 18), color: color.inkSecondary, padding: '4px 10px', borderRadius: radius.sm, boxShadow: `inset 0 0 0 1px ${color.border}` }}>
                  {EFFORT[p.effort] ?? p.effort}
                </span>
                <span style={{ background: SEV_TONE[p.severity], color: '#FFFFFF', font: t(700, 11, 16), letterSpacing: tracking.badge, textTransform: 'uppercase', padding: '4px 8px', borderRadius: radius.button }}>
                  {SEV_NAME[p.severity]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/** The fix order, set between the cover and the issues as their contents. */
export function ReportPriorities({ result, order }: { result: AuditResult; order: Map<string, number> }) {
  return <Priorities result={result} order={order} />;
}
