import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { AuthorPhoto, BlogCard } from '@/components/blog/BlogCard';
import { ClosingCta } from '@/components/home/ClosingCta';
import { Contact } from '@/components/report/Contact';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { AUTHORS, POSTS } from '@/content/blog';
import { PILLARS } from '@/lib/audit/catalog/pillars';

/*
 * `/about`: who makes ProCurveUX, how an audit works and what it stands on.
 *
 * Every claim here is one the site already makes or the engine already does:
 * the numbers are the approved homepage copy (120+ rules, about 60 seconds a
 * page), the eleven areas are read straight from the audit's own PILLARS, and
 * the example finding is the real ACC-001 contrast rule with sample values.
 * Keep it that way: change the engine or the copy deck first, then this page.
 *
 * TODO(content): confirm with Babar that "built by the team at ZeeFrames" is
 * how he wants the company described.
 */

const DESCRIPTION =
  'ProCurveUX is an automated UX audit for live websites, built by product designers at ZeeFrames. Here is how it works, what it checks and what it will not pretend to know.';

export const metadata: Metadata = {
  title: 'About ProCurveUX | Automated UX audits, built by designers',
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: { title: 'About ProCurveUX', description: DESCRIPTION, url: '/about', type: 'website', siteName: 'ProCurveUX' },
  twitter: { card: 'summary_large_image', title: 'About ProCurveUX', description: DESCRIPTION },
};

