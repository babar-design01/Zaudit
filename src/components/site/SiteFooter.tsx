import { layout, t } from '@/design/tokens';
import { Logo } from './Logo';

/* Every link goes to a real page: scripts/site-checks.ts fails the build check if a `#` comes back. */
export const FOOTER_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How it works', href: '/#how' },
      { label: 'Pricing', href: '/#plans' },
      { label: 'Sample report', href: '/report/sample' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'UX laws explained', href: '/ux-laws' },
      { label: 'Accessibility checklist', href: '/accessibility-checklist' },
      { label: 'UX audit template', href: '/ux-audit-template' },
      { label: 'Help centre', href: '/help' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of service', href: '/terms' },
    ],
  },
];

const MUTED = '#A1A6AE';

/**
 * The footer, identical on the homepage and the report: near-black ground, the
 * logo in white with its brand line, three link columns, one line of small print.
 */
export function SiteFooter() {
  return (
    <footer className="ax-foot" style={{ background: '#0A0B0D', color: '#FFFFFF' }}>
      <div
        data-foot-grid
        style={{
          maxWidth: layout.frame,
          margin: '0 auto',
          padding: `72px ${layout.gutter} 48px`,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))',
          gap: 40,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Logo height={18} fill="#FFFFFF" />
          <p style={{ margin: 0, maxWidth: 320, font: t(400, 14, 22), color: MUTED }}>
            ProCurveUX: automated UX audits for live websites. Find out why visitors don&apos;t convert, and fix what
            matters first.
          </p>
        </div>

        {FOOTER_COLUMNS.map((c) => (
          <div key={c.heading} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ font: t(700, 16, 22), letterSpacing: '-0.015em', color: '#FFFFFF' }}>{c.heading}</span>
            {c.links.map((l) => (
              <a key={l.label} href={l.href} style={{ font: t(400, 14, 22), color: MUTED }}>
                {l.label}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: layout.frame, margin: '0 auto', padding: `22px ${layout.gutter} 40px`, borderTop: '1px solid #23252B' }}>
        <span style={{ font: t(400, 13, 18), color: MUTED }}>© 2026 ProCurveUX. All rights reserved.</span>
      </div>
    </footer>
  );
}
