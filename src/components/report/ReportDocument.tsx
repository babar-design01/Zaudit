'use client';

import type { CSSProperties } from 'react';
import { VIEWPORT } from '@/lib/audit/contract';
import type { AuditResult, Finding } from '@/lib/audit/types';
import { color, layout, radius, t, tracking } from '@/design/tokens';
import { ReportPriorities, ReportTakeaways } from './ReportDetails';

/**
 * The report, from `design/Report.dc.html`.
 *
 * Two parts: a cover that puts the score beside what was checked and what was
 * found, then one full-width slide per issue — what is wrong, the page with
 * numbered marks on it, and under it a list where item *n* explains mark *n*.
 *
 * Every number on the page comes from the run. The handoff's writing rule
 * holds: simple English for people who are not designers, one idea per
 * sentence, what is wrong, why it matters to a visitor, and where it is.
 */

/* ------------------------------------------------------------ severity */

type Sev = 4 | 3 | 2 | 1;

const SEV: Record<Sev, { name: string; when: string; swatch: string; tag: string }> = {
  4: { name: 'Critical', when: 'Fix now', swatch: 'var(--critical)', tag: 'var(--critical)' },
  3: { name: 'Major', when: 'Fix soon', swatch: 'var(--major)', tag: 'var(--major)' },
  2: { name: 'Minor', when: 'Fix when you can', swatch: 'var(--blue)', tag: 'var(--blue)' },
  // The legend swatch is the design's light grey; the tag needs a darker fill
  // to carry white text at 4.5:1.
  1: { name: 'Cosmetic', when: 'Nice to fix', swatch: '#A1A6AE', tag: 'var(--ink-muted)' },
};

const sevOf = (n: number): Sev => (n >= 4 ? 4 : n === 3 ? 3 : n === 2 ? 2 : 1);

const pad = (n: number) => String(n).padStart(2, '0');

const EFFORT: Record<string, string> = { trivial: 'Minutes', small: 'Under an hour', medium: 'A few hours', large: 'A day or more' };

/**
 * Criteria a visitor never sees: the outline in the markup, landmarks, the
 * language attribute, the title tag, the server, metadata. Real faults, but an
 * auditor would not open with them, so they sort below anything of the same
 * severity a visitor would notice.
 */
const BACKSTAGE = new Set(['IA-05', 'IA-06', 'AC-06', 'AC-13', 'AC-14', 'CS-09', 'PF-04', 'PF-07', 'PF-08']);
const backstage = (f: Finding) => BACKSTAGE.has(f.criterionId) || f.pillar === 'technical';

/**
 * The order the slides run in: what a visitor runs into first, worst first,
 * ideas last. An auditor's fix sits just above a measured issue of the same
 * severity; ties go to the engine's own fix order, which weighs the goal.
 */
function displayOrder(r: AuditResult): Finding[] {
  const ranked = new Map((r.priorities ?? []).map((p, i) => [p.findingId, i]));
  const rank = (f: Finding) =>
    f.expert?.bucket === 'idea' ? -9 :f.nielsen + (f.expert?.bucket === 'fix' ? 0.25 : 0) - (backstage(f) ? 1.5 : 0);
  const tie = (f: Finding) => ranked.get(f.id) ?? 99;
  return byRule(r.findings).sort((a, b) => rank(b) - rank(a) || tie(a) - tie(b) || b.evidence.length - a.evidence.length);
}

/**
 * One slide per rule. The engine keeps a root cause per component so each is
 * deducted once, but a reader should meet "targets are too small" once, with
 * every place it happens.
 */
function byRule(findings: Finding[]): Finding[] {
  const out: Finding[] = [];
  const first = new Map<string, Finding>();
  for (const f of findings) {
    const held = f.source === 'expert' ? undefined : first.get(f.ruleId);
    if (!held) {
      const copy = { ...f, evidence: [...f.evidence] };
      if (f.source !== 'expert') first.set(f.ruleId, copy);
      out.push(copy);
      continue;
    }
    held.evidence.push(...f.evidence);
    if (f.nielsen > held.nielsen) held.nielsen = f.nielsen;
  }
  return out;
}

/** An idea is not a fault, so it does not wear a severity. */
function tagOf(f: Finding): { name: string; tone: string } {
  if (f.expert?.bucket === 'idea') return { name: 'Idea', tone: 'var(--ink-muted)' };
  const s = SEV[sevOf(f.nielsen)];
  return { name: s.name, tone: s.tag };
}