const gutter = 'clamp(16px, 5.56vw, 80px)';
const frame = { maxWidth: '1440px', margin: '0 auto', padding: `0 ${gutter}` } as const;
const eyebrow = { font: '600 11px/16px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-fg)' } as const;
const h2: CSSProperties = { margin: 0, maxWidth: '760px', font: '800 clamp(30px, 3.4vw, 46px)/1.1 var(--font-sans)', letterSpacing: '-0.03em', textWrap: 'balance' };
const lead: CSSProperties = { margin: 0, maxWidth: '640px', font: '400 17px/29px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' };
const card: CSSProperties = { padding: '28px', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' };
const cardTitle: CSSProperties = { margin: 0, font: '700 19px/26px var(--font-sans)', letterSpacing: '-0.015em', color: 'var(--ink)', textWrap: 'balance' };
const cardBody: CSSProperties = { margin: 0, font: '400 15px/25px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' };
/** Columns that fold to one on a phone without a media query. */
const cols = (min: number): CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`, gap: '20px' });
const gradientText: CSSProperties = { background: 'linear-gradient(100deg, #2BC8E8 0%, var(--blue) 45%, #7F8CFF 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

/** One band of the page: an eyebrow, a heading, an optional lead, then whatever the section holds. */
function Band({ id, label, title, intro, tint = false, children }: { id: string; label: string; title: ReactNode; intro?: ReactNode; tint?: boolean; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} style={{ background: tint ? 'var(--bg-subtle)' : 'var(--bg)', borderTop: tint ? '1px solid var(--border)' : undefined, borderBottom: tint ? '1px solid var(--border)' : undefined }}>
      <div style={{ ...frame, paddingTop: 'clamp(64px, 8vw, 112px)', paddingBottom: 'clamp(64px, 8vw, 112px)', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={eyebrow}>{label}</span>
          <h2 id={`${id}-h`} style={h2}>
            {title}
          </h2>
          {intro && <p style={lead}>{intro}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

/** 24px line icons in the accent colour. Decorative: every one sits beside its words. */
const ICON_PATHS: Record<string, ReactNode> = {
  evidence: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </>
  ),
  gauge: <path d="M4 15a8 8 0 1 1 16 0M12 15l4-5" />,
  wrench: <path d="M14.5 5.5a4 4 0 0 0-5 5L4 16v4h4l5.5-5.5a4 4 0 0 0 5-5L16 12l-4-4 2.5-2.5Z" />,
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  stop: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>
  ),
  plug: <path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v4" />,
  rocket: <path d="M5 19c0-3 1-5 3-6l3 3c-1 2-3 3-6 3ZM9 13l6-6c2-2 4-3 6-3 0 2-1 4-3 6l-6 6M15 9h.01" />,
  pen: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17l9 5 9-5" />,
  team: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 14a6 6 0 0 1 3 6" />
    </>
  ),
};
function Glyph({ name }: { name: keyof typeof ICON_PATHS }) {
  return (
    <span aria-hidden="true" style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--blue-tint)', border: '1px solid #D6E4FB', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {ICON_PATHS[name]}
      </svg>
    </span>
  );
}

function Tick({ no = false }: { no?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={no ? 'var(--ink-muted)' : 'var(--accent-fg)'} strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: '4px' }}>
      {no ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="m5 12 4.5 4.5L19 7" />}
    </svg>
  );
}

/* ------------------------------------------------------------------ content */

const STATS = [
  { value: '120+', label: 'rules checked on every page' },
  { value: '~60s', label: 'to audit one page' },
  { value: String(PILLARS.length), label: 'areas of the experience reviewed' },
  { value: '2', label: 'viewports, desktop and mobile' },
  { value: '0', label: 'scripts or plugins to install' },
];

const GAP = [
  { n: '01', title: 'Analytics', body: 'Show what happened: conversions dropped, people left the flow.', answer: 'What' },
  { n: '02', title: 'Heatmaps and recordings', body: 'Show where people struggled, once you have installed a script and collected traffic.', answer: 'Where' },
  { n: '03', title: 'ProCurveUX', body: 'Checks the page itself and tells you why: the element, the rule it breaks and the change that fixes it.', answer: 'Why', emphasis: true },
];

const BELIEFS: { icon: keyof typeof ICON_PATHS; title: string; body: string }[] = [
  { icon: 'evidence', title: 'Evidence over opinion', body: 'Every finding points at a specific element on your page, with a screenshot and the measurement that triggered it. No finding is a hunch.' },
  { icon: 'gauge', title: 'Say how sure we are', body: 'Severity and confidence are scored separately. A serious problem we are unsure about is labelled that way, so you can decide what to trust.' },
  { icon: 'wrench', title: 'A fix with every problem', body: '"Improve contrast" is not a fix. Each finding comes with the specific change to make, written so a developer can ship it without a meeting.' },
  { icon: 'stop', title: 'Know when not to flag', body: 'Rules carry their own exceptions. A disabled button, a logo or a decorative image is not reported as a contrast failure, because it is not one.' },
  { icon: 'eye', title: 'Honest about limits', body: 'Brand fit, copy tone and complex flows need a person. We mark those "needs manual review" and give you a short checklist, rather than guess.' },
  { icon: 'plug', title: 'Nothing to install', body: 'No script, no snippet, no extension. ProCurveUX views your site from the outside, the way a visitor would, so you get answers on day one.' },
];

const STEPS = [
  { n: '01', title: 'Paste a URL', body: 'Any public page: yours, a client’s or a competitor’s. Tell us the goal of the page so fixes are ranked for it.' },
  { n: '02', title: 'We load it in a real browser', body: 'At desktop and mobile sizes. We interact with it the way a visitor would, instead of judging a screenshot.' },
  { n: '03', title: 'We check every rule', body: 'Contrast, tap targets, labels, heading structure, layout shift, CTA prominence and more, each measured against its standard.' },
  { n: '04', title: 'You get a ranked report', body: 'Findings ordered by impact and effort, each with evidence and a fix. Export it as a PDF and send it to your team or client.' },
];

const STANDARDS = [
  { name: 'WCAG 2.2 AA', body: 'The W3C accessibility guidelines most laws and lawsuits refer to.' },
  { name: "Nielsen's 10 usability heuristics", body: 'The most widely used checklist for usability reviews.' },
  { name: 'ISO 9241-11', body: 'The international definition of usability: effective, efficient, satisfying.' },
  { name: 'Gestalt principles', body: 'How people group and read what they see on a screen.' },
  { name: 'Core Web Vitals', body: 'Google’s measures of loading, responsiveness and visual stability.' },
  { name: 'Apple HIG and Material Design', body: 'Platform guidance on navigation, touch targets and accessibility.' },
  { name: 'Dark-pattern research', body: 'What separates persuasion from manipulation in consent and checkout.' },
  { name: 'Lighthouse', body: 'For the optional technical checks: security, metadata and broken links.' },
];

const DOES = [
  'Finds and documents the measurable problems on a page in about a minute',
  'Ties every finding to an element, a screenshot and a standard',
  'Ranks fixes by impact and effort for the goal of the page',
  'Audits any public URL, including competitors and prospects',
  'Exports a shareable PDF, including on the free audit',
];
const DOESNT = [
  'Replace user research, usability testing or design judgement',
  'Log in, submit forms or get past access controls',
  'Audit pages behind a login yet (use a public staging URL)',
  'Pretend to judge brand fit or tone: those are left for a person',
  'Need a tracking script, so it cannot see your real traffic',
];

const AUDIENCES: { icon: keyof typeof ICON_PATHS; who: string; body: string }[] = [
  { icon: 'rocket', who: 'Founders', body: 'Find what is costing you signups, in plain language, and know what to ask a designer for.' },
  { icon: 'pen', who: 'Designers', body: 'Start every review with the basics already covered, and bring evidence to the redesign you proposed.' },
  { icon: 'layers', who: 'Agencies', body: 'Produce client-ready audits in minutes, for clients and for prospects before the first call.' },
  { icon: 'team', who: 'Product teams', body: 'Re-audit after each release so fixed problems stay fixed and new ones are caught early.' },
];

/* -------------------------------------------------------------------- page */

export default function AboutPage() {
  const founder = { id: 'muhammad-babar' as const, ...AUTHORS['muhammad-babar'] };
  const latest = POSTS.slice(0, 3);
  const areas = PILLARS;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav current="about" />

      <main id="main">
        {/* 1. hero */}
        <section aria-labelledby="about-h">
          <div style={{ ...frame, paddingTop: '96px', paddingBottom: '72px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <span style={eyebrow}>About ProCurveUX</span>
            <h1 id="about-h" style={{ margin: 0, maxWidth: '1000px', font: '800 clamp(40px, 5vw, 72px)/1.04 var(--font-sans)', letterSpacing: '-0.035em', textWrap: 'balance' }}>
              <span style={{ display: 'block' }}>A UX review in a minute,</span> <span style={{ display: 'block', ...gradientText }}>built by product designers.</span>
            </h1>
            <p style={{ ...lead, fontSize: '19px', lineHeight: '31px', maxWidth: '680px' }}>
              ProCurveUX loads your website in a real browser, checks it against 120+ UX, design and accessibility rules, and tells you what is costing you customers, why, and exactly how to fix it.
            </p>
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <a href="/?audit=1" data-cta="primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)', color: '#FFFFFF', font: '600 14px/20px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 24px', borderRadius: '2px' }}>
                Analyze my website
              </a>
              <a href="/report/sample" data-cta="secondary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', font: '600 14px/20px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 24px', borderRadius: '2px', boxShadow: 'inset 0 0 0 1px var(--border-strong)' }}>
                View a sample report
              </a>
            </div>
          </div>
        </section>

        {/* 2. at a glance */}
        <section aria-label="ProCurveUX at a glance">
          <div style={frame}>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 128px), 1fr))', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              {/* Number above label visually, label first for a screen reader: column-reverse, pinned to the top. */}
              {STATS.map((s) => (
                <div key={s.label} style={{ padding: '32px 20px 32px 0', display: 'flex', flexDirection: 'column-reverse', justifyContent: 'flex-end', gap: '8px' }}>
                  <dt style={{ font: '400 15px/22px var(--font-sans)', color: 'var(--ink-muted)' }}>{s.label}</dt>
                  <dd style={{ margin: 0, font: '800 clamp(36px, 3.6vw, 52px)/1 var(--font-sans)', letterSpacing: '-0.035em', color: 'var(--ink)' }}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 3. why we built it */}
        <Band
          id="why"
          label="Why we built it"
          title="Your tools tell you what went wrong. Not why."
          intro="A proper UX review has always meant a designer going through a site by hand, which takes days and costs more than most teams can spend on every release. We automated the measurable half of that review, so the hours a person spends go on the half that needs judgement."
        >
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', ...cols(210) }}>
            {GAP.map((g) => (
              <li key={g.n} style={{ ...card, background: g.emphasis ? 'var(--ink)' : '#FFFFFF', color: g.emphasis ? '#FFFFFF' : 'var(--ink)', borderColor: g.emphasis ? 'var(--ink)' : 'var(--border)' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{ font: '600 13px/18px var(--font-sans)', color: g.emphasis ? '#7FB2FF' : 'var(--ink-muted)' }}>{g.n}</span>
                  <span style={{ font: '800 28px/1 var(--font-sans)', letterSpacing: '-0.03em', ...(g.emphasis ? gradientText : { color: 'var(--ink-muted)' }) }}>{g.answer}?</span>
                </span>
                <h3 style={{ ...cardTitle, color: 'inherit' }}>{g.title}</h3>
                <p style={{ ...cardBody, color: g.emphasis ? '#C9CDD4' : 'var(--ink-secondary)' }}>{g.body}</p>
              </li>
            ))}
          </ol>
        </Band>

        {/* 4. what we believe */}
        <Band id="principles" label="What we believe" title="Six rules we hold every finding to." tint>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', ...cols(300) }}>
            {BELIEFS.map((b) => (
              <li key={b.title} style={card}>
                <Glyph name={b.icon} />
                <h3 style={{ ...cardTitle, marginTop: '8px' }}>{b.title}</h3>
                <p style={cardBody}>{b.body}</p>
              </li>
            ))}
          </ul>
        </Band>

        {/* 5. how an audit works */}
        <Band id="how" label="How an audit works" title="From a URL to a ranked list of fixes." intro="There is nothing to set up. The whole audit runs from the outside, on the page your visitors see.">
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', ...cols(240), gap: '0' }}>
            {STEPS.map((s, i) => (
              <li key={s.n} style={{ padding: '28px 28px 28px 0', borderTop: '2px solid', borderColor: i === 0 ? 'var(--blue)' : 'var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ font: '700 14px/20px var(--font-sans)', color: 'var(--accent-fg)' }}>{s.n}</span>
                <h3 style={cardTitle}>{s.title}</h3>
                <p style={cardBody}>{s.body}</p>
              </li>
            ))}
          </ol>
        </Band>

        {/* 6. what we check */}
        <Band
          id="coverage"
          label="What we check"
          title={`${areas.length} areas, each with one question to answer.`}
          intro="These are the areas the audit engine itself is organised around. Technical quality, trust and conversion are switched on when the goal you choose calls for them."
          tint
        >
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', ...cols(320), gap: '12px' }}>
            {areas.map((p, i) => (
              <li key={p.id} style={{ ...card, padding: '20px 24px', flexDirection: 'row', alignItems: 'flex-start', gap: '16px' }}>
                <span style={{ flexShrink: 0, width: '32px', font: '700 14px/24px var(--font-sans)', color: 'var(--accent-fg)' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ ...cardTitle, font: '700 16px/24px var(--font-sans)' }}>
                    {p.name}
                    {p.optional && <span style={{ marginLeft: '8px', font: '500 12px/18px var(--font-sans)', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>by goal</span>}
                  </h3>
                  <p style={{ ...cardBody, fontSize: '14px', lineHeight: '22px' }}>{p.question}</p>
                </span>
              </li>
            ))}
          </ol>
        </Band>

        {/* 7. standards */}
        <Band id="standards" label="What it stands on" title="Published standards, not our taste." intro="Each rule names the standard it comes from, and the report quotes it, so you can check our reasoning or show it to someone who disagrees.">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', ...cols(250), gap: '0', borderTop: '1px solid var(--border)' }}>
            {STANDARDS.map((s) => (
              <li key={s.name} style={{ padding: '22px 24px 22px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ font: '700 16px/24px var(--font-sans)', color: 'var(--ink)' }}>{s.name}</span>
                <span style={{ font: '400 14px/22px var(--font-sans)', color: 'var(--ink-muted)', textWrap: 'pretty' }}>{s.body}</span>
              </li>
            ))}
          </ul>
        </Band>

        {/* 8. anatomy of a finding */}
        <Band id="finding" label="Anatomy of a finding" title="What you actually get back." intro="Here is one finding, written the way the report writes it. The rule is real; the colours are an example." tint>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '40px', alignItems: 'start' }}>
            <article aria-label="Example finding" style={{ ...card, padding: 0, gap: 0, overflow: 'hidden', boxShadow: '0 12px 32px rgba(20, 40, 90, 0.08)' }}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '14px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    ['Severity', 'High'],
                    ['Confidence', '95%+'],
                    ['Effort', 'Trivial'],
                  ].map(([k, v]) => (
                    <span key={k} style={{ padding: '4px 10px', borderRadius: '4px', background: k === 'Severity' ? '#FDECEC' : 'var(--bg-subtle)', color: k === 'Severity' ? '#A4221B' : 'var(--ink-secondary)', font: '600 12px/18px var(--font-sans)' }}>
                      {k}: {v}
                    </span>
                  ))}
                </span>
                <h3 style={{ ...cardTitle, fontSize: '21px', lineHeight: '28px' }}>Body text contrast below minimum</h3>
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '4px', background: '#FFFFFF', font: '400 15px/22px var(--font-sans)', color: '#8A8F98' }}>Free shipping on orders over $50</span>
                  <span style={{ font: '600 14px/20px var(--font-sans)', color: 'var(--ink-secondary)', whiteSpace: 'nowrap' }}>3.2:1, needs 4.5:1</span>
                </span>
              </div>
              <dl style={{ margin: 0, padding: '8px 28px 24px' }}>
                {[
                  ['Where', <code key="w" style={{ font: '500 13px/20px var(--font-mono, ui-monospace, monospace)' }}>.promo-bar p</code>],
                  ['Why it matters', 'Low-contrast text is unreadable in sunlight, on low-end screens, and for the roughly 8% of people with reduced colour vision.'],
                  ['Based on', 'WCAG 2.2 success criterion 1.4.3, Contrast (Minimum)'],
                  ['Fix', 'Darken #8A8F98 to #6B7280, which reaches 4.8:1 against #FFFFFF. Do not fix it by making the text bolder alone.'],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <dt style={{ font: '600 12px/18px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{k}</dt>
                    <dd style={{ margin: 0, font: '400 15px/24px var(--font-sans)', color: 'var(--ink)' }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </article>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                ['Severity, from critical to low', 'How much the problem hurts the people using the page.'],
                ['Confidence, stated separately', 'How sure the measurement is. Judgement calls are never dressed up as facts.'],
                ['Impact and effort', 'So the quick, high-value fixes rise to the top of the list.'],
                ['A written fix', 'The exact change, with values, that a developer can ship as it is.'],
              ].map(([k, v]) => (
                <li key={k} style={{ display: 'flex', gap: '14px' }}>
                  <Tick />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ font: '700 17px/26px var(--font-sans)', color: 'var(--ink)' }}>{k}</span>
                    <span style={cardBody}>{v}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Band>

        {/* 9. what it is and isn't */}
        <Band id="limits" label="What it is, and what it isn't" title="A thorough first pass, not a final verdict.">
          <div style={cols(380)}>
            {[
              { title: 'ProCurveUX does', items: DOES, no: false },
              { title: 'ProCurveUX does not', items: DOESNT, no: true },
            ].map((col) => (
              <div key={col.title} style={{ ...card, gap: '18px', background: col.no ? 'var(--bg-subtle)' : '#FFFFFF' }}>
                <h3 style={cardTitle}>{col.title}</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {col.items.map((it) => (
                    <li key={it} style={{ display: 'flex', gap: '12px', font: '400 15px/25px var(--font-sans)', color: 'var(--ink-secondary)' }}>
                      <Tick no={col.no} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Band>

        {/* 10. who it's for */}
        <Band id="audience" label="Who it's for" title="For anyone who has to answer “why isn’t this converting?”" tint>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', ...cols(240) }}>
            {AUDIENCES.map((a) => (
              <li key={a.who} style={card}>
                <Glyph name={a.icon} />
                <h3 style={{ ...cardTitle, marginTop: '8px' }}>{a.who}</h3>
                <p style={cardBody}>{a.body}</p>
              </li>
            ))}
          </ul>
        </Band>

        {/* 11. the team */}
        <Band
          id="team"
          label="Who makes it"
          title={
            <>
              Built by the design team at{' '}
              <a href="https://zeeframes.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '6px', textDecorationThickness: '2px' }}>
                ZeeFrames
              </a>
              .
            </>
          }
          intro="ZeeFrames is a digital design agency in Lahore that designs SaaS, fintech and AI products for teams in the US, the UK, the Gulf and Australia."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '20px' }}>
            <a href={`/blog/author/${founder.id}`} style={{ ...card, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: '20px', color: 'inherit' }}>
              <AuthorPhoto author={founder} size={88} />
              <span style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                <span style={{ font: '700 20px/28px var(--font-sans)', letterSpacing: '-0.015em', color: 'var(--ink)' }}>{founder.name}</span>
                <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--accent-fg)' }}>{founder.role}</span>
                <span style={{ ...cardBody, marginTop: '6px' }}>
                  More than eight years designing SaaS, fintech and AI products, and over 300 projects across more than 20 industries.
                </span>
                <span style={{ marginTop: '6px', font: '600 14px/20px var(--font-sans)', color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Read his profile</span>
              </span>
            </a>
            <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', alignContent: 'center', gap: '16px' }}>
              {[
                ['8+', 'years designing products'],
                ['300+', 'projects delivered'],
                ['20+', 'industries'],
              ].map(([v, l]) => (
                <span key={l} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ font: '800 clamp(28px, 3vw, 40px)/1 var(--font-sans)', letterSpacing: '-0.03em', ...gradientText }}>{v}</span>
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--ink-muted)' }}>{l}</span>
                </span>
              ))}
            </div>
          </div>
        </Band>

        {/* 12. data */}
        <Band id="data" label="Your data" title="We look at your site. We don't keep watching it." tint>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', ...cols(240) }}>
            {[
              ['Only what a visitor sees', 'We view public pages the way a normal visitor would. We never log in, submit forms or bypass access controls.'],
              ['Stored so you can compare', 'We keep the URL, screenshots and findings so you can view your reports and compare them over time.'],
              ['Yours to delete', 'You can delete any report at any time.'],
              ['Never sold, never trained on', "We don't sell your data, and we don't use your reports to train AI models."],
            ].map(([k, v]) => (
              <li key={k} style={card}>
                <h3 style={cardTitle}>{k}</h3>
                <p style={cardBody}>{v}</p>
              </li>
            ))}
          </ul>
        </Band>

        {/* 13. from the blog */}
        <Band id="writing" label="From the blog" title="What we've learned from auditing websites.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '40px 32px' }}>
            {latest.map((p) => (
              <div key={p.slug} style={{ display: 'flex' }}>
                <BlogCard post={p} />
              </div>
            ))}
          </div>
          <a href="/blog" style={{ alignSelf: 'flex-start', font: '600 15px/22px var(--font-sans)', color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: '3px', padding: '6px 0' }}>
            All articles
          </a>
        </Band>

        {/* 14. talk to us, then the closing statement */}
        <Contact />
        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}
