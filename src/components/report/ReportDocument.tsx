'use client';

import type { CSSProperties, ReactNode } from 'react';
import { AnnotationShot } from '@/components/sections/AnnotationShot';
import { Container } from '@/components/ui';
import { color, radius, t } from '@/design/tokens';
import { SEVERITY_MEANING, SEVERITY_NAME, VERDICT_LABEL } from '@/lib/audit/framework';
import type { AuditResult, CriterionReport, Finding, Severity, Verdict } from '@/lib/audit/types';

/**
 * The report as a document.
 *
 * It reads in the order an audit is presented rather than the order the engine
 * produced it: the cover and its numbers, how to read the severities, what was
 * covered, the score by pillar, then every finding — observation, impact,
 * recommendation — and finally the work that is still owed. Findings sit on dark
 * pages so a reader can tell at a glance where the problems are; everything
 * explaining the method stays light.
 *
 * Nothing here decides anything. Every number comes from the measurement that
 * produced it, and every finding names its criterion, its standard and the
 * evidence behind it.
 */

/* ------------------------------------------------------------------ ink */

const INK = {
  paper: '#0A0A0A',
  onPaper: '#FFFFFF',
  onPaperBody: '#D4D4D4',
  onPaperMuted: '#A1A1A1',
  rule: '#262626',
  light: '#E8E8E6',
  lightRule: '#D2D2CE',
  critical: '#E7000B',
  major: '#C2410C',
  minor: '#6B7280',
  cosmetic: '#9CA3AF',
} as const;

const SEVERITY_INK: Record<Severity, string> = {
  4: INK.critical,
  3: INK.major,
  2: INK.minor,
  1: INK.cosmetic,
  0: INK.cosmetic,
};

const VERDICT_INK: Record<Verdict, string> = {
  fail: INK.critical,
  partial: INK.major,
  pass: '#1F2937',
  not_assessed: 'transparent',
  not_applicable: 'transparent',
};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Prose without the plumbing: a measurement often names the element with a CSS
 * selector, which belongs on the picture and in the export rather than in the
 * middle of a sentence someone is reading.
 */
const tidy = (text: string) =>
  text
    // "(div > div:nth-of-type(2) > img)" — an aside to a machine, not a reader.
    // A descendant combinator has spaces around it, which "(>= 3:1)" does not:
    // that one is a spec worth keeping.
    .replace(/\((?:[^()]|\([^()]*\))*\)/g, (m) => (/\s>\s/.test(m) ? '' : m))
    // "…at 9.84s — div > div > img" — the same, tacked on after a dash
    .replace(/\s[—–-]\s[^—–]*>[^—–]*$/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();

/* -------------------------------------------------------------- pieces */

function Eyebrow({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'ink' }) {
  return (
    <span
      style={{
        font: t(400, 12, 20, 'mono'),
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: tone === 'muted' ? 'var(--report-muted)' : 'var(--report-fg)',
      }}
    >
      {children}
    </span>
  );
}

function SectionMark({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, paddingBottom: 14, borderBottom: '1px solid var(--report-rule)' }}>
      <Eyebrow>{label}</Eyebrow>
      <Eyebrow>{pad(n)}</Eyebrow>
    </div>
  );
}

function Page({ dark, children, style }: { dark?: boolean; children: ReactNode; style?: CSSProperties }) {
  return (
    <section
      data-report-page={dark ? 'dark' : 'light'}
      style={
        {
          background: dark ? INK.paper : INK.light,
          '--report-fg': dark ? INK.onPaper : '#0A0A0A',
          '--report-body': dark ? INK.onPaperBody : '#3F3F46',
          '--report-muted': dark ? INK.onPaperMuted : '#71717A',
          '--report-rule': dark ? INK.rule : INK.lightRule,
          color: dark ? INK.onPaper : '#0A0A0A',
          padding: '72px 0',
          ...style,
        } as CSSProperties
      }
    >
      <Container>{children}</Container>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ font: t(400, 11, 18, 'mono'), letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--report-muted)' }}>{label}</div>
      <div style={{ font: t(600, 40, 44), letterSpacing: '-0.03em', color: tone ?? 'var(--report-fg)', marginTop: 6 }}>{value}</div>
    </div>
  );
}

function Body({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ font: t(400, 16, 26), color: 'var(--report-body)', margin: 0, textWrap: 'pretty', ...style }}>{children}</p>;
}

