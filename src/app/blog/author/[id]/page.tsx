import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { AuthorPhoto, BlogCard } from '@/components/blog/BlogCard';
import { OrgLinked } from '@/components/blog/OrgLinked';
import { ClosingCta } from '@/components/home/ClosingCta';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { AUTHORS, postsBy, type Author, type AuthorId } from '@/content/blog';

/** One page per author, built ahead of time; any other address is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(AUTHORS).map((id) => ({ id }));
}

const find = (id: string): (Author & { id: AuthorId }) | undefined => (id in AUTHORS ? { id: id as AuthorId, ...(AUTHORS[id as AuthorId] as Author) } : undefined);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const author = find((await params).id);
  if (!author) return {};
  const title = `${author.name}, ${author.role} | ProCurveUX`;
  const description = author.bio[0];
  return {
    title,
    description,
    alternates: { canonical: `/blog/author/${author.id}` },
    openGraph: { title, description, url: `/blog/author/${author.id}`, type: 'profile', siteName: 'ProCurveUX', ...(author.photo ? { images: [author.photo] } : {}) },
  };
}

const W = '1120px';
const gutter = 'clamp(16px, 5.56vw, 80px)';
const eyebrow = { font: '600 11px/16px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-fg)' } as const;
const h2 = { margin: 0, font: '800 clamp(24px, 2.4vw, 30px)/1.15 var(--font-sans)', letterSpacing: '-0.025em' } as const;
const card = { padding: '20px 22px', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '8px' } as const;

/** 16px line icons, drawn in the current text colour. */
const ICONS: Record<string, ReactNode> = {
  role: <path d="M4 8h16v11H4zM9 8V5h6v3" />,
  pin: (
    <>
      <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  tag: <path d="M3 12V4h8l10 10-8 8L3 12Zm5-4h.01" />,
  cap: <path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v5c2 2 10 2 12 0v-5" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
};
function Icon({ name, color = 'currentColor' }: { name: keyof typeof ICONS; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, width: '16px', height: '16px' }}>
      {ICONS[name]}
    </svg>
  );
}

