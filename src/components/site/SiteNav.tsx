'use client';

import { useEffect, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui';
import { color, hairline, layout, radius, t } from '@/design/tokens';
import { Logo } from './Logo';

/** Who is signed in and what they have left, when accounts are switched on. */
export type Account = { email: string | null; credits: number } | null;

const LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how' },
  { label: 'Pricing', href: '/#plans' },
  { label: 'Sample report', href: '/report/sample', id: 'sample' },
  // TODO(design): Blog has no destination yet.
  { label: 'Blog', href: '#' },
] as const;

/**
 * The nav, identical on the homepage and the report.
 *
 * 72px, white, a bottom hairline. Logo left; the links sit right, beside the
 * one small primary action. On the report "Sample report" is the current page.
 */
export function SiteNav({
  onRunAudit,
  account,
  accounts = false,
  current,
}: {
  /** Opens the audit dialog. Without it the button links home to start one. */
  onRunAudit?: () => void;
  account?: Account;
  accounts?: boolean;
  /** Which link is the page the reader is on. */
  current?: 'sample';
}) {
  // TODO(design): the handoff draws the nav at 1440 only. Below 900px the
  // links fold behind a square Menu control — a desktop nav left at phone
  // width is the very fault this product's own mobile check reports.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header style={{ position: 'relative', background: color.surface, borderBottom: hairline() }}>
      <div
        style={{
          maxWidth: layout.frame,
          margin: '0 auto',
          padding: `0 ${layout.gutter}`,
          minHeight: layout.navHeight,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <a href="/" aria-label="Audix home" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Logo height={20} />
        </a>

        <button
          type="button"
          data-nav-toggle
          aria-expanded={open}
          aria-controls="site-nav-links"
          onClick={() => setOpen((o) => !o)}
          style={{
            marginLeft: 'auto',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            border: 'none',
            borderRadius: radius.button,
            boxShadow: `inset 0 0 0 1px ${color.border}`,
            background: color.surface,
            color: color.ink,
            cursor: 'pointer',
          }}
        >
          <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>Menu</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6 6 18" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>

        <nav
          id="site-nav-links"
          aria-label="Main"
          data-nav-links
          data-open={open ? '' : undefined}
          onClick={() => setOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', marginRight: 16 }}
        >
          {LINKS.map((l) => {
            const here = 'id' in l && l.id === current;
            return (
              <a
                key={l.label}
                href={l.href}
                className="ax-navlink"
                aria-current={here ? 'page' : undefined}
                style={{
                  font: t(500, 14, 20),
                  color: here ? color.ink : color.inkMuted,
                  padding: '7px 12px',
                  borderRadius: radius.lg,
                  whiteSpace: 'nowrap',
                }}
              >
                {l.label}
              </a>
            );
          })}

          {/* TODO(design): accounts are not in the handoff. Shown only when the
              deployment has them switched on, in the nav's own link style. */}
          {accounts && (
            <a
              href={account ? '/account' : '/signin'}
              className="ax-navlink"
              style={{ font: t(500, 14, 20), color: color.inkMuted, padding: '7px 12px', borderRadius: radius.lg, whiteSpace: 'nowrap' }}
            >
              {account ? `${account.credits} ${account.credits === 1 ? 'credit' : 'credits'}` : 'Log in'}
            </a>
          )}
        </nav>

        <span data-nav-cta style={{ display: 'inline-flex' }}>
          {onRunAudit ? (
            <Button size="sm" onClick={onRunAudit}>
              Run free audit
            </Button>
          ) : (
            <ButtonLink size="sm" href="/?audit=1">
              Run free audit
            </ButtonLink>
          )}
        </span>
      </div>
    </header>
  );
}

/** @deprecated The handoff has no announcement bar. Kept so old imports compile. */
export function AnnouncementBar() {
  return null;
}
