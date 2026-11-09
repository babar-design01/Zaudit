'use client';

import { useEffect, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui';
import { color, layout, radius, t } from '@/design/tokens';
import { Logo } from './Logo';

/** Who is signed in and what they have left, when accounts are switched on. */
export type Account = { email: string | null; credits: number } | null;

export const NAV_LINKS = [
  { label: 'About', href: '/about', id: 'about' },
  { label: 'Pricing', href: '/#plans' },
  { label: 'Blog', href: '/blog', id: 'blog' },
  { label: 'Contact', href: '/contact', id: 'contact' },
] as const;

/**
 * The nav, identical on the homepage and the report.
 *
 * 72px, white, a bottom hairline, pinned to the top of the window. Logo left; the
 * links sit right, beside the one small primary action. On the report "Sample
 * report" is the current page.
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
  current?: 'sample' | 'blog' | 'about' | 'contact';
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

  // Solid at the top of the page, glass once there is something to see through
  // it. Read on mount too, because a reload can land halfway down the page.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="site-nav" data-scrolled={scrolled ? '' : undefined}>
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
        {/* At the top of the page the PCX icon; once the page scrolls, the
            PROCURVEUX text. Both sit in one grid cell and cross-fade, so the
            nav keeps its width and nothing beside the logo moves. */}
        <a href="/" aria-label="ProcurveUX home" data-nav-logo style={{ display: 'inline-grid', alignItems: 'center', justifyItems: 'start' }}>
          <span data-logo-part="mark" aria-hidden={scrolled} style={{ gridArea: '1 / 1', opacity: scrolled ? 0 : 1, transform: scrolled ? 'translateY(-6px)' : 'none' }}>
            <Logo part="mark" height={17} />
          </span>
          <span data-logo-part="wordmark" aria-hidden={!scrolled} style={{ gridArea: '1 / 1', opacity: scrolled ? 1 : 0, transform: scrolled ? 'none' : 'translateY(6px)' }}>
            <Logo part="wordmark" height={16} />
          </span>
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
          {NAV_LINKS.map((l) => {
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
              {account ? `${account.credits} ${account.credits === 1 ? 'audit' : 'audits'} left` : 'Log in'}
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