/** A box in the side column: an icon and a small heading over its contents. */
function SideBox({ icon, title, children }: { icon: keyof typeof ICONS; title: string; children: ReactNode }) {
  return (
    <div style={{ ...card, background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <span style={{ ...eyebrow, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon name={icon} color="var(--blue)" />
        {title}
      </span>
      {children}
    </div>
  );
}

const tick = (
  <span style={{ marginTop: '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--blue-tint)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--blue)' }}>
    <Icon name="check" />
  </span>
);

/** `/blog/author/<id>`: who writes here, why they can be trusted, and everything they have written. */
export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const author = find((await params).id);
  if (!author) notFound();

  const first = author.name.split(' ').slice(-1)[0];
  const posts = postsBy(author.id);
  const realLinks = author.links.filter((l) => l.href !== '#');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `https://www.procurveux.com/blog/author/${author.id}`,
    mainEntity: {
      '@type': 'Person',
      name: author.name,
      jobTitle: author.role,
      description: author.bio.join(' '),
      ...(author.photo ? { image: `https://www.procurveux.com${author.photo}` } : {}),
      ...(author.location ? { homeLocation: { '@type': 'Place', name: author.location } } : {}),
      worksFor: author.roles.map((r) => ({ '@type': 'Organization', name: r.org, ...(r.href ? { url: r.href } : {}) })),
      knowsAbout: [...author.expertise, ...author.topics],
      ...(realLinks.length ? { sameAs: realLinks.map((l) => l.href) } : {}),
    },
  };
  const crumbs: { name: string; href?: string }[] = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: author.name }];
  const standards = [
    'Every fact and figure links to its original source, listed under Sources at the end of each article.',
    "Guidance comes from the primary documents first: the W3C's WCAG, and Apple's and Google's own design guidelines.",
    'Illustrations are drawings of a pattern, never screenshots of a real client or a real site.',
    'Each article carries its date, so you can tell how current it is.',
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteNav current="blog" />

      <main id="main">
        {/* profile header */}
        <section style={{ background: 'linear-gradient(180deg, var(--blue-tint) 0%, var(--bg) 100%)' }}>
          <div style={{ maxWidth: W, margin: '0 auto', padding: `40px ${gutter} 48px`, boxSizing: 'content-box', display: 'flex', flexDirection: 'column', gap: '36px' }}>
            <nav aria-label="Breadcrumb">
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, font: '500 14px/20px var(--font-sans)' }}>
                {crumbs.map((c, i) => (
                  <li key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: c.href ? 0 : 1 }}>
                    {i > 0 && (
                      <span aria-hidden="true" style={{ color: 'var(--ink-muted)' }}>
                        /
                      </span>
                    )}
                    {c.href ? (
                      <a href={c.href} style={{ padding: '10px 0', margin: '-10px 0', color: 'var(--accent-fg)', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </a>
                    ) : (
                      <span aria-current="page" style={{ color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <div data-author-head style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px 32px' }}>
              <span style={{ borderRadius: '50%', padding: '5px', background: '#FFFFFF', boxShadow: '0 0 0 1px var(--border), 0 12px 28px rgba(20, 40, 90, 0.1)', display: 'inline-flex' }}>
                <AuthorPhoto author={author} size={136} />
              </span>
              <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={eyebrow}>Author</span>
                <h1 style={{ margin: 0, font: '800 clamp(36px, 4.2vw, 56px)/1.04 var(--font-sans)', letterSpacing: '-0.035em' }}>{author.name}</h1>
                <p style={{ margin: 0, font: '400 19px/28px var(--font-sans)', color: 'var(--ink-secondary)' }}>{author.tagline}</p>
                <p style={{ margin: '4px 0 0', display: 'flex', flexWrap: 'wrap', gap: '6px 20px', font: '400 14px/22px var(--font-sans)', color: 'var(--ink-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="role" />
                    <span>
                      <OrgLinked text={author.role} />
                    </span>
                  </span>
                  {author.location && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="pin" />
                      {author.location}
                    </span>
                  )}
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* about, roles and standards beside the facts */}
        <section>
          <div data-author-layout style={{ maxWidth: W, margin: '0 auto', padding: `24px ${gutter} 80px`, boxSizing: 'content-box', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 'clamp(32px, 4vw, 64px)', alignItems: 'start' }}>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '52px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={h2}>About {first}</h2>
                {author.bio.map((para) => (
                  <p key={para.slice(0, 24)} style={{ margin: 0, font: '400 17px/29px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' }}>
                    <OrgLinked text={para} />
                  </p>
                ))}
              </div>

              {author.roles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h2 style={h2}>Roles</h2>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {author.roles.map((r) => (
                      <li key={r.title + r.org} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ font: '600 16px/24px var(--font-sans)' }}>
                          {r.title},{' '}
                          {r.href ? (
                            <a href={r.href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '2px 0', color: 'var(--accent-fg)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                              {r.org}
                            </a>
                          ) : (
                            r.org
                          )}
                        </span>
                        <span style={{ font: '400 14px/22px var(--font-sans)', color: 'var(--ink-muted)' }}>{r.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={h2}>How {first} writes for ProCurveUX</h2>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {standards.map((line) => (
                    <li key={line} style={{ display: 'flex', gap: '12px', font: '400 16px/26px var(--font-sans)', color: 'var(--ink-secondary)' }}>
                      {tick}
                      {line}
                    </li>
                  ))}
                  <li style={{ display: 'flex', gap: '12px', font: '400 16px/26px var(--font-sans)', color: 'var(--ink-secondary)' }}>
                    {tick}
                    <span>
                      Spotted something wrong or out of date?{' '}
                      <a href="/#contact" style={{ display: 'inline-block', padding: '1px 0', color: 'var(--accent-fg)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                        Tell us
                      </a>{' '}
                      and it gets corrected.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* side column */}
            <aside data-author-aside style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '96px' }}>
              <SideBox icon="spark" title="Expertise">
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {author.expertise.map((e) => (
                    <li key={e} style={{ display: 'flex', gap: '10px', font: '400 14px/22px var(--font-sans)', color: 'var(--ink)' }}>
                      <span aria-hidden="true" style={{ marginTop: '8px', width: '6px', height: '6px', borderRadius: '1px', background: 'var(--blue)', flexShrink: 0 }} />
                      {e}
                    </li>
                  ))}
                </ul>
              </SideBox>

              <SideBox icon="tag" title="Writes about">
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {author.topics.map((t) => (
                    <span key={t} style={{ padding: '4px 10px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #D6E4FB', font: '500 13px/20px var(--font-sans)', color: 'var(--accent-fg)' }}>
                      {t}
                    </span>
                  ))}
                </span>
              </SideBox>

              {author.education.length > 0 && (
                <SideBox icon="cap" title="Education">
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', font: '400 14px/22px var(--font-sans)' }}>
                    {author.education.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </SideBox>
              )}

              <SideBox icon="link" title={`Find ${first} online`}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
                  {author.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        {...(l.href === '#' ? {} : { target: '_blank', rel: 'me noopener noreferrer' })}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '9px 0', font: '500 14px/22px var(--font-sans)', color: 'var(--accent-fg)', borderTop: '1px solid var(--border)' }}
                      >
                        {l.label}
                        <span aria-hidden="true">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </SideBox>
            </aside>
          </div>
        </section>

        {/* articles */}
        <section style={{ borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: W, margin: '0 auto', padding: `72px ${gutter} 112px`, boxSizing: 'content-box', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px 24px' }}>
              <h2 style={h2}>
                Articles by {author.name} <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>({posts.length})</span>
              </h2>
              <a href="/blog" style={{ padding: '10px 0', margin: '-10px 0', font: '600 14px/20px var(--font-sans)', color: 'var(--accent-fg)' }}>
                All articles →
              </a>
            </div>
            <ul data-blog-list style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '48px 24px' }}>
              {posts.map((p) => (
                <li key={p.slug} style={{ display: 'flex' }}>
                  <BlogCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}
