'use client';

import { useEffect, useState } from 'react';

/**
 * "On this page": the article's subheadings as links. Beside the article on a
 * wide screen it stays in view while the page scrolls and marks the section
 * being read; on a tablet or phone it sits above the article as a box
 * (globals.css, `[data-article-toc]`).
 */
export function ArticleToc({ items }: { items: { id: string; text: string }[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  // The section being read is the last heading that has passed the top third
  // of the window.
  useEffect(() => {
    if (!items.length) return;
    const onScroll = () => {
      const line = window.innerHeight / 3;
      let current = items[0].id;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  if (!items.length) return null;

  return (
    <nav aria-label="On this page" data-article-toc>
      <span style={{ display: 'block', marginBottom: '12px', font: '600 11px/16px var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
        On this page
      </span>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)' }}>
        {items.map(({ id, text }) => {
          const here = id === active;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={here ? 'location' : undefined}
                style={{
                  display: 'block',
                  marginLeft: '-1px',
                  padding: '9px 0 9px 16px',
                  borderLeft: `2px solid ${here ? 'var(--blue)' : 'transparent'}`,
                  font: `${here ? 600 : 400} 14px/22px var(--font-sans)`,
                  color: here ? 'var(--ink)' : 'var(--ink-muted)',
                  textWrap: 'pretty',
                }}
              >
                {text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
