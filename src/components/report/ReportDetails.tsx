'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { AuditResult } from '@/lib/audit/types';
import { color, layout, radius, t, tracking } from '@/design/tokens';

/**
 * Everything else the engine produced, after the issue slides.
 *
 * The handoff's report stops at the issues and the contact panel; the run
 * carries more than that and a reader acting on it needs it: where the score
 * comes from area by area, the order to fix things in, what could not be
 * checked from outside and who has to check it, what already works and should
 * not be broken by a fix, the findings held back for being uncertain, and how
 * the page was measured. Each is set in the design's own section pattern —
 * eyebrow and heading on the left, the description on the right — and every
 * line of it is data from the run.
 *
 * TODO(design): these sections are not drawn in the handoff.
 */

const frame: CSSProperties = { maxWidth: layout.frame, margin: '0 auto', padding: `80px ${layout.gutter}` };

const SEV_NAME: Record<number, string> = { 4: 'Critical', 3: 'Major', 2: 'Minor', 1: 'Cosmetic', 0: 'Cosmetic' };
const SEV_TONE: Record<number, string> = { 4: 'var(--critical)', 3: 'var(--major)', 2: 'var(--blue)', 1: 'var(--ink-muted)', 0: 'var(--ink-muted)' };
const EFFORT: Record<string, string> = { trivial: 'Minutes', small: 'Under an hour', medium: 'A few hours', large: 'A day or more' };

const plain = (s: string) =>
  s
    .replace(/\((?:[^()]|\([^()]*\))*\)/g, (m) => (/\s>\s/.test(m) ? '' : m))
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

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

const card: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: radius.lg,
  padding: 24,
};

/* ------------------------------------------------------- score by area */

