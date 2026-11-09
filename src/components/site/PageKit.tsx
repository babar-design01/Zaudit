import type { CSSProperties, ReactNode } from 'react';
import { breadcrumbJsonLd } from '@/lib/page-meta';

/*
 * The pieces every content page is built from: About, Contact, the legal pages,
 * the Help centre and the resource pages. Same type scale, colours and spacing
 * as the homepage and the blog, so a new page cannot drift from them.
 */

export const gutter = 'clamp(16px, 5.56vw, 80px)';
export const frame = { maxWidth: '1440px', margin: '0 auto', padding: `0 ${gutter}` } as const;
export const eyebrow = { font: '600 11px/16px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-fg)' } as const;
export const h2: CSSProperties = { margin: 0, maxWidth: '760px', font: '800 clamp(30px, 3.4vw, 46px)/1.1 var(--font-sans)', letterSpacing: '-0.03em', textWrap: 'balance' };
export const lead: CSSProperties = { margin: 0, maxWidth: '640px', font: '400 17px/29px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' };
export const card: CSSProperties = { padding: '28px', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' };
export const cardTitle: CSSProperties = { margin: 0, font: '700 19px/26px var(--font-sans)', letterSpacing: '-0.015em', color: 'var(--ink)', textWrap: 'balance' };
export const cardBody: CSSProperties = { margin: 0, font: '400 15px/25px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' };
export const gradientText: CSSProperties = { background: 'linear-gradient(100deg, #2BC8E8 0%, var(--blue) 45%, #7F8CFF 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
/** Columns that fold to one on a phone without a media query. */
export const cols = (min: number, gap = 20): CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`, gap: `${gap}px` });
export const textLink: CSSProperties = { color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationThickness: '1px' };
export const primaryButton: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '52px', background: 'var(--ink)', color: '#FFFFFF', border: 'none', cursor: 'pointer', font: '600 14px/20px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 24px', borderRadius: '2px', whiteSpace: 'nowrap' };

/** Structured data for search engines. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

/** "Home / Help centre": visible trail plus its BreadcrumbList schema. */
export function Breadcrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(trail)} />
      <nav aria-label="Breadcrumb">
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '8px', font: '400 14px/20px var(--font-sans)', color: 'var(--ink-muted)' }}>
          {[{ name: 'Home', path: '/' }, ...trail].map((c, i, all) => (
            <li key={c.path} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}>
              {i < all.length - 1 ? (
                <>
                  <a href={c.path} style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
                    {c.name}
                  </a>
                  <span aria-hidden="true">/</span>
                </>
              ) : (
                <span aria-current="page" style={{ color: 'var(--ink)' }}>
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** The top of a content page: breadcrumb, eyebrow, a heading whose second line is in the brand gradient, and a lead. */
export function PageHero({ label, title, accent, intro, trail, children }: { label: string; title: string; accent?: string; intro?: ReactNode; trail?: { name: string; path: string }[]; children?: ReactNode }) {
  return (
    <section aria-labelledby="page-h">
      <div style={{ ...frame, paddingTop: trail ? '24px' : '96px', paddingBottom: '64px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {trail && (
          <div style={{ marginBottom: '16px' }}>
            <Breadcrumbs trail={trail} />
          </div>
        )}
        <span style={eyebrow}>{label}</span>
        <h1 id="page-h" style={{ margin: 0, maxWidth: '1000px', font: '800 clamp(40px, 5vw, 72px)/1.04 var(--font-sans)', letterSpacing: '-0.035em', textWrap: 'balance' }}>
          <span style={{ display: 'block' }}>{title}</span>
          {accent && <span style={{ display: 'block', ...gradientText }}>{accent}</span>}
        </h1>
        {intro && <p style={{ ...lead, fontSize: '19px', lineHeight: '31px', maxWidth: '680px' }}>{intro}</p>}
        {children}
      </div>
    </section>
  );
}

/** One band of a page: an eyebrow, a heading, an optional lead, then the content. */
export function Band({ id, label, title, intro, tint = false, children }: { id: string; label: string; title: ReactNode; intro?: ReactNode; tint?: boolean; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} style={{ background: tint ? 'var(--bg-subtle)' : 'var(--bg)', borderTop: tint ? '1px solid var(--border)' : undefined, borderBottom: tint ? '1px solid var(--border)' : undefined, scrollMarginTop: '88px' }}>
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

/**
 * The audit's URL box, for pages other than the homepage. A plain GET form, so it
 * works before any script loads: it lands on `/?audit=1&url=…`, where the
 * homepage fills the address in and opens the audit dialog.
 */
export function AuditUrlBox({ title = 'See how your own site measures up.', text = 'Paste a URL. Every finding comes with the element, the rule behind it and the fix.' }: { title?: string; text?: string }) {
  return (
    <section aria-labelledby="audit-box-h" style={{ background: 'var(--blue-tint)', borderTop: '1px solid #D6E4FB', borderBottom: '1px solid #D6E4FB' }}>
      <div style={{ ...frame, paddingTop: '72px', paddingBottom: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
        <h2 id="audit-box-h" style={{ ...h2, fontSize: 'clamp(28px, 3vw, 40px)', maxWidth: '720px' }}>
          {title}
        </h2>
        <p style={{ ...lead, maxWidth: '560px' }}>{text}</p>
        <form action="/" method="get" style={{ marginTop: '12px', width: '100%', maxWidth: '620px' }}>
          <input type="hidden" name="audit" value="1" />
          <label htmlFor="audit-box-url" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }}>
            Your website address
          </label>
          <div style={{ padding: '2px', borderRadius: '2px', background: 'linear-gradient(100deg, var(--blue), #5C7CFF 55%, #9E5CFF)', boxShadow: '0 10px 30px rgba(20, 40, 90, 0.1)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '8px 8px 8px 20px' }}>
              <input id="audit-box-url" name="url" type="text" inputMode="url" autoComplete="url" placeholder="https://yourwebsite.com" style={{ flex: '1 1 200px', minWidth: 0, minHeight: '44px', border: 'none', outline: 'none', background: 'transparent', color: 'var(--ink)', font: '400 16px/24px var(--font-sans)' }} />
              <button type="submit" data-cta="primary" style={{ ...primaryButton, flex: '1 0 auto', maxWidth: '100%' }}>
                Analyze my website
              </button>
            </div>
          </div>
        </form>
        <p style={{ margin: 0, font: '400 13px/18px var(--font-sans)', color: 'var(--ink-muted)' }}>Free first audit. Just your email. No card, no install.</p>
      </div>
    </section>
  );
}

/**
 * A fact only Babar can supply. Rendered as a visible yellow placeholder so it
 * cannot be missed in review, and searchable in the code as TODO(babar).
 */
export function Todo({ children }: { children: ReactNode }) {
  return (
    <mark data-todo="babar" style={{ background: '#FFF4C2', color: '#5C4400', padding: '1px 6px', borderRadius: '3px', font: 'inherit', fontWeight: 600 }}>
      TODO(babar): {children}
    </mark>
  );
}

/** Long-form reading layout for the legal pages: a contents list beside the text. */
export function LegalLayout({ updated, sections }: { updated: string; sections: { id: string; title: string; body: ReactNode }[] }) {
  return (
    <section>
      <div data-legal style={{ ...frame, paddingBottom: '112px', display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 760px)', gap: '48px 64px', alignItems: 'start' }}>
        <nav aria-label="On this page" style={{ position: 'sticky', top: '96px', padding: '24px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px' }}>
          <span style={{ font: '700 14px/20px var(--font-sans)', color: 'var(--ink)' }}>On this page</span>
          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: 0, font: '400 14px/22px var(--font-sans)', color: 'var(--ink-secondary)' }}>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} style={{ color: 'inherit', display: 'block', padding: '11px 0' }}>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
          <span style={{ marginTop: '4px', font: '400 13px/18px var(--font-sans)', color: 'var(--ink-muted)' }}>Last updated {updated}</span>
        </nav>
        <article data-prose style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} style={{ scrollMarginTop: '96px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 id={`${s.id}-h`} style={{ margin: 0, font: '800 clamp(22px, 2.2vw, 28px)/1.2 var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                {i + 1}. {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </section>
  );
}

/** Body text inside LegalLayout and other long-form pages. */
export const prose = {
  p: { margin: 0, font: '400 16px/28px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' } as CSSProperties,
  ul: { margin: 0, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '8px', font: '400 16px/28px var(--font-sans)', color: 'var(--ink-secondary)' } as CSSProperties,
  h3: { margin: '8px 0 0', font: '700 17px/26px var(--font-sans)', color: 'var(--ink)' } as CSSProperties,
};
