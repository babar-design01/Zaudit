import type { Metadata } from 'next';
import { Category, DateLine, Tags } from '@/components/blog/BlogCard';
import { BlogCover } from '@/components/blog/BlogCover';
import { BlogLatest } from '@/components/blog/BlogLatest';
import { ClosingCta } from '@/components/home/ClosingCta';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { POSTS, featuredPost } from '@/content/blog';

const DESCRIPTION =
  'Practical UX, design and accessibility fixes you can ship this week, drawn from the checks ProCurveUX runs on every audit.';

export const metadata: Metadata = {
  title: 'Blog | ProCurveUX',
  description: DESCRIPTION,
  alternates: { canonical: '/blog' },
  openGraph: { title: 'Blog | ProCurveUX', description: DESCRIPTION, url: '/blog', type: 'website', siteName: 'ProCurveUX' },
  twitter: { card: 'summary_large_image', title: 'Blog | ProCurveUX', description: DESCRIPTION },
};

const gutter = 'clamp(16px, 5.56vw, 80px)';

/**
 * `/blog`: a two-line heading, the featured article as a wide split card,
 * then "Latest" with topic filters, and the homepage's own closing section
 * above the footer.
 */
export default function BlogIndex() {
  const featured = featuredPost();
  const latest = POSTS.filter((p) => p.slug !== featured.slug);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav current="blog" />

      <main id="main">
        {/* heading */}
        <section>
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: `88px ${gutter} 56px`, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ font: '600 11px/16px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-fg)' }}>Blog · UX field notes</span>
            <h1 style={{ margin: 0, maxWidth: '900px', font: '800 clamp(40px, 5vw, 72px)/1.04 var(--font-sans)', letterSpacing: '-0.035em', textWrap: 'balance' }}>
              <span style={{ display: 'block' }}>UX fixes that turn visitors</span>{' '}
              <span style={{ display: 'block', background: 'linear-gradient(100deg, #2BC8E8 0%, var(--blue) 45%, #7F8CFF 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                into customers.
              </span>
            </h1>
            <p style={{ margin: 0, maxWidth: '600px', font: '400 17px/29px var(--font-sans)', color: 'var(--ink-muted)', textWrap: 'pretty' }}>{DESCRIPTION}</p>
          </div>
        </section>

        {/* featured article */}
        <section aria-label="Featured article">
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: `0 ${gutter}` }}>
            <a
              href={`/blog/${featured.slug}`}
              data-blog-feature
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', borderRadius: '8px', overflow: 'hidden', background: 'var(--ink)', color: '#FFFFFF', boxShadow: '0 12px 32px rgba(20, 40, 90, 0.1)' }}
            >
              <BlogCover cover={featured.cover} style={{ minHeight: '400px' }} />
              <span style={{ padding: 'clamp(28px, 4vw, 56px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                  <span style={{ font: '600 11px/16px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7FB2FF' }}>Featured</span>
                  <Category post={featured} dark />
                </span>
                <span style={{ font: '700 clamp(28px, 2.8vw, 40px)/1.12 var(--font-sans)', letterSpacing: '-0.03em', textWrap: 'balance' }}>{featured.title}</span>
                <span style={{ font: '400 16px/27px var(--font-sans)', color: '#C9CDD4', textWrap: 'pretty' }}>{featured.description}</span>
                <DateLine post={featured} dark />
                <Tags post={featured} dark />
                <span style={{ marginTop: '8px', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', color: 'var(--ink)', font: '600 14px/20px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 24px', borderRadius: '2px' }}>
                  Read the article
                </span>
              </span>
            </a>
          </div>
        </section>

        {/* latest: the other articles. Left out while the featured one is the only one. */}
        {latest.length > 0 ? (
          <section>
            <div style={{ maxWidth: '1440px', margin: '0 auto', padding: `96px ${gutter} 112px` }}>
              <BlogLatest posts={latest} />
            </div>
          </section>
        ) : (
          <div style={{ height: '112px' }} />
        )}

        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}
