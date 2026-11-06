import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogCard, Byline, Category, FreeAuditCard } from '@/components/blog/BlogCard';
import { ArticleFaq } from '@/components/blog/ArticleFaq';
import { ArticleToc } from '@/components/blog/ArticleToc';
import { BlogCover } from '@/components/blog/BlogCover';
import { ClosingCta } from '@/components/home/ClosingCta';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { POSTS, authorOf, faqsOf, headingId, outline, postBySlug, type Block } from '@/content/blog';

/** Every article is built ahead of time; any other address is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = postBySlug((await params).slug);
  if (!post) return {};
  const title = post.seoTitle ?? `${post.title} | ProCurveUX`;
  return {
    title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title, description: post.description, url: `/blog/${post.slug}`, type: 'article', publishedTime: post.date, siteName: 'ProCurveUX' },
    twitter: { card: 'summary_large_image', title, description: post.description },
  };
}

const prose = { font: '400 18px/31px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' } as const;
const strong = { fontWeight: 700, color: 'var(--ink)' } as const;

const code = { font: '500 0.86em/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: 'var(--ink)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap' } as const;
const link = { color: 'var(--accent-fg)', textDecoration: 'underline', textUnderlineOffset: '3px' } as const;

/** Running text, with `[label](/path)` set as a link and `code` in backticks as code. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)\s]+\)|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        const a = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (a) return <a key={i} href={a[2]} style={link}>{a[1]}</a>;
        if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) return <code key={i} style={code}>{part.slice(1, -1)}</code>;
        return part;
      })}
    </>
  );
}

/** A bold lead-in, then the rest of the sentence. */
const Lead = ({ lead, text }: { lead?: string; text: string }) =>
  lead ? (
    <>
      <strong style={strong}>{lead}</strong> <Inline text={text} />
    </>
  ) : (
    <Inline text={text} />
  );