function SeverityChip({ severity }: { severity: Severity }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        font: t(500, 12, 18, 'mono'),
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: severity >= 3 ? '#fff' : 'var(--report-fg)',
        background: severity >= 3 ? SEVERITY_INK[severity] : 'transparent',
        border: `1px solid ${severity >= 3 ? SEVERITY_INK[severity] : 'var(--report-rule)'}`,
        borderRadius: radius.full,
        padding: '3px 10px',
      }}
    >
      S{5 - severity} · {SEVERITY_NAME[severity]}
    </span>
  );
}

/* ----------------------------------------------------------- the report */

export function ReportDocument({ result }: { result: AuditResult }) {
  const host = (() => {
    try {
      return new URL(result.finalUrl).hostname.replace(/^www\./, '');
    } catch {
      return result.finalUrl;
    }
  })();
  const when = new Date(result.fetchedAt);
  const stamp = when.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase();
  // The standards a client recognises, named first; the rest of the practice
  // behind the criteria is listed per pillar further down.
  const all = [...new Set(result.pillars.flatMap((p) => p.standards))];
  const headline = ['Nielsen', 'WCAG', 'Core Web Vitals', 'Gestalt'].map((k) => all.find((s) => s.includes(k))).filter((s): s is string => !!s);
  const standards = headline.length ? headline : all.slice(0, 3);
  const findings = result.findings;
  const measured = result.criteria.filter((c) => c.verdict !== 'not_applicable');
  const pillarNames = new Map(result.pillars.map((p) => [p.id, p.name]));

  return (
    <article style={{ background: INK.light }}>
      {/* ------------------------------------------------------------ cover */}
      <Page dark style={{ padding: '96px 0 72px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Eyebrow>UX audit · {result.goal.name}</Eyebrow>
          <Eyebrow>
            {host} — {stamp}
          </Eyebrow>
        </div>

        <h1
          style={{
            font: t(400, 'clamp(52px, 8vw, 104px)', 0.92, 'serif'),
            letterSpacing: '-0.03em',
            margin: '56px 0 0',
            color: INK.onPaper,
            maxWidth: 14 + 'ch',
          }}
        >
          Experience audit
        </h1>

        <Body style={{ maxWidth: 640, marginTop: 28, color: INK.onPaperBody }}>
          The first screen of {host}, read at 1440×900 and again at 320px, against the {measured.length} criteria that apply to a{' '}
          {result.pageType.type.replace(/_/g, ' ')} page — drawn from {standards.join(', ')}. {result.coverage.assessed} of them
          could be settled from the page itself; the rest are listed as work for a reviewer. Every finding is numbered, carries
          the measurement that produced it, and is paired with the change that resolves it.
        </Body>

        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', marginTop: 56, paddingTop: 28, borderTop: `1px solid ${INK.rule}` }}>
          <Stat label="Findings" value={pad(findings.length)} />
          <Stat label="Critical" value={pad(result.counts[4] + result.counts[3])} tone={findings.some((f) => f.nielsen >= 3) ? INK.critical : undefined} />
          <Stat label="Criteria" value={pad(result.coverage.assessed)} />
          <Stat
            label="Score"
            value={
              result.overall == null ? (
                'n/a'
              ) : (
                <>
                  {result.overall}
                  <span style={{ font: t(600, 21, 24), color: INK.onPaperMuted, letterSpacing: '-0.04em' }}>/100</span>
                </>
              )
            }
          />
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 28, font: t(400, 12, 20, 'mono'), color: INK.onPaperMuted }}>
          <span>{result.pageType.type.replace(/_/g, ' ')} page</span>
          <span>{result.platforms.join(' + ')}</span>
          <span>{when.toLocaleString()}</span>
          <span>{result.band ?? 'not scored'}</span>
        </div>
      </Page>

      {/* --------------------------------------------------- how to read */}
      <Page>
        <SectionMark n={2} label="How to read this report" />
        <h2 style={{ font: t(600, 'clamp(28px, 3vw, 40px)', 1.05), letterSpacing: '-0.03em', margin: '28px 0 0' }}>
          Four severities, one scale, no adjectives
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 20, marginTop: 32 }}>
          {([4, 3, 2, 1] as Severity[]).map((n) => (
            <div key={n} style={{ borderTop: `2px solid ${SEVERITY_INK[n]}`, paddingTop: 14 }}>
              <div style={{ font: t(400, 12, 20, 'mono'), letterSpacing: '0.08em', color: 'var(--report-muted)' }}>S{5 - n}</div>
              <div style={{ font: t(600, 20, 26), letterSpacing: '-0.02em', marginTop: 2 }}>{SEVERITY_NAME[n]}</div>
              <p style={{ font: t(400, 14, 21), color: 'var(--report-muted)', margin: '10px 0 14px', textWrap: 'pretty' }}>{SEVERITY_MEANING[n]}</p>
              <div style={{ font: t(500, 13, 20, 'mono'), color: 'var(--report-fg)' }}>{result.counts[n]} found</div>
            </div>
          ))}
        </div>

        {/* coverage map */}
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--report-rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <Eyebrow>Coverage · {measured.length} criteria judged or owed</Eyebrow>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', font: t(400, 12, 20, 'mono'), color: 'var(--report-muted)' }}>
              <Key ink={INK.critical} label="Fail" />
              <Key ink={INK.major} label="Partial" />
              <Key ink="#1F2937" label="Pass" />
              <Key ink="transparent" label="Needs a reviewer" outline />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 18 }}>
            {measured.map((c) => (
              <span
                key={c.id}
                title={`${c.id} — ${c.name}: ${VERDICT_LABEL[c.verdict]}`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 3,
                  background: VERDICT_INK[c.verdict],
                  border: c.verdict === 'not_assessed' ? '1px dashed var(--report-rule)' : '1px solid transparent',
                }}
              />
            ))}
          </div>
        </div>

        {/* method */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, marginTop: 48 }}>
          <div>
            <Eyebrow>Method</Eyebrow>
            <Body style={{ marginTop: 12 }}>
              The page was opened in a real browser and measured: colour and contrast from rendered pixels, structure and names
              from the accessibility tree, focus from a real Tab walk, timings from the browser’s own Core Web Vitals, and the
              layout stress-tested with longer and shorter text. Nothing was submitted, pressed or purchased.
            </Body>
          </div>
          <div>
            <Eyebrow>What the score covers</Eyebrow>
            <Body style={{ marginTop: 12 }}>{result.scoreBasis}</Body>
          </div>
        </div>
      </Page>

      {/* --------------------------------------------------- score by pillar */}
      <Page style={{ background: '#F4F4F2' }}>
        <SectionMark n={3} label="Score by pillar" />
        <div style={{ marginTop: 28 }}>
          {result.pillars.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px, 1.4fr) minmax(120px, 2fr) 64px',
                gap: 20,
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: '1px solid var(--report-rule)',
              }}
            >
              <div>
                <div style={{ font: t(500, 16, 22), letterSpacing: '-0.01em' }}>{p.name}</div>
                <div style={{ font: t(400, 12, 18, 'mono'), color: 'var(--report-muted)', marginTop: 3 }}>
                  {p.counts.pass} pass · {p.counts.partial} partial · {p.counts.fail} fail · {p.counts.not_assessed} owed
                  {p.weight > 1 ? ' · double weight' : ''}
                </div>
              </div>
              <div style={{ height: 8, background: '#DEDEDA', borderRadius: 999, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${p.score ?? 0}%`,
                    height: '100%',
                    background: p.score == null ? 'transparent' : p.score >= 90 ? '#1F2937' : p.score >= 70 ? '#4B5563' : p.score >= 50 ? INK.major : INK.critical,
                  }}
                />
              </div>
              <div style={{ font: t(600, 20, 24), letterSpacing: '-0.02em', textAlign: 'right' }}>{p.score ?? '—'}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginTop: 24 }}>
          <Eyebrow tone="ink">Composite</Eyebrow>
          <div style={{ font: t(600, 40, 44), letterSpacing: '-0.03em' }}>
            {result.overall ?? '—'}
            <span style={{ font: t(600, 21, 24), color: 'var(--report-muted)' }}>/100</span>
          </div>
        </div>
        <Body style={{ marginTop: 10, maxWidth: 680 }}>
          {result.goal.heavier.length
            ? `${result.goal.heavier.join(', ')} carry double weight for the ${result.goal.name.toLowerCase()} goal. `
            : 'Every pillar carries equal weight. '}
          A pillar scores the share of its judged criteria that passed, with a partial counting half. Criteria that need a
          reviewer are outside the score on both sides.
        </Body>
      </Page>

      {/* ------------------------------------------------------- findings */}
      {findings.length > 0 && (
        <Page dark style={{ padding: '72px 0 40px' }}>
          <SectionMark n={4} label={`Findings · ${findings.length}`} />
        </Page>
      )}
      {findings.map((f, i) => (
        <FindingPage
          key={f.id}
          finding={f}
          index={i + 1}
          total={findings.length}
          pillar={pillarNames.get(f.pillar) ?? f.pillar}
          page={result.screenshot}
          // One measurement can fail in two unrelated places; the titles then need telling apart.
          distinguish={
            findings.filter((x) => x.checkName === f.checkName).length > 1
              ? `${findings.filter((x) => x.checkName === f.checkName).findIndex((x) => x.id === f.id) + 1} of ${findings.filter((x) => x.checkName === f.checkName).length}`
              : undefined
          }
        />
      ))}

      {/* --------------------------------------------------- logged, unsure */}
      {result.review.length > 0 && (
        <Page>
          <SectionMark n={5} label="Logged, not confirmed" />
          <Body style={{ marginTop: 20, maxWidth: 680 }}>
            Each of these was measured but is not certain enough to report as a failure, so none of them changes the score. They
            are listed because the evidence is worth a look.
          </Body>
          <div style={{ marginTop: 28 }}>
            {result.review.map((f) => (
              <div key={f.id} style={{ padding: '16px 0', borderTop: '1px solid var(--report-rule)' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <Eyebrow>{f.criterionId}</Eyebrow>
                  <div style={{ font: t(500, 16, 22) }}>{f.criterionName}</div>
                  <Eyebrow>{Math.round(f.confidence * 100)}% confidence</Eyebrow>
                </div>
                <Body style={{ fontSize: 14, lineHeight: '21px', marginTop: 6 }}>{f.evidence[0]?.observed}</Body>
                {f.reviewReason && (
                  <div style={{ font: t(400, 13, 20), color: 'var(--report-muted)', marginTop: 4 }}>{f.reviewReason}</div>
                )}
              </div>
            ))}
          </div>
        </Page>
      )}

      {/* ------------------------------------------------------ next steps */}
      {result.priorities.length > 0 && (
        <Page style={{ background: '#F4F4F2' }}>
          <SectionMark n={6} label="Next steps" />
          <h2 style={{ font: t(600, 'clamp(26px, 2.6vw, 36px)', 1.08), letterSpacing: '-0.03em', margin: '26px 0 0', maxWidth: 760 }}>
            {result.priorities.length} fixes, in the order they are worth doing
          </h2>
          <Body style={{ marginTop: 12, maxWidth: 680 }}>
            Ranked by severity, by how many places each appears, and by the weight the {result.goal.name.toLowerCase()} goal puts
            on its pillar.
          </Body>
          <div style={{ marginTop: 32 }}>
            {result.priorities.map((p, i) => (
              <div
                key={p.findingId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px minmax(0, 1fr) minmax(120px, 0.5fr) 110px',
                  gap: 16,
                  alignItems: 'start',
                  padding: '18px 0',
                  borderTop: '1px solid var(--report-rule)',
                }}
              >
                <div style={{ font: t(400, 13, 20, 'mono'), color: 'var(--report-muted)' }}>{pad(i + 1)}</div>
                <div>
                  <div style={{ font: t(500, 17, 24), letterSpacing: '-0.01em' }}>{p.problem}</div>
                  <div style={{ font: t(400, 14, 21), color: 'var(--report-muted)', marginTop: 4, textWrap: 'pretty' }}>{tidy(p.observed)}</div>
                </div>
                <div style={{ font: t(400, 13, 20, 'mono'), color: 'var(--report-muted)' }}>{p.pillarName}</div>
                <div style={{ font: t(400, 13, 20, 'mono'), color: 'var(--report-muted)', textAlign: 'right' }}>
                  {p.effort} · {SEVERITY_NAME[p.severity].toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        </Page>
      )}

      {/* ------------------------------------------- owed, working, scope */}
      <Page>
        <SectionMark n={7} label="What this report does not settle" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, marginTop: 32 }}>
          <div>
            <Eyebrow tone="ink">Needs a person · {result.reviewerTasks.length}</Eyebrow>
            <Body style={{ marginTop: 10, fontSize: 15 }}>
              These cannot be settled from one page load. Each is a task, not a verdict, and none of them moves the score.
            </Body>
            <div style={{ marginTop: 18 }}>
              {result.reviewerTasks.map((task) => (
                <div key={task.criterionId} style={{ padding: '12px 0', borderTop: '1px solid var(--report-rule)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <Eyebrow>{task.criterionId}</Eyebrow>
                    <div style={{ font: t(500, 15, 22) }}>{task.criterion}</div>
                  </div>
                  <div style={{ font: t(400, 14, 21), color: 'var(--report-muted)', marginTop: 4, textWrap: 'pretty' }}>{task.task}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Eyebrow tone="ink">What the page gets right · {result.whatWorks.length}</Eyebrow>
            <Body style={{ marginTop: 10, fontSize: 15 }}>
              Measured and passed. Worth knowing before anything is changed, so a fix does not undo one of them.
            </Body>
            <div style={{ marginTop: 18 }}>
              {result.whatWorks.map((w) => (
                <div key={w.criterionId} style={{ padding: '12px 0', borderTop: '1px solid var(--report-rule)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <Eyebrow>{w.criterionId}</Eyebrow>
                    <div style={{ font: t(500, 15, 22) }}>{w.criterion}</div>
                  </div>
                  <div style={{ font: t(400, 14, 21), color: 'var(--report-muted)', marginTop: 4, textWrap: 'pretty' }}>{w.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--report-rule)' }}>
          <Eyebrow>Out of scope</Eyebrow>
          <Body style={{ marginTop: 10, maxWidth: 760, fontSize: 15 }}>
            One page, as it loads for a first-time visitor: {result.coverage.verdicts.not_applicable} criteria do not apply to a{' '}
            {result.pageType.type.replace(/_/g, ' ')} page and were left out. Flows behind a login or a submission, native iOS,
            Android and desktop criteria, and anything needing more than one page are not covered here.
          </Body>
          <div style={{ font: t(400, 12, 20, 'mono'), color: 'var(--report-muted)', marginTop: 16 }}>
            {result.provenance}
            {result.discarded > 0 ? ` · ${result.discarded} occurrence${result.discarded === 1 ? '' : 's'} dropped for incomplete evidence` : ''}
          </div>
        </div>
      </Page>

      <Page dark style={{ padding: '28px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Eyebrow>
            UX audit · {host} · {stamp}
          </Eyebrow>
          <Eyebrow>Zaudit · evidence-based</Eyebrow>
        </div>
      </Page>
    </article>
  );
}

function Key({ ink, label, outline }: { ink: string; label: string; outline?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 2, background: ink, border: outline ? '1px dashed var(--report-rule)' : '1px solid transparent' }} />
      {label}
    </span>
  );
}

/* --------------------------------------------------------- one finding */

/**
 * What a finding looks like, rather than what it reads like.
 *
 * Three kinds of picture, in the order they are worth showing: the crop of the
 * element at fault with the pin on it; a capture a probe took while the page was
 * in a state the reader cannot see for themselves (text at twice its length, the
 * dark theme on, the layout at 320px); and, for a failure that is about the
 * whole page rather than one element, the first screen as it was captured.
 */
function Exhibits({ finding, page }: { finding: Finding; page: AuditResult['screenshot'] }) {
  const captures = finding.evidence.flatMap((e) =>
    Object.entries(e.fields)
      .filter(([, v]) => typeof v === 'string' && v.startsWith('data:image/'))
      .map(([k, v]) => ({ key: `${e.evidenceId}-${k}`, src: v as string, label: k.replace(/_/g, ' ').replace(/ (capture|screenshot)$/, '') })),
  );
  const shots = finding.annotations.slice(0, 4);
  const pageLevel = !shots.length && !captures.length && finding.evidence.every((e) => e.documentLevel);
  if (!shots.length && !captures.length && !pageLevel) return null;

  const single = shots.length + captures.length + (pageLevel ? 1 : 0) === 1;

  return (
    <figure style={{ margin: '8px 0 0' }}>
      <figcaption style={{ font: t(400, 12, 20, 'mono'), letterSpacing: '0.08em', textTransform: 'uppercase', color: INK.onPaperMuted, paddingBottom: 10 }}>
        {pageLevel
          ? 'The page as measured'
          : shots.length
            ? `Where it appears · ${shots.length < finding.evidence.length ? `${shots.length} of ${finding.evidence.length}` : finding.evidence.length}`
            : 'Captured during the test'}
      </figcaption>

      <div style={{ display: 'grid', gridTemplateColumns: single ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        {shots.map((a) => (
          // The crop is its own light card; without this it would inherit the dark page's white text.
          <div key={a.evidenceId} style={{ color: '#0A0A0A' }}>
            <AnnotationShot annotation={a} />
          </div>
        ))}

        {captures.map((c) => (
          <div key={c.key} style={{ border: `1px solid ${INK.rule}`, borderRadius: radius.md, overflow: 'hidden', background: '#111' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- capture taken mid-test */}
            <img src={c.src} alt={c.label} style={{ display: 'block', width: '100%', height: 'auto' }} />
            <div style={{ font: t(400, 12, 18, 'mono'), color: INK.onPaperMuted, padding: '8px 12px', borderTop: `1px solid ${INK.rule}`, overflowWrap: 'anywhere' }}>
              {c.label}
            </div>
          </div>
        ))}

        {pageLevel && page?.data && (
          <div style={{ border: `1px solid ${INK.rule}`, borderRadius: radius.md, overflow: 'hidden', background: '#111' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- the captured first screen */}
            <img src={page.data} alt={`The first screen of the audited page, where ${finding.criterionName.toLowerCase()} was measured`} style={{ display: 'block', width: '100%', height: 'auto' }} />
            <div style={{ font: t(400, 12, 18, 'mono'), color: INK.onPaperMuted, padding: '8px 12px', borderTop: `1px solid ${INK.rule}` }}>
              First screen at 1440×900
            </div>
          </div>
        )}
      </div>

    </figure>
  );
}

function FindingPage({
  finding,
  index,
  total,
  pillar,
  page,
  distinguish,
}: {
  finding: Finding;
  index: number;
  total: number;
  pillar: string;
  page: AuditResult['screenshot'];
  /** "2 of 3", when one measurement failed in several unrelated places. */
  distinguish?: string;
}) {
  const fixLines = finding.fix.split('\n').map((l) => l.trim()).filter(Boolean);
  const [lead, ...rest] = fixLines;
  const more = finding.evidence.length - 1;

  return (
    <Page dark style={{ padding: '40px 0', scrollMarginTop: 72 }}>
      <div id={finding.criterionId} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingBottom: 14, borderBottom: `1px solid ${INK.rule}` }}>
        <Eyebrow>
          Finding {pad(index)} / {pad(total)}
        </Eyebrow>
        <Eyebrow>
          {pillar} · {finding.criterionId}
        </Eyebrow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 24, marginTop: 26 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ font: t(600, 56, 56), letterSpacing: '-0.04em', color: INK.onPaperMuted, minWidth: 72 }}>{pad(index)}</div>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <SeverityChip severity={finding.nielsen} />
            <h2 style={{ font: t(600, 'clamp(22px, 2.2vw, 30px)', 1.2), letterSpacing: '-0.025em', margin: '12px 0 0', color: INK.onPaper }}>
              {finding.checkName}
              {distinguish && <span style={{ color: INK.onPaperMuted }}> · {distinguish}</span>}
            </h2>
            {/* One line of provenance, where five fields used to be. */}
            <div style={{ font: t(400, 12, 20, 'mono'), color: INK.onPaperMuted, marginTop: 8 }}>
              {finding.criterionName} · {finding.standard} · {finding.evidence.length} {finding.evidence.length === 1 ? 'place' : 'places'} · {finding.effort} fix
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
          <div>
            <Eyebrow>Problem</Eyebrow>
            <Body style={{ marginTop: 8 }}>
              {tidy(finding.evidence[0]?.observed ?? '')}
              {more > 0 ? ` …and in ${more} other ${more === 1 ? 'place' : 'places'}.` : ''}
            </Body>
          </div>

          <div>
            <Eyebrow>Solution</Eyebrow>
            <Body style={{ marginTop: 8 }}>{tidy(lead)}</Body>
            {rest.length > 0 && (
              <ul style={{ margin: '8px 0 0', padding: '0 0 0 16px' }}>
                {rest.slice(0, 3).map((line) => (
                  <li key={line} style={{ font: t(400, 14, 22), color: INK.onPaperMuted, textWrap: 'pretty', marginTop: 4 }}>
                    {tidy(line)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Exhibits finding={finding} page={page} />
      </div>
    </Page>
  );
}

/** Kept for the summary card on the homepage, which still uses the product palette. */
export const REPORT_INK = { ...INK, pageBg: color.bg };
