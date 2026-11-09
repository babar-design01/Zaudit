import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { AuditUrlBox, Band, JsonLd, PageHero, card, cardBody, cardTitle, cols, textLink } from '@/components/site/PageKit';
import { UX_LAWS, type UxLaw } from '@/content/ux-laws';
import { SITE, pageMetadata } from '@/lib/page-meta';

/*
 * `/ux-laws`: a hub with one card per law. Each card carries its slug as its id,
 * so a card can grow into /ux-laws/[slug] later without changing any link.
 * What each card says ProCurveUX checks comes from content/ux-laws.ts, which
 * names only rules that exist in the audit catalog.
 */

const TITLE = 'UX laws explained: 10 principles behind usable websites | ProCurveUX';
const DESCRIPTION =
  "Fitts's law, Hick's law, Jakob's law and seven more, each with a one-line definition, a real website example and how ProCurveUX checks for it.";

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: '/ux-laws' });

const itemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'UX laws explained',
  itemListElement: UX_LAWS.map((law, i) => ({ '@type': 'ListItem', position: i + 1, name: law.name, url: `${SITE}/ux-laws#${law.slug}` })),
};

const KIND: Record<UxLaw['check']['kind'], { label: string; bg: string; fg: string }> = {
  automatic: { label: 'Checked automatically', bg: '#E6F4EA', fg: '#1E6B34' },
  partial: { label: 'Partly automatic', bg: '#E8F0FE', fg: 'var(--accent-fg)' },
  manual: { label: 'Needs a person', bg: 'var(--bg-subtle)', fg: 'var(--ink-secondary)' },
};

const label = { font: '600 12px/18px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-muted)' } as const;

function LawCard({ law, n }: { law: UxLaw; n: number }) {
  const kind = KIND[law.check.kind];
  return (
    <li id={law.slug} style={{ ...card, gap: '16px', scrollMarginTop: '96px' }}>
      <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ font: '700 14px/20px var(--font-sans)', color: 'var(--accent-fg)' }}>{String(n).padStart(2, '0')}</span>
        <span style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--ink-muted)', textAlign: 'right' }}>{law.origin}</span>
      </span>
      <h3 style={{ ...cardTitle, fontSize: '22px', lineHeight: '29px' }}>{law.name}</h3>
      <p style={{ ...cardBody, color: 'var(--ink)', fontSize: '16px', lineHeight: '26px' }}>{law.definition}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={label}>On a website</span>
        <p style={cardBody}>{law.example}</p>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={label}>How ProCurveUX checks it</span>
          <span style={{ padding: '2px 8px', borderRadius: '4px', background: kind.bg, color: kind.fg, font: '600 12px/18px var(--font-sans)' }}>{kind.label}</span>
        </span>
        {law.check.rules.length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {law.check.rules.map((r) => (
              <li key={r} style={{ padding: '3px 10px', border: '1px solid #D6E4FB', borderRadius: '4px', background: '#FFFFFF', font: '500 13px/20px var(--font-sans)', color: 'var(--ink)' }}>
                {r}
              </li>
            ))}
          </ul>
        )}
        <p style={{ ...cardBody, fontSize: '14px', lineHeight: '22px' }}>{law.check.note}</p>
      </div>
    </li>
  );
}

export default function UxLawsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav />
      <JsonLd data={itemList} />

      <main id="main">
        <PageHero
          label="Resources · UX laws"
          title="UX laws explained."
          accent="Ten principles, tested on real pages."
          intro="Each law here comes from research into how people see, decide and remember. For every one: what it says, what breaking it looks like on a website, and whether ProCurveUX can measure it or a person has to judge it."
          trail={[{ name: 'UX laws explained', path: '/ux-laws' }]}
        >
          <nav aria-label="Laws on this page" style={{ marginTop: '8px' }}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {UX_LAWS.map((law) => (
                <li key={law.slug}>
                  <a href={`#${law.slug}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: '0 14px', border: '1px solid var(--border)', borderRadius: '4px', background: '#FFFFFF', font: '500 14px/20px var(--font-sans)', color: 'var(--ink)' }}>
                    {law.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </PageHero>

        <Band
          id="laws"
          label="The ten laws"
          title="What each law says, and how we check it."
          intro="A law is only as useful as the change it leads to. Where an automatic check exists, the card names it exactly as it appears in a ProCurveUX report."
          tint
        >
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', ...cols(340) }}>
            {UX_LAWS.map((law, i) => (
              <LawCard key={law.slug} law={law} n={i + 1} />
            ))}
          </ol>
        </Band>

        <Band id="limits" label="A word of caution" title="Laws are evidence, not commandments.">
          <div style={{ ...cols(300, 32) }}>
            <p style={{ ...cardBody, fontSize: '16px', lineHeight: '28px' }}>
              Most of these laws come from lab studies of reaction time and memory. They predict tendencies, not what every visitor will do. Use them to explain a problem you can see, not to win an argument about one you can’t.
            </p>
            <p style={{ ...cardBody, fontSize: '16px', lineHeight: '28px' }}>
              When a law is marked “Needs a person”, ProCurveUX lists it in the report as a manual review item rather than guessing. For accessibility rules, see the{' '}
              <a href="/accessibility-checklist" style={textLink}>
                WCAG 2.2 checklist
              </a>
              , and for the reasoning behind the audit, read{' '}
              <a href="/blog/automated-ux-audit" style={textLink}>
                what an automated UX audit can really catch
              </a>
              .
            </p>
          </div>
        </Band>

        <AuditUrlBox title="See which of these laws your site breaks." />
      </main>

      <SiteFooter />
    </div>
  );
}