function Body({ block }: { block: Block }) {
  switch (block.type) {
    case 'answer':
      return (
        <div style={{ padding: '24px 28px', background: '#FFFFFF', border: '1px solid #D6E4FB', borderRadius: '8px', boxShadow: '0 8px 24px rgba(20, 40, 90, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ font: '600 11px/16px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-fg)' }}>Short answer</span>
          <p style={{ margin: 0, font: '500 18px/31px var(--font-sans)', color: 'var(--ink)', textWrap: 'pretty' }}>{block.text}</p>
        </div>
      );
    case 'h2':
      return <h2 id={headingId(block.text)} style={{ scrollMarginTop: '104px', margin: '24px 0 0', font: '700 clamp(22px, 2.2vw, 28px)/1.25 var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--ink)', textWrap: 'balance' }}>{block.text}</h2>;
    case 'h3':
      return <h3 style={{ margin: '12px 0 0', font: '700 20px/28px var(--font-sans)', letterSpacing: '-0.015em', color: 'var(--ink)', textWrap: 'balance' }}>{block.text}</h3>;
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <List style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px', ...prose }}>
          {block.items.map((item) => (
            <li key={typeof item === 'string' ? item : item.lead} style={{ paddingLeft: '4px' }}>
              {typeof item === 'string' ? <Inline text={item} /> : <Lead {...item} />}
            </li>
          ))}
        </List>
      );
    }
    case 'tip':
      return (
        <p style={{ margin: '8px 0 0', padding: '20px 24px', background: 'var(--blue-tint)', borderLeft: '4px solid var(--blue)', borderRadius: '4px', font: '500 17px/29px var(--font-sans)', color: 'var(--ink)', textWrap: 'pretty' }}>
          <Lead lead={block.label} text={block.text} />
        </p>
      );
    case 'table':
      return (
        <div data-article-table style={{ margin: '8px 0', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: '400 15px/24px var(--font-sans)', color: 'var(--ink-secondary)' }}>
            <caption style={{ captionSide: 'bottom', padding: '12px 16px', textAlign: 'left', font: '400 13px/20px var(--font-sans)', color: 'var(--ink-muted)', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>{block.caption}</caption>
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h} scope="col" style={{ padding: '12px 16px', textAlign: 'left', verticalAlign: 'bottom', font: '600 13px/20px var(--font-sans)', color: 'var(--ink)', background: 'var(--blue-tint)', borderBottom: '1px solid #D6E4FB' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" data-label={block.head[i]} style={{ padding: '12px 16px', textAlign: 'left', verticalAlign: 'top', fontWeight: 600, color: 'var(--ink)', borderTop: '1px solid var(--border)' }}>
                        {cell}
                      </th>
                    ) : (
                      <td key={i} data-label={block.head[i]} style={{ padding: '12px 16px', verticalAlign: 'top', borderTop: '1px solid var(--border)' }}>
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'faq':
      return <ArticleFaq items={block.items} />;
    default:
      return (
        <p style={{ margin: 0, ...prose }}>
          <Lead lead={block.lead} text={block.text} />
        </p>
      );
  }
}

/** `/blog/<slug>` — one article. */
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = postBySlug((await params).slug);
  if (!post) notFound();

  const others = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Person', name: authorOf(post).name, jobTitle: authorOf(post).role, url: `https://www.procurveux.com/blog/author/${post.author}` },
    publisher: { '@type': 'Organization', name: 'ProCurveUX' },
    mainEntityOfPage: `https://www.procurveux.com/blog/${post.slug}`,
    keywords: post.tags.join(', '),
    citation: post.sources.map((s) => s.url),
    articleSection: post.category,
  };

  // Home / Blog / this article. The last is the current page, so it is not a link.
  const crumbs: { name: string; href?: string }[] = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: post.title }];
  const faqs = faqsOf(post);
  const faqSchema = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }
    : null;

  const crumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `https://www.procurveux.com${c.href ?? `/blog/${post.slug}`}`,
    })),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <SiteNav current="blog" />

      <main id="main">
        <article>
          {/* header: 960px wide, centred. Layered above the article so the Share menu
              opens over the cover (the site's load-in fade gives every header its own layer). */}
          <header style={{ position: 'relative', zIndex: 2, maxWidth: '960px', margin: '0 auto', padding: '48px clamp(16px, 5.56vw, 80px) 0', boxSizing: 'content-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <nav aria-label="Breadcrumb">
                <ol data-breadcrumb style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, font: '500 14px/20px var(--font-sans)' }}>
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
              <span style={{ marginTop: '20px', display: 'flex' }}>
                <Category post={post} />
              </span>
              <h1 style={{ margin: 0, font: '800 clamp(32px, 3.6vw, 48px)/1.1 var(--font-sans)', letterSpacing: '-0.035em', textWrap: 'balance' }}>{post.title}</h1>
              <p style={{ margin: 0, font: '400 19px/31px var(--font-sans)', color: 'var(--ink-muted)', textWrap: 'pretty' }}>{post.description}</p>
              {/* author, date and sharing on one ruled row, the line under the header */}
              <div style={{ marginTop: '12px' }}>
                <Byline post={post} />
              </div>
            </div>
          </header>

          {/* contents on the left, the article on the right */}
          <div
            data-article-grid
            // With no "More from the blog" below, the article keeps its own space above the closing section.
            style={{ maxWidth: '960px', margin: '0 auto', padding: `48px clamp(16px, 5.56vw, 80px) ${others.length ? '0' : 'clamp(72px, 8vw, 112px)'}`, boxSizing: 'content-box', display: 'grid', gridTemplateColumns: '200px minmax(0, 1fr)', gap: 'clamp(32px, 4vw, 56px)', alignItems: 'start' }}
          >
            <aside data-article-aside style={{ position: 'sticky', top: '104px' }}>
              <ArticleToc items={[...outline(post), ...(post.sources.length ? [{ id: 'references', text: 'References' }] : [])]} />
            </aside>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div data-article-cover>
                <BlogCover cover={post.cover} style={{ aspectRatio: '16 / 8', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
              <div style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {post.body.map((block, i) => (
                  <Body key={i} block={block} />
                ))}
                {post.sources.length > 0 && (
                  <section aria-labelledby="references" style={{ marginTop: '24px', paddingTop: '28px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h2 id="references" style={{ scrollMarginTop: '104px', margin: 0, font: '700 20px/28px var(--font-sans)', letterSpacing: '-0.015em' }}>
                      References
                    </h2>
                    <ol style={{ margin: 0, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '10px', font: '400 15px/24px var(--font-sans)', color: 'var(--ink-secondary)' }}>
                      {post.sources.map((src) => (
                        <li key={src.url}>
                          <span style={{ color: 'var(--ink-muted)' }}>{src.publisher}, </span>
                          <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline', padding: '2px 0', color: 'var(--accent-fg)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                            {src.title}
                          </a>
                          {src.note && <span style={{ color: 'var(--ink-muted)' }}>, {src.note}</span>}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {post.cta && (
                  <aside aria-labelledby="article-cta" style={{ marginTop: '24px', padding: 'clamp(24px, 3vw, 36px)', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--ink)', borderRadius: '8px', boxShadow: '0 12px 32px rgba(20, 40, 90, 0.1)' }}>
                    <h2 id="article-cta" style={{ margin: 0, font: '700 clamp(22px, 2.2vw, 26px)/1.25 var(--font-sans)', letterSpacing: '-0.02em', color: '#FFFFFF', textWrap: 'balance' }}>
                      {post.cta.title}
                    </h2>
                    <p style={{ margin: 0, font: '400 16px/27px var(--font-sans)', color: '#C9CDD4', textWrap: 'pretty' }}>{post.cta.text}</p>
                    <a href="/?audit=1" data-cta="primary" style={{ marginTop: '6px', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', color: 'var(--ink)', font: '600 14px/20px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 24px', borderRadius: '2px' }}>
                      Analyze my website
                    </a>
                  </aside>
                )}
              </div>
            </div>
          </div>
        </article>

        {others.length > 0 && (
          <section>
            <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '96px clamp(16px, 5.56vw, 80px) 112px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <h2 style={{ margin: 0, font: '800 clamp(28px, 2.8vw, 36px)/1.1 var(--font-sans)', letterSpacing: '-0.03em' }}>More from the blog</h2>
              <ul data-blog-list style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '48px 24px' }}>
                {others.map((p) => (
                  <li key={p.slug} style={{ display: 'flex' }}>
                    <BlogCard post={p} />
                  </li>
                ))}
                <li style={{ display: 'flex' }}>
                  <FreeAuditCard />
                </li>
              </ul>
            </div>
          </section>
        )}

        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}
