import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { AuditUrlBox, Band, PageHero, cardBody, cols, frame, textLink } from '@/components/site/PageKit';
import { CHECKLIST, type Coverage, type Criterion } from '@/content/accessibility-checklist';
import { pageMetadata } from '@/lib/page-meta';

/*
 * `/accessibility-checklist`: every WCAG 2.2 Level A and AA success criterion,
 * grouped by principle, each marked by how much of it ProCurveUX measures. The
 * data and its sources are in content/accessibility-checklist.ts.
 */

const TITLE = 'WCAG 2.2 AA accessibility checklist for websites | ProCurveUX';
const DESCRIPTION =
  'All 55 WCAG 2.2 Level A and AA success criteria in plain English, grouped by principle, with what an automated audit can check and what needs a person.';

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: '/accessibility-checklist' });

const COVERAGE: Record<Coverage, { label: string; bg: string; fg: string }> = {
  auto: { label: 'Checked automatically', bg: '#E6F4EA', fg: '#1E6B34' },
  partial: { label: 'Partly automatic', bg: '#E8F0FE', fg: 'var(--accent-fg)' },
  manual: { label: 'Needs a person', bg: '#F1F3F6', fg: 'var(--ink-secondary)' },
};

const ALL = CHECKLIST.flatMap((p) => p.items);
const count = (c: Coverage) => ALL.filter((i) => i.auto === c).length;
const chip = { padding: '2px 8px', borderRadius: '4px', font: '600 12px/18px var(--font-sans)', whiteSpace: 'nowrap' } as const;

function Row({ item }: { item: Criterion }) {
  const cov = COVERAGE[item.auto];
  return (
    <li style={{ padding: '20px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '8px 24px' }}>
      <span style={{ flex: '0 0 56px', font: '700 15px/24px var(--font-sans)', color: 'var(--accent-fg)', fontVariantNumeric: 'tabular-nums' }}>{item.num}</span>
      <span style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <span style={{ font: '700 16px/24px var(--font-sans)', color: 'var(--ink)' }}>{item.name}</span>
          <span style={{ ...chip, border: '1px solid var(--border-strong)', color: 'var(--ink-secondary)' }}>Level {item.level}</span>
          {item.isNew && <span style={{ ...chip, background: '#FFF4E5', color: '#8A4B00' }}>New in 2.2</span>}
        </span>
        <span style={{ font: '400 15px/24px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' }}>{item.text}</span>
        {item.rules && item.rules.length > 0 && (
          <span style={{ font: '400 13px/20px var(--font-sans)', color: 'var(--ink-muted)' }}>ProCurveUX checks: {item.rules.join(' · ')}</span>
        )}
      </span>
      <span style={{ flex: '0 0 auto', ...chip, background: cov.bg, color: cov.fg }}>{cov.label}</span>
    </li>
  );
}

export default function AccessibilityChecklistPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav />

      <main id="main">
        <PageHero
          label="Resources · Accessibility"
          title="The WCAG 2.2 AA checklist,"
          accent="in plain English."
          intro={`All ${ALL.length} Level A and AA success criteria in WCAG 2.2, grouped by the four principles. Each one says what it asks for, and whether ProCurveUX checks it automatically or it needs a person to test.`}
          trail={[{ name: 'Accessibility checklist', path: '/accessibility-checklist' }]}
        />

        {/* at a glance */}
        <section aria-label="Checklist at a glance">
          <div style={frame}>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              {[
                [String(ALL.length), 'success criteria at A and AA'],
                [String(count('auto')), 'checked automatically'],
                [String(count('partial')), 'partly automatic'],
                [String(count('manual')), 'need a person'],
              ].map(([v, l]) => (
                <div key={l} style={{ padding: '28px 20px 28px 0', display: 'flex', flexDirection: 'column-reverse', justifyContent: 'flex-end', gap: '8px' }}>
                  <dt style={{ font: '400 15px/22px var(--font-sans)', color: 'var(--ink-muted)' }}>{l}</dt>
                  <dd style={{ margin: 0, font: '500 clamp(36px, 3.6vw, 52px)/1 var(--font-sans)', letterSpacing: '-0.035em', color: 'var(--ink)' }}>{v}</dd>
                </div>
              ))}
            </dl>
            <nav aria-label="Principles" style={{ marginTop: '32px' }}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CHECKLIST.map((p) => (
                  <li key={p.id}>
                    <a href={`#${p.id}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: '0 14px', border: '1px solid var(--border)', borderRadius: '4px', background: '#FFFFFF', font: '500 14px/20px var(--font-sans)', color: 'var(--ink)' }}>
                      {p.name} ({p.items.length})
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>

        {CHECKLIST.map((p, i) => (
          <Band key={p.id} id={p.id} label={`Principle ${i + 1} of 4`} title={p.name} intro={p.summary} tint={i % 2 === 0}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', borderTop: '1px solid var(--border)' }}>
              {p.items.map((item) => (
                <Row key={item.num} item={item} />
              ))}
            </ul>
          </Band>
        ))}

        <Band id="notes" label="Before you rely on it" title="What this checklist is, and isn’t.">
          <div style={cols(300, 32)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, font: '700 18px/26px var(--font-sans)' }}>Automated checks are a first pass</h3>
              <p style={{ ...cardBody, fontSize: '16px', lineHeight: '28px' }}>
                Software can measure contrast, target sizes, labels and page structure. It cannot tell whether alt text is accurate, whether captions match the audio, or whether a form makes sense with a screen reader. Most criteria above need a person for at least part of the test.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, font: '700 18px/26px var(--font-sans)' }}>Not a legal certification</h3>
              <p style={{ ...cardBody, fontSize: '16px', lineHeight: '28px' }}>
                Passing ProCurveUX’s checks does not certify a site as accessible or compliant with any law. For why that matters, see{' '}
                <a href="/blog/ada-website-lawsuit-statistics" style={textLink}>
                  what the ADA website lawsuit numbers show
                </a>
                .
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, font: '700 18px/26px var(--font-sans)' }}>What’s left out</h3>
              <p style={{ ...cardBody, fontSize: '16px', lineHeight: '28px' }}>
                Level AAA criteria are not listed. 4.1.1 Parsing is also left out: WCAG 2.2 marks it obsolete and removed. The full standard is at{' '}
                <a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noopener noreferrer" style={textLink}>
                  w3.org/TR/WCAG22
                </a>
                .
              </p>
            </div>
          </div>
        </Band>

        <AuditUrlBox title="Find the accessibility failures a machine can catch, in a minute." />
      </main>

      <SiteFooter />
    </div>
  );
}
