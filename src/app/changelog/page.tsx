import { AuditUrlBox, PageHero, frame } from '@/components/site/PageKit';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import data from '@/content/changelog.json';
import { pageMetadata } from '@/lib/page-meta';

export const metadata = pageMetadata({
  title: 'Changelog | What’s new in ProCurveUX',
  description: 'Every ProCurveUX release, newest first: new checks, report changes, pages and fixes.',
  path: '/changelog',
});

type Entry = { date: string; title: string; items: string[] };

const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * `/changelog`: release notes read from `src/content/changelog.json`, so a new
 * entry needs no code. Sorted here, newest first, whatever order the file is in.
 */
export default function ChangelogPage() {
  const entries = [...(data.entries as Entry[])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav />
      <main id="main">
        <PageHero label="Changelog" title="What’s new" accent="in ProCurveUX." intro="Every release, newest first: new checks, changes to the report, and fixes." trail={[{ name: 'Changelog', path: '/changelog' }]} />

        <section aria-label="Releases">
          <ol style={{ ...frame, marginTop: 0, marginBottom: 0, paddingBottom: '112px', listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
            {entries.map((e) => (
              <li key={e.date + e.title} id={`release-${e.date}`} data-release style={{ padding: '40px 0', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '12px 48px', scrollMarginTop: '96px' }}>
                <time dateTime={e.date} style={{ flex: '0 0 200px', font: '600 15px/24px var(--font-sans)', color: 'var(--accent-fg)' }}>
                  {longDate(e.date)}
                </time>
                <div style={{ flex: '1 1 420px', minWidth: 0, maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h2 style={{ margin: 0, font: '800 clamp(22px, 2.2vw, 28px)/1.2 var(--font-sans)', letterSpacing: '-0.02em' }}>{e.title}</h2>
                  <ul style={{ margin: 0, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '10px', font: '400 16px/27px var(--font-sans)', color: 'var(--ink-secondary)' }}>
                    {e.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <AuditUrlBox />
      </main>
      <SiteFooter />
    </div>
  );
}
