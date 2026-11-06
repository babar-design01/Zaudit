import { authorOf, formatDate, initials, readMinutes, type Author, type Post } from '@/content/blog';
import { BlogCover } from './BlogCover';
import { OrgLinked } from './OrgLinked';
import { ShareMenu } from './ShareMenu';

/** The topic label above a title. */
export function Category({ post, dark = false }: { post: Post; dark?: boolean }) {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        padding: '4px 10px',
        borderRadius: '4px',
        font: '600 11px/16px var(--font-sans)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        background: dark ? 'rgba(127, 178, 255, 0.16)' : '#E8F0FE',
        color: dark ? '#A8C8FF' : 'var(--accent-fg)',
      }}
    >
      {post.category}
    </span>
  );
}

/** "Nov 6, 2026 · 2 min read". */
export function DateLine({ post, dark = false }: { post: Post; dark?: boolean }) {
  return (
    <span style={{ font: '400 14px/20px var(--font-sans)', color: dark ? '#A1A6AE' : 'var(--ink-muted)' }}>
      <time dateTime={post.date}>{formatDate(post.date)}</time> · {readMinutes(post)} min read
    </span>
  );
}

/** The article's #tags. Labels, not links: there are no tag pages yet. */
export function Tags({ post, dark = false }: { post: Post; dark?: boolean }) {
  if (!post.tags.length) return null;
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {post.tags.map((tag) => (
        <span
          key={tag}
          style={{
            padding: '4px 12px',
            borderRadius: '4px',
            font: '500 13px/20px var(--font-sans)',
            color: dark ? '#E3E7EF' : 'var(--accent-fg)',
            background: dark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
            border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.16)' : '#D6E4FB'}`,
            whiteSpace: 'nowrap',
          }}
        >
          #{tag}
        </span>
      ))}
    </span>
  );
}

/** An author's photo, or their initials on ink when there is none. Decorative: the name is always beside it. */
export function AuthorPhoto({ author, size }: { author: Author; size: number }) {
  const box = { flexShrink: 0, width: `${size}px`, height: `${size}px`, borderRadius: '50%' } as const;
  if (author.photo) {
    return <img src={author.photo} alt="" width={size} height={size} style={{ ...box, objectFit: 'cover', background: 'var(--bg-subtle)' }} />;
  }
  return (
    <span aria-hidden="true" style={{ ...box, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `700 ${Math.round(size / 3.3)}px/1 var(--font-sans)`, background: 'var(--ink)', color: '#FFFFFF' }}>
      {initials(author.name)}
    </span>
  );
}

const icon = { flexShrink: 0, width: '16px', height: '16px' } as const;

/**
 * The article page's byline, one row of three groups that stack on a phone:
 *   [photo] By Muhammad Babar      (calendar) Nov 6, 2026  (clock) 2 min read      [Share]
 *           Co-Founder and ...
 * The name opens the author's page.
 */
export function Byline({ post }: { post: Post }) {
  const author = authorOf(post);
  const url = `https://www.procurveux.com/blog/${post.slug}`;
  const meta = { display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' } as const;

  return (
    <div data-byline style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px 40px', padding: '18px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      {/* who */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <AuthorPhoto author={author} size={48} />
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ font: '400 16px/24px var(--font-sans)', color: 'var(--ink)' }}>
            By{' '}
            <a href={`/blog/author/${author.id}`} rel="author" style={{ display: 'inline-block', padding: '2px 0', fontWeight: 700, color: 'var(--ink)' }}>
              {author.name}
            </a>
          </span>
          <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--ink-muted)' }}>
            <OrgLinked text={author.role} />
          </span>
        </span>
      </div>

      {/* when, and how long */}
      <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 24px', font: '400 15px/24px var(--font-sans)', color: 'var(--ink-secondary)' }}>
        <span style={meta}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={icon}>
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16M8 3v4M16 3v4" />
          </svg>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </span>
        <span style={meta}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" style={icon}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {readMinutes(post)} min read
        </span>
      </p>

      {/* share: one button, a menu of places and Copy link */}
      <ShareMenu url={url} title={post.title} />
    </div>
  );
}

/** The card that closes a grid of articles: the free audit, in place of a newsletter sign-up. */
export function FreeAuditCard() {
  return (
    <div style={{ flex: 1, minHeight: '320px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px', background: 'var(--blue-tint)', border: '1px solid #D6E4FB', borderRadius: '8px' }}>
      <span style={{ font: '600 11px/16px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-fg)' }}>Free audit</span>
      <span style={{ font: '700 24px/31px var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--ink)', textWrap: 'balance' }}>
        See which of these your site gets wrong, in about a minute.
      </span>
      <span style={{ font: '400 15px/24px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' }}>
        Paste a URL. Every finding comes with the element, the rule behind it and the fix.
      </span>
      <a href="/?audit=1" data-cta="primary" style={{ marginTop: '10px', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)', color: '#FFFFFF', font: '600 14px/20px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 24px', borderRadius: '2px' }}>
        Analyze my website
      </a>
    </div>
  );
}

/**
 * One article in a grid: cover, then category, title, short description, date
 * and reading time, and #tags. The whole card is the link. Titles and
 * descriptions are held to WORD_LIMITS in content/blog.ts, so cards line up.
 */
export function BlogCard({ post }: { post: Post }) {
  return (
    <a href={`/blog/${post.slug}`} data-blog-card style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', color: 'inherit', borderRadius: '8px' }}>
      <BlogCover cover={post.cover} style={{ aspectRatio: '16 / 10', borderRadius: '8px', border: '1px solid var(--border)' }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
        <Category post={post} />
        <span style={{ font: '700 21px/29px var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--ink)', textWrap: 'balance' }}>{post.title}</span>
        <span style={{ font: '400 15px/24px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' }}>{post.description}</span>
        <span style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DateLine post={post} />
          <Tags post={post} />
        </span>
      </span>
    </a>
  );
}
