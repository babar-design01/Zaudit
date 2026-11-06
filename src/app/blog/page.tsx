import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { formatDate, listPosts } from '@/content/blog';
import './blog.css';

const DESCRIPTION =
  'Research-backed guides on UX audits, conversion, accessibility and Core Web Vitals, with every figure linked to its source.';

export const metadata: Metadata = {
  title: 'Blog | ProCurveUX',
  description: DESCRIPTION,
  alternates: { canonical: '/blog' },
  openGraph: { title: 'Blog | ProCurveUX', description: DESCRIPTION, url: '/blog', type: 'website' },
};

/** `/blog` — every post, newest first. */
export default function BlogIndex() {
  const posts = listPosts();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <SiteNav />
      <main id="main" className="blog-wrap">
        <header className="blog-index-head">
          <p className="blog-eyebrow">Blog</p>
          <h1>UX research you can act on</h1>
          <p>{DESCRIPTION}</p>
        </header>
        <div className="blog-grid">
          {posts.map((p) => (
            <a key={p.slug} className="blog-card" href={`/blog/${p.slug}`}>
              <span className="blog-meta">
                {formatDate(p.published)} · {p.readMinutes} min read
              </span>
              <h2>{p.title}</h2>
              <p>{p.description}</p>
              <span className="blog-more">Read the post →</span>
            </a>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
