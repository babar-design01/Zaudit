import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';
import { formatDate, getPost, POSTS } from '@/content/blog';
import { Markdown } from '@/lib/markdown';
import '../blog.css';

const SITE = 'https://www.procurveux.com';

type Props = { params: Promise<{ slug: string }> };

/** Every post is built ahead of time; an unknown slug is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const title = post.seoTitle ?? post.title;
  const url = `/blog/${post.slug}`;
  return {
    title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    openGraph: {
      title,
      description: post.description,
      url,
      type: 'article',
      publishedTime: post.published,
      modifiedTime: post.updated ?? post.published,
      authors: [post.author],
    },
    twitter: { card: 'summary_large_image', title, description: post.description },
  };
}

/** `/blog/<slug>` — one post, with Article and FAQPage structured data. */
export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = `${SITE}/blog/${post.slug}`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.seoTitle ?? post.title,
      description: post.description,
      datePublished: post.published,
      dateModified: post.updated ?? post.published,
      author: { '@type': 'Person', name: post.author, jobTitle: post.authorRole },
      publisher: { '@type': 'Organization', name: 'ProCurveUX', url: SITE },
      mainEntityOfPage: url,
      keywords: post.keywords.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* JSON.stringify output contains no HTML; "<" is escaped so the script tag cannot be closed early. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <SiteNav />
      <main id="main" className="blog-wrap">
        <article className="post">
          <a className="post-back" href="/blog">
            ← All posts
          </a>
          <header className="post-head">
            <p className="blog-eyebrow">UX audits</p>
            <h1>{post.title}</h1>
            <p className="blog-meta">
              By {post.author}, {post.authorRole} · {formatDate(post.published)} · {post.readMinutes} min read
            </p>
          </header>

          <aside className="post-answer" aria-label="Short answer">
            <strong>Short answer:</strong> {post.summary}
          </aside>

          <div className="post-body">
            <Markdown source={post.body} />
          </div>

          <section className="post-author" aria-labelledby="about-author">
            <h2 id="about-author">About the author</h2>
            <p>
              {post.author} is the co-founder and design director at ZeeFrames, with 7+ years designing products in
              fintech, real estate, healthcare and e-commerce. He built ProCurveUX to automate the first pass of the UX
              reviews his team was already doing by hand.
            </p>
          </section>

          <section className="post-cta" aria-labelledby="post-cta">
            <h2 id="post-cta">Test your site the way your users experience it</h2>
            <p>
              Paste your URL into ProCurveUX. It loads your page on desktop and mobile, interacts with it like a real
              visitor, and returns a ranked fix list in about a minute.
            </p>
            <a href="/?audit=1">Analyze my website</a>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
