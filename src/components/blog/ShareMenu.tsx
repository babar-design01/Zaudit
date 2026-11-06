'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

/**
 * One "Share" button that opens a small menu: LinkedIn, X, Facebook, WhatsApp,
 * email, and copy the link. Escape, a click elsewhere or choosing an item
 * closes it, and focus returns to the button. Each platform opens in a new tab
 * with the article's address (and title, where the platform takes one) filled in.
 */
export function ShareMenu({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key !== 'Escape') return;
        setOpen(false);
        button.current?.focus();
        return;
      }
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const items: { label: string; href: string; icon: ReactNode }[] = [
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: <path fill="currentColor" d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.44 13.3c0-3.1-1.66-4.98-4.23-4.98-1.57 0-2.6.86-3.02 1.6V8.5H9.82V20h3.37v-6.04c0-1.6.6-2.68 2-2.68 1.3 0 1.86 1.03 1.86 2.68V20h3.39v-6.7Z" /> },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, icon: <path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.57l11.1 14.45Z" /> },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <path fill="currentColor" d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.6V4.45A21 21 0 0 0 14.27 4.3c-2.3 0-3.87 1.4-3.87 3.97v2.23H7.8v3h2.6V21h3.1Z" /> },
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, icon: <path fill="currentColor" d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.26A9.5 9.5 0 1 0 12 2.5Zm0 17.3c-1.46 0-2.88-.4-4.12-1.14l-.3-.18-2.85.75.76-2.78-.19-.3A7.8 7.8 0 1 1 12 19.8Zm4.3-5.85c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.53.12-.16.24-.61.77-.75.92-.14.16-.28.18-.51.06a6.4 6.4 0 0 1-3.2-2.8c-.24-.41.24-.38.69-1.27.08-.16.04-.29-.02-.41-.06-.12-.53-1.28-.73-1.75-.19-.46-.39-.4-.53-.4h-.46a.88.88 0 0 0-.64.3 2.7 2.7 0 0 0-.84 2c0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62 1.52.66 2.12.71 2.88.6.46-.07 1.4-.57 1.6-1.13.2-.55.2-1.03.14-1.13-.06-.1-.22-.16-.46-.28Z" /> },
    { label: 'Email', href: `mailto:?subject=${t}&body=${encodeURIComponent(`${title}\n\n${url}`)}`, icon: <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5 8.5-6.5" /> },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers: select the address in a temporary field and copy that.
      const field = document.createElement('textarea');
      field.value = url;
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(true);
  };

  const row = { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minHeight: '40px', padding: '0 12px', border: 0, borderRadius: '6px', background: 'transparent', font: '500 14px/20px var(--font-sans)', color: 'var(--ink)', textAlign: 'left', cursor: 'pointer' } as const;
  const glyph = { flexShrink: 0, width: '18px', height: '18px', color: 'var(--ink-secondary)' } as const;

  return (
    <div ref={wrap} data-share-menu style={{ position: 'relative' }}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        data-share
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '40px', padding: '0 16px', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '8px', font: '500 14px/20px var(--font-sans)', color: 'var(--ink)', cursor: 'pointer' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '16px', height: '16px' }}>
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
        </svg>
        Share
      </button>

      {open && (
        <div
          id={menuId}
          role="group"
          aria-label="Share this article"
          data-share-pop
          style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 30, width: '220px', padding: '6px', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 12px 32px rgba(20, 40, 90, 0.14)' }}
        >
          <span aria-hidden="true" style={{ position: 'absolute', top: '-6px', right: '22px', width: '10px', height: '10px', background: '#FFFFFF', borderLeft: '1px solid var(--border)', borderTop: '1px solid var(--border)', transform: 'rotate(45deg)' }} />
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', position: 'relative' }}>
            {items.map((it) => (
              <li key={it.label}>
                <a href={it.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} data-share-item style={row}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" style={glyph}>
                    {it.icon}
                  </svg>
                  {it.label}
                </a>
              </li>
            ))}
            <li style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
              <button type="button" onClick={copy} data-share-item style={row}>
                <svg viewBox="0 0 24 24" fill="none" stroke={copied ? 'var(--blue)' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={glyph}>
                  {copied ? <path d="m5 12 4.5 4.5L19 7" /> : <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />}
                </svg>
                {copied ? 'Link copied' : 'Copy link'}
              </button>
            </li>
          </ul>
          <span role="status" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)' }}>
            {copied ? 'Link copied to the clipboard' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