const frame: CSSProperties = { maxWidth: layout.frame, margin: '0 auto', padding: `72px ${layout.gutter}` };

/**
 * Prose without the plumbing: measurements name elements with CSS selectors,
 * which belong on the picture rather than in a sentence someone is reading.
 */
const plain = (s: string) =>
  s
    .replace(/\((?:[^()]|\([^()]*\))*\)/g, (m) => (/\s>\s/.test(m) ? '' : m))
    .replace(/\s[—–-]\s[^—–]*>[^—–]*$/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/([^.!?])$/, '$1.');

/**
 * One place, in a sentence. Some measurements are only a number — "68×33px" —
 * which says nothing until it stands next to what was expected.
 */
function said(e: Finding['evidence'][number]): string {
  if (e.observed.length >= 28 || !e.expected) return plain(e.observed);
  const expected = e.expected.replace(/^>=\s*/, 'at least ').replace(/^<=\s*/, 'at most ');
  return plain(`${e.observed}, against ${expected}`);
}

/* --------------------------------------------------------------- cover */

function summarySentence(r: AuditResult, findings: Finding[]): string {
  const found = findings.length;
  const checked = r.coverage.assessed;
  const critical = findings.filter((f) => sevOf(f.nielsen) === 4).length;
  const lead =
    r.overall == null
      ? 'We could not measure enough of this page to score it.'
      : r.overall >= 90
        ? 'Your page is in very good shape.'
        : r.overall >= 70
          ? 'Your page is in good shape.'
          : r.overall >= 50
            ? 'Your page works, but some things get in the way.'
            : 'Several things on this page get in visitors’ way.';
  const read = r.expert?.ran ? ', read the page the way an auditor would,' : '';
  const tail = found === 0 ? `${read} and found nothing to fix.` : `${read} and found ${found} to change.`;
  const crit = found === 0 ? '' : critical === 0 ? ' None of them is critical.' : ` ${critical === 1 ? 'One is' : `${critical} are`} critical.`;
  return `${lead} We checked ${checked} things${tail}${crit}`;
}

