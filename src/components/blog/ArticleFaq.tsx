'use client';

import { useId, useState } from 'react';

/**
 * An article's questions as an accordion, in the homepage FAQ's style: one
 * open at a time, the first by default, and a second click closes it. Closed
 * answers stay in the HTML (only hidden), so search engines and the page's
 * FAQ markup still see every one.
 */
export function ArticleFaq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  const base = useId();

  return (
    <div data-article-faq style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, i) => {
        const isOpen = i === open;
        const id = `${base}-${i}`;
        return (
          <div key={item.q} style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(isOpen ? -1 : i)}
                style={{ width: '100%', minHeight: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', padding: '16px 20px 16px 24px', textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer', font: '600 17px/26px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--ink)' }}
              >
                {item.q}
                <span aria-hidden="true" data-faq-plus style={{ width: '34px', height: '34px', flexShrink: 0, border: '1px solid #DCDDE0', borderRadius: '8px', background: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16181D" strokeWidth="2" strokeLinecap="round" style={{ transform: `rotate(${isOpen ? 45 : 0}deg)`, transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            </h3>
            <p id={id} hidden={!isOpen} style={{ margin: 0, padding: '0 72px 24px 24px', font: '400 17px/29px var(--font-sans)', color: 'var(--ink-secondary)', textWrap: 'pretty' }}>
              {item.a}
            </p>
          </div>
        );
      })}
    </div>
  );
}