function Areas({ result }: { result: AuditResult }) {
  const heavier = result.goal.heavier;
  return (
    <section id="areas" style={{ background: color.bgSubtle, borderBottom: `1px solid ${color.border}` }}>
      <div style={frame}>
        <Intro eyebrow="Score by area" title="Where the score comes from">
          {heavier.length
            ? `You chose “${result.goal.name}”, so ${heavier.length === 1 ? 'one area counts' : `${heavier.length} areas count`} double. Each area scores the share of its checks that passed; a partial pass counts half.`
            : `You chose “${result.goal.name}”, so every area counts the same. Each area scores the share of its checks that passed; a partial pass counts half.`}
        </Intro>

        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20 }}>
          {result.pillars.map((p) => {
            const tone = p.score == null ? 'var(--border-strong)' : p.score >= 70 ? 'var(--ink)' : p.score >= 50 ? 'var(--major)' : 'var(--critical)';
            const owed = p.counts.not_assessed;
            return (
              <div key={p.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <h3 style={{ margin: 0, font: t(700, 18, 26), letterSpacing: tracking.snug, color: color.ink }}>{p.name}</h3>
                  {p.weight > 1 && (
                    <span style={{ flexShrink: 0, background: color.blueTint, color: color.accentFg, font: t(700, 10, 14), letterSpacing: tracking.badge, textTransform: 'uppercase', padding: '4px 8px', borderRadius: radius.sm }}>
                      Counts double
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ font: t(600, 42, 1), letterSpacing: tracking.tight, color: p.score == null ? color.inkMuted : color.blue }}>{p.score ?? '—'}</span>
                  {p.score != null && <span style={{ font: t(600, 15, 1), color: color.inkMuted }}>/100</span>}
                </div>
                <div style={{ height: 6, background: '#EEF0F3', borderRadius: radius.button, overflow: 'hidden' }}>
                  <div style={{ width: `${p.score ?? 0}%`, height: '100%', background: tone }} />
                </div>
                <p style={{ margin: 0, font: t(400, 14, 22), color: color.inkSecondary }}>{p.question}</p>
                <span style={{ font: t(400, 13, 20), color: color.inkMuted }}>
                  {p.counts.pass} passed · {p.counts.fail + p.counts.partial} failed{owed ? ` · ${owed} for a person` : ''}
                  {p.score == null ? ' · nothing here could be measured' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
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

/* ------------------------------------------------- what needs a person */

function Tasks({ result }: { result: AuditResult }) {
  if (!result.reviewerTasks.length) return null;
  return (
    <section id="tasks" style={{ background: color.bgSubtle, borderBottom: `1px solid ${color.border}` }}>
      <div style={frame}>
        <Intro eyebrow="Still to check" title="What we could not check from outside">
          Some things need someone to use the product: submit a form, follow a task through, read the copy with your customers in mind. Each one below is a short job for a person. None of them changed your score.
        </Intro>
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20 }}>
          {result.reviewerTasks.map((task) => (
            <div key={task.criterionId} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ font: t(600, 11, 16), letterSpacing: tracking.eyebrow, textTransform: 'uppercase', color: color.inkMuted }}>{task.pillarName}</span>
              <h3 style={{ margin: 0, font: t(700, 18, 26), letterSpacing: tracking.snug, color: color.ink }}>{task.criterion}</h3>
              <p style={{ margin: 0, font: t(400, 15, 24), color: color.inkSecondary }}>{task.task}</p>
              <p style={{ margin: 0, paddingTop: 12, borderTop: `1px solid ${color.border}`, font: t(400, 13, 20), color: color.inkMuted }}>
                <span style={{ fontWeight: 600, color: color.ink }}>Why it matters. </span>
                {task.why}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ what is working */

function Working({ result }: { result: AuditResult }) {
  if (!result.whatWorks.length) return null;
  return (
    <section id="working" style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div style={frame}>
        <Intro eyebrow="Already working" title="Keep these as they are">
          These passed. They are worth knowing before you change anything, so a fix for one issue does not undo one of them.
        </Intro>
        <ul style={{ margin: '48px 0 0', padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0 40px' }}>
          {result.whatWorks.map((w) => (
            <li key={w.criterionId + w.evidenceId} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '18px 0', borderTop: `1px solid ${color.border}` }}>
              <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 2, width: 20, height: 20, borderRadius: radius.sm, background: color.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ font: t(700, 16, 22), color: color.ink }}>{w.criterion}</span>
                <span style={{ font: t(400, 14, 22), color: color.inkSecondary }}>{plain(w.text)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- held back */

function HeldBack({ result }: { result: AuditResult }) {
  if (!result.review.length) return null;
  return (
    <section id="unconfirmed" style={{ background: color.bgSubtle, borderBottom: `1px solid ${color.border}` }}>
      <div style={frame}>
        <Intro eyebrow="Not confirmed" title="Worth a look, not counted">
          We measured these but were not sure enough to call them issues, so none of them changed your score. A person should decide.
        </Intro>
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
          {result.review.map((f) => (
            <div key={f.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ font: t(700, 17, 24), letterSpacing: tracking.snug, color: color.ink }}>{f.checkName}</span>
                <span style={{ flexShrink: 0, font: t(600, 12, 16), color: color.inkMuted }}>{Math.round(f.confidence * 100)}% sure</span>
              </div>
              <p style={{ margin: 0, font: t(400, 15, 24), color: color.inkSecondary }}>{plain(f.evidence[0]?.observed ?? '')}</p>
              {f.reviewReason && <p style={{ margin: 0, font: t(400, 13, 20), color: color.inkMuted }}>{f.reviewReason}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- method */

function Method({ result }: { result: AuditResult }) {
  const notApplicable = result.coverage.verdicts.not_applicable ?? 0;
  const seconds = Math.round(result.tookMs / 1000);
  const facts: [string, string][] = [
    ['Page', result.finalUrl],
    ['Goal', result.goal.name],
    ['Page type', result.pageType.type.replace(/_/g, ' ')],
    ['Checked', `${result.coverage.assessed} of ${result.coverage.total} things that apply to this page`],
    ['Left out', `${notApplicable} that do not apply to a page like this`],
    ['Took', `${seconds} second${seconds === 1 ? '' : 's'}`],
    ['Run on', new Date(result.fetchedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })],
    ['Report', result.id],
  ];
  return (
    <section id="method" style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div style={frame}>
        <Intro eyebrow="How this was measured" title="One page, in a real browser">
          The page was opened in Chromium at 1440 × 900 and again on a 390 × 844 phone screen. Colour and contrast were read from the rendered pixels, focus from a real Tab walk, timings from the browser itself. Nothing was submitted, pressed or bought.
        </Intro>
        <dl style={{ margin: '48px 0 0', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20 }}>
          {facts.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 14, borderTop: `1px solid ${color.border}`, minWidth: 0 }}>
              <dt style={{ font: t(600, 11, 16), letterSpacing: tracking.eyebrow, textTransform: 'uppercase', color: color.inkMuted }}>{k}</dt>
              <dd style={{ margin: 0, font: t(500, 15, 22), color: color.ink, overflowWrap: 'anywhere' }}>{v}</dd>
            </div>
          ))}
        </dl>
        <p style={{ margin: '32px 0 0', maxWidth: 820, font: t(400, 14, 22), color: color.inkMuted }}>
          {result.scoreBasis} {result.discarded > 0 ? `${result.discarded} measurement${result.discarded === 1 ? ' was' : 's were'} dropped for incomplete evidence rather than reported.` : ''}
        </p>
        <p style={{ margin: '12px 0 0', font: t(400, 13, 20), color: color.inkMuted }}>{result.provenance}</p>
      </div>
    </section>
  );
}

/** The fix order, set between the cover and the issues as their contents. */
export function ReportPriorities({ result, order }: { result: AuditResult; order: Map<string, number> }) {
  return <Priorities result={result} order={order} />;
}

/** Everything after the issues. */
export function ReportDetails({ result }: { result: AuditResult }) {
  return (
    <>
      <Areas result={result} />
      <Working result={result} />
      <Tasks result={result} />
      <HeldBack result={result} />
      <Method result={result} />
    </>
  );
}