function Cover({ result, findings }: { result: AuditResult; findings: Finding[] }) {
  const host = hostOf(result.finalUrl);
  const date = new Date(result.fetchedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const counts = ([4, 3, 2, 1] as Sev[]).map((s) => ({ s, n: findings.filter((f) => sevOf(f.nielsen) === s).length }));
  const issues = findings.length;
  const expert = findings.filter((f) => f.source === 'expert').length;
  const passed = result.coverage.verdicts.pass ?? 0;
  const owed = result.reviewerTasks.length;

  return (
    <section id="cover" style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div style={{ ...frame, padding: `72px ${layout.gutter} 80px`, display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span style={{ font: t(600, 11, 16), letterSpacing: tracking.eyebrow, textTransform: 'uppercase', color: color.accentFg }}>
                UX audit report · {host} · {date}
              </span>
              <h1 style={{ margin: 0, font: t(800, 'clamp(52px, 6vw, 88px)', 1.0), letterSpacing: '-0.04em', color: color.ink }}>Experience audit</h1>
              <p style={{ margin: 0, maxWidth: 520, font: t(400, 18, 30), color: color.inkSecondary }}>{summarySentence(result, findings)}</p>
              {result.pageGoal && (
                <p style={{ margin: '8px 0 0', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, borderLeft: `3px solid ${color.blue}` }}>
                  <span style={{ font: t(600, 11, 16), letterSpacing: tracking.eyebrow, textTransform: 'uppercase', color: color.inkMuted }}>What this page is for</span>
                  <span style={{ font: t(600, 18, 28), color: color.ink }}>{result.pageGoal}</span>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <Figure n={result.coverage.assessed} label="Things checked" sub={owed ? `${owed} more need a person to look at them` : 'Nothing left for a person to check'} />
                <Figure n={issues} label={issues === 1 ? 'Issue found' : 'Issues found'} sub={expert ? `${issues - expert} measured · ${expert} from the expert review` : `${passed} check${passed === 1 ? '' : 's'} passed`} />
              </div>

              {issues > 0 && (
                <div
                  role="img"
                  aria-label={`Issues by severity: ${counts.map((c) => `${c.n} ${SEV[c.s].name.toLowerCase()}`).join(', ')}`}
                  style={{ display: 'flex', gap: 3, height: 8, borderRadius: radius.button, overflow: 'hidden' }}
                >
                  {counts
                    .filter((c) => c.n > 0)
                    .map((c) => (
                      <span key={c.s} title={`${SEV[c.s].name}: ${c.n}`} style={{ flex: `${c.n} 0 0`, background: SEV[c.s].swatch }} />
                    ))}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {counts.map(({ s, n }) => (
                  <div key={s} style={{ flex: '1 1 140px', minWidth: 0, background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.lg, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: t(600, 13, 18), color: color.ink }}>
                      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: radius.button, background: SEV[s].swatch }} />
                      {SEV[s].name}
                    </span>
                    <span style={{ font: t(700, 32, 1), letterSpacing: tracking.tight, color: color.ink }}>{n}</span>
                    <span style={{ font: t(400, 13, 18), color: color.inkMuted }}>{SEV[s].when}</span>
                  </div>
                ))}
              </div>
              {expert > 0 && (
                <p style={{ margin: 0, font: t(400, 13, 20), color: color.inkMuted }}>
                  The score covers the {result.coverage.assessed} measured checks. Expert-review findings are an auditor’s judgement on top of them and do not change it.
                </p>
              )}
            </div>
          </div>

          <ScoreCard result={result} host={host} />
        </div>
      </div>
    </section>
  );
}

function Figure({ n, label, sub }: { n: number; label: string; sub: string }) {
  return (
    <div style={{ flex: '1 1 240px', minWidth: 0, background: color.bgSubtle, borderRadius: radius.lg, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ font: t(800, 44, 1), letterSpacing: '-0.04em', color: color.ink }}>{n}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: t(600, 16, 22), color: color.ink }}>{label}</span>
        <span style={{ font: t(400, 13, 18), color: color.inkMuted }}>{sub}</span>
      </span>
    </div>
  );
}

function ScoreCard({ result, host }: { result: AuditResult; host: string }) {
  const blob: CSSProperties = { position: 'absolute', borderRadius: '50%' };
  return (
    <div
      style={{
        flex: '0 1 460px',
        minWidth: 0,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: radius.lg,
        background: color.bgMist,
        minHeight: 340,
        alignSelf: 'stretch',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 32,
      }}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <span data-blob="a" style={{ ...blob, left: '-20%', top: '-30%', width: '80%', height: '110%', background: color.glowCyan, filter: 'blur(70px)', opacity: 0.9 }} />
        <span data-blob="b" style={{ ...blob, right: '-25%', top: '-10%', width: '70%', height: '90%', background: color.glowBlue, filter: 'blur(80px)', opacity: 0.8 }} />
        <span data-blob="c" style={{ ...blob, left: '10%', bottom: '-40%', width: '80%', height: '80%', background: color.glowWhite, filter: 'blur(70px)', opacity: 0.95 }} />
      </div>
      <span style={{ position: 'relative', font: t(600, 12, 16), letterSpacing: tracking.button, textTransform: 'uppercase', color: color.ink }}>Your score</span>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span data-score style={{ font: t(800, 'clamp(96px, 11vw, 160px)', 0.85), letterSpacing: '-0.06em', color: color.ink }}>{result.overall ?? '—'}</span>
        <span style={{ font: t(600, 28, 1), color: color.inkSecondary }}>/100</span>
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ background: color.ink, color: '#FFFFFF', font: t(600, 12, 16), letterSpacing: tracking.button, textTransform: 'uppercase', padding: '8px 12px', borderRadius: radius.button }}>
          {result.band ?? 'Not scored'}
        </span>
        <span style={{ font: t(500, 13, 18), color: color.inkSecondary }}>{host}</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- issue slides */

type Mark = { n: number; text: string; box: { left: number; top: number; width: number; height: number } | null };

/**
 * One mark per place the issue appears. A box is drawn only where the evidence
 * has one on the first screen; a page-level issue has none and is explained in
 * the list alone.
 */
function marksOf(f: Finding): Mark[] {
  return f.evidence.slice(0, 6).map((e, i) => {
    const [x, y, w, h] = e.bbox;
    const whole = e.documentLevel || (w >= VIEWPORT.width * 0.95 && h >= VIEWPORT.height * 0.95);
    return {
      n: i + 1,
      text: said(e),
      box: whole
        ? null
        : {
            left: (x / VIEWPORT.width) * 100,
            top: (y / VIEWPORT.height) * 100,
            width: (w / VIEWPORT.width) * 100,
            height: (h / VIEWPORT.height) * 100,
          },
    };
  });
}

/** A capture a probe took while the page was in a state the reader cannot see. */
function captureOf(f: Finding): { src: string; label: string } | null {
  for (const e of f.evidence) {
    for (const [k, v] of Object.entries(e.fields)) {
      if (typeof v === 'string' && v.startsWith('data:image/')) {
        const label =
          k === 'mobile_capture' || (k === 'expert_capture' && f.expert?.device === 'mobile')
            ? 'The page on a phone, 390 × 844'
            : k === 'expert_capture'
              ? 'The page on desktop'
              : k.replace(/_/g, ' ').replace(/ (capture|screenshot)$/, '');
        return { src: v, label };
      }
    }
  }
  return null;
}

type Story = { issue: string; impact: string; solution: string };

/**
 * Every finding told the way the team writes one: what is wrong, what it costs
 * the business, what to do. An expert finding is written that way already; a
 * measured one is put together from its evidence, rationale and fix.
 */
function storyOf(f: Finding): Story {
  if (f.expert) return { issue: f.expert.issue, impact: f.expert.impact, solution: f.expert.solution };
  const more = f.evidence.length - 1;
  const first = f.evidence[0] ? said(f.evidence[0]) : plain(f.checkName);
  return {
    issue: more > 0 ? `${first} The same in ${more} more ${more === 1 ? 'place' : 'places'}.` : first,
    impact: plain(f.rationale),
    solution: plain(f.fix.split('\n')[0]),
  };
}

function StoryBlock({ story }: { story: Story }) {
  const parts: [string, string][] = [
    ['Issue', story.issue],
    ['Impact', story.impact],
    ['Solution', story.solution],
  ];
  return (
    <dl style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {parts.map(([k, v], i) => {
        const fix = i === 2;
        return (
          <div
            key={k}
            style={{
              flex: '1 1 280px',
              minWidth: 0,
              padding: 20,
              borderRadius: radius.lg,
              background: fix ? color.blueTint : color.surface,
              boxShadow: fix ? 'none' : `inset 0 0 0 1px ${color.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <dt style={{ font: t(600, 11, 16), letterSpacing: tracking.eyebrow, textTransform: 'uppercase', color: fix ? color.accentFg : color.inkMuted }}>{k}</dt>
            <dd style={{ margin: 0, font: t(400, 16, 26), color: color.ink }}>{v}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function IssueSlide({ finding, index, total, page, host }: { finding: Finding; index: number; total: number; page: AuditResult['screenshot']; host: string }) {
  const tag = tagOf(finding);
  const expert = finding.expert;
  const marks = marksOf(finding);
  const boxed = marks.filter((m) => m.box);
  const capture = captureOf(finding);
  // A probe's own capture wins when the issue is about a state the first
  // screen does not show — the phone view, the dark theme, the stretched text.
  const showCapture = !!capture && boxed.length === 0;
  const tone = tag.tone;
  // One place is said in full by the issue; a list would only repeat it.
  const listed = marks.length > 1 || !!expert;
  const meta = expert
    ? ['Expert review', expert.area, expert.device === 'mobile' ? 'On a phone' : 'On desktop', `${Math.round(finding.confidence * 100)}% sure`]
    : ['Measured', finding.criterionName, finding.standard, `${finding.evidence.length} ${finding.evidence.length === 1 ? 'place' : 'places'}`, `${EFFORT[finding.effort] ?? finding.effort} to fix`];

  return (
    <section id={`issue-${index}`} data-finding={index} style={{ scrollMarginTop: 24,  background: index % 2 ? color.surface : '#F7F8FA', borderBottom: `1px solid ${color.border}` }}>
      <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ maxWidth: 760, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ font: t(800, 20, 1), letterSpacing: tracking.snug, color: color.ink }}>{pad(index)}</span>
            <span style={{ background: tone, color: '#FFFFFF', font: t(700, 11, 16), letterSpacing: tracking.badge, textTransform: 'uppercase', padding: '4px 8px', borderRadius: radius.button }}>
              {tag.name}
            </span>
            <span style={{ font: t(500, 13, 18), color: color.inkMuted }}>
              Issue {index} of {total}
            </span>
          </div>
          <h2 style={{ margin: 0, font: t(800, 'clamp(28px, 3vw, 40px)', 1.12), letterSpacing: tracking.tight, color: color.ink }}>{finding.checkName}</h2>
          <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '6px 16px', font: t(400, 13, 20), color: color.inkMuted }}>
            {meta.map((m, i) => (
              <span key={m} style={i === 0 ? { fontWeight: 600, color: expert ? color.accentFg : color.inkSecondary } : undefined}>
                {m}
              </span>
            ))}
          </p>
        </div>

        <StoryBlock story={storyOf(finding)} />

        <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {showCapture ? (
            <div style={{ display: 'flex', justifyContent: 'center', background: '#EEF1F6', border: `1px solid ${color.border}`, borderRadius: radius.lg, padding: 24 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a capture taken mid-audit */}
              <img src={capture.src} alt={`${capture.label}, with ${marks.length} numbered mark${marks.length === 1 ? '' : 's'} where this issue appears`} style={{ display: 'block', maxWidth: '100%', maxHeight: 620, height: 'auto', borderRadius: radius.md, boxShadow: 'var(--shadow-raise)' }} />
            </div>
          ) : (
            <div
              role="img"
              aria-label={`Screenshot of ${host} with ${boxed.length} numbered mark${boxed.length === 1 ? '' : 's'}`}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: `${VIEWPORT.width} / ${VIEWPORT.height}`,
                maxHeight: 720,
                background: '#EEF1F6',
                border: `1px solid ${color.border}`,
                borderRadius: radius.lg,
                overflow: 'hidden',
              }}
            >
              {page?.data ? (
                // eslint-disable-next-line @next/next/no-img-element -- the captured first screen
                <img src={page.data} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left' }} />
              ) : (
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: t(500, 13, 18), color: color.inkMuted }}>
                  No screenshot was captured for this run
                </span>
              )}
              {boxed.map((m) => (
                <span key={`box-${m.n}`}>
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: `${m.box!.left}%`,
                      top: `${m.box!.top}%`,
                      width: `${Math.max(1.2, m.box!.width)}%`,
                      height: `${Math.max(1.2, m.box!.height)}%`,
                      border: `2px solid ${tone}`,
                      borderRadius: radius.sm,
                      boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.6)',
                    }}
                  />
                  <span
                    data-mark
                    style={{
                      position: 'absolute',
                      left: `calc(${m.box!.left}% - 14px)`,
                      top: `calc(${m.box!.top}% - 14px)`,
                      width: 28,
                      height: 28,
                      borderRadius: radius.md,
                      background: tone,
                      color: '#FFFFFF',
                      font: t(700, 13, 28),
                      textAlign: 'center',
                      boxShadow: '0 4px 10px rgba(10, 11, 13, 0.2)',
                    }}
                  >
                    {m.n}
                  </span>
                </span>
              ))}
            </div>
          )}

          {listed && (
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '20px 40px' }}>
            {marks.map((m) => (
              <li key={m.n} style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: radius.md, background: m.box || !showCapture || expert ? tone : color.inkMuted, color: '#FFFFFF', font: t(700, 13, 28), textAlign: 'center' }}>
                  {m.n}
                </span>
                <span style={{ font: t(400, 16, 26), color: color.inkSecondary }}>{m.text}</span>
              </li>
            ))}
          </ol>
          )}
        </figure>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- page */

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export function ReportDocument({ result }: { result: AuditResult }) {
  const host = hostOf(result.finalUrl);
  const findings = displayOrder(result);
  return (
    <article>
      <Cover result={result} findings={findings} />
      <ReportTakeaways result={result} />
      <ReportPriorities result={result} findings={findings} />
      {findings.length === 0 ? (
        <section style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
          <div style={{ ...frame }}>
            <h2 style={{ margin: 0, font: t(800, 'clamp(28px, 3vw, 40px)', 1.12), letterSpacing: tracking.tight }}>Nothing to fix on this page</h2>
            <p style={{ margin: '16px 0 0', maxWidth: 640, font: t(400, 17, 28), color: color.inkSecondary }}>
              Every check we could run passed. The things only a person can judge are still worth a look before you call it done.
            </p>
          </div>
        </section>
      ) : (
        findings.map((f, i) => <IssueSlide key={f.id} finding={f} index={i + 1} total={findings.length} page={result.screenshot} host={host} />)
      )}
    </article>
  );
}

/** Kept for the homepage summary card, which still reads the old palette. */
export const REPORT_INK = {
  paper: '#0A0B0D',
  onPaper: '#FFFFFF',
  onPaperBody: '#D4D4D4',
  onPaperMuted: '#A1A1A1',
  rule: '#262626',
  light: '#F7F8FA',
  lightRule: '#E7E8EA',
  critical: '#E5484D',
  major: '#C2410C',
  minor: '#6B7280',
  cosmetic: '#9CA3AF',
  pageBg: '#FFFFFF',
};
