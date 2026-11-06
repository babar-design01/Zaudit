'use client';

import { useState } from 'react';
import type { Post } from '@/content/blog';
import { BlogCard, FreeAuditCard } from './BlogCard';

/**
 * "Latest": topic filters over a grid of articles, with the free-audit card
 * always closing the grid. Filtering happens in the page, so every article is
 * still in the HTML for search engines and for anyone without JavaScript.
 */
export function BlogLatest({ posts }: { posts: Post[] }) {
  const topics = [...new Set(posts.map((p) => p.category))];
  const [topic, setTopic] = useState<string | null>(null);
  const shown = topic ? posts.filter((p) => p.category === topic) : posts;

  const chip = (label: string, value: string | null) => {
    const on = topic === value;
    return (
      <button
        key={label}
        type="button"
        aria-pressed={on}
        onClick={() => setTopic(value)}
        data-blog-chip
        style={{
          minHeight: '40px',
          padding: '0 16px',
          display: 'inline-flex',
          alignItems: 'center',
          font: '500 14px/20px var(--font-sans)',
          color: on ? '#FFFFFF' : 'var(--ink-secondary)',
          background: on ? 'var(--ink)' : '#FFFFFF',
          border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px 40px' }}>
        <h2 style={{ margin: 0, font: '800 clamp(30px, 3.1vw, 40px)/1.1 var(--font-sans)', letterSpacing: '-0.03em' }}>Latest</h2>
        {topics.length > 1 && (
          <div role="group" aria-label="Filter by topic" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {chip('All', null)}
            {topics.map((t) => chip(t, t))}
          </div>
        )}
      </div>

      <ul data-blog-list style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '48px 24px' }}>
        {shown.map((post) => (
          <li key={post.slug} style={{ display: 'flex' }}>
            <BlogCard post={post} />
          </li>
        ))}
        <li style={{ display: 'flex' }}>
          <FreeAuditCard />
        </li>
      </ul>
    </div>
  );
}
